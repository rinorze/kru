"""Parsers for KRU's own exports: billing customers, monthly billed volumes, logger telemetry, pipe GIS.

Every parser is strict about what it stores and tolerant about how the file is written: comma, semicolon
or tab separators, Albanian or English column names, decimal commas, UTF-8 or Windows-1252.
Each returns (rows, errors); a row with any problem is rejected with its line number and a reason in
both languages, and the rest of the file is still accepted.
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import json
import math
import re

MAX_ERRORS = 50

ALIASES = {
    "code": ["code", "kodi", "kodi_konsumatorit", "customer_code", "customer", "shifra", "nr_konsumatorit", "account"],
    "village": ["village", "fshati", "vendbanimi", "settlement"],
    "lat": ["lat", "latitude", "gjeresia", "gjerësia", "y"],
    "lon": ["lon", "lng", "long", "longitude", "gjatesia", "gjatësia", "x"],
    "meter_year": ["meter_year", "viti_ujematesit", "viti_ujëmatësit", "meter_installed", "viti"],
    "address": ["address", "adresa", "rruga"],
    "period": ["period", "periudha", "muaji", "month", "billing_month", "data"],
    "m3": ["m3", "m³", "konsumi", "consumption", "sasia", "volume", "volumi", "billed_m3"],
    "ts": ["timestamp", "ts", "time", "koha", "datetime", "data_ora", "date_time"],
    "sensor": ["sensor", "sensori", "tag", "channel", "kanali", "id"],
    "value": ["value", "vlera", "val", "reading"],
    "unit": ["unit", "njesia", "njësia", "units"],
}
VILLAGES = {"kçiq i madh": "Kçiq i Madh", "kciq i madh": "Kçiq i Madh", "kçiq i vogël": "Kçiq i Vogël",
            "kciq i vogel": "Kçiq i Vogël", "kçiq i vogel": "Kçiq i Vogël"}
UNIT_FACTOR = {"m3/h": 1.0, "m³/h": 1.0, "m3h": 1.0, "l/s": 3.6, "ls": 3.6,
               "bar": 1.0, "m": 1 / 10.2, "mh2o": 1 / 10.2, "mwc": 1 / 10.2, "kpa": 0.01}


def _err(errors: list, line: int, sq: str, en: str) -> None:
    errors.append({"line": line, "sq": sq, "en": en})


def decode(raw: bytes) -> str:
    for enc in ("utf-8-sig", "cp1252"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1")


def read_table(raw: bytes) -> tuple[list[str], list[tuple[int, list[str]]], str]:
    """Header (normalised) and data rows with their 1-based line numbers."""
    text = decode(raw)
    first = next((ln for ln in text.splitlines() if ln.strip()), "")
    delim = max([";", ",", "\t", "|"], key=first.count)
    reader = csv.reader(io.StringIO(text), delimiter=delim)
    header: list[str] = []
    rows = []
    for n, rec in enumerate(reader, start=1):
        if not any(x.strip() for x in rec):
            continue
        if not header:
            header = [re.sub(r"[\s\-]+", "_", h.strip().lower()) for h in rec]
            continue
        rows.append((n, [x.strip() for x in rec]))
    return header, rows, delim


def column(header: list[str], key: str) -> int | None:
    for a in ALIASES[key]:
        if a in header:
            return header.index(a)
    return None


def num(s: str) -> float:
    s = s.replace(" ", "").replace(" ", "").replace("'", "")
    if "," in s and "." in s:
        s = s.replace(",", "") if s.rfind(".") > s.rfind(",") else s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")  # decimal comma, as KRU's exports write it
    v = float(s)
    if not math.isfinite(v):
        raise ValueError(s)
    return v


def period(s: str) -> str:
    s = s.strip()
    for pat, fmt in ((r"^\d{4}-\d{1,2}$", "%Y-%m"), (r"^\d{4}-\d{1,2}-\d{1,2}", "%Y-%m-%d"), (r"^\d{1,2}[/.]\d{4}$", None),
                     (r"^\d{6}$", "%Y%m"), (r"^\d{1,2}\.\d{1,2}\.\d{4}$", "%d.%m.%Y"), (r"^\d{1,2}/\d{1,2}/\d{4}$", "%d/%m/%Y")):
        if re.match(pat, s):
            if fmt is None:
                m, y = re.split(r"[/.]", s)
                d = dt.date(int(y), int(m), 1)
            else:
                d = dt.datetime.strptime(s[:10] if fmt == "%Y-%m-%d" else s, fmt).date()
            return "%04d-%02d" % (d.year, d.month)
    raise ValueError(s)


def timestamp(s: str) -> dt.datetime:
    s = s.strip().replace("Z", "+00:00")
    m = re.match(r"^(\d{1,2})[./](\d{1,2})[./](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$", s)
    if m:
        d, mo, y, h, mi, se = m.groups()
        return dt.datetime(int(y), int(mo), int(d), int(h), int(mi), int(se or 0))
    t = dt.datetime.fromisoformat(s)
    if t.tzinfo is not None:  # store local time, the way the rest of the panel reads clocks
        t = t.astimezone().replace(tzinfo=None)
    return t.replace(microsecond=0)


# ------------------------------------------------------------------ billing customers
def parse_customers(raw: bytes, bbox: tuple[float, float, float, float]) -> tuple[list[dict], list[dict]]:
    header, rows, _ = read_table(raw)
    errors: list[dict] = []
    ci = {k: column(header, k) for k in ("code", "village", "lat", "lon", "meter_year", "address")}
    if ci["code"] is None:
        _err(errors, 1, "Mungon kolona e kodit të konsumatorit (code / kodi).", "The customer code column is missing (code / kodi).")
        return [], errors
    out, seen = [], set()
    lat0, lon0, lat1, lon1 = bbox
    year = dt.date.today().year
    for n, r in rows:
        get = lambda k: r[ci[k]] if ci[k] is not None and ci[k] < len(r) else ""
        code = get("code").upper()
        if not re.match(r"^[A-Z0-9][A-Z0-9\-/_.]{1,31}$", code):
            _err(errors, n, f"Kod i pavlefshëm: '{code}'", f"Invalid code: '{code}'"); continue
        if code in seen:
            _err(errors, n, f"Kodi {code} përsëritet", f"Code {code} is repeated"); continue
        rec = {"code": code, "village": None, "lat": None, "lon": None, "meter_year": None, "address": get("address")[:160]}
        v = get("village")
        if v:
            rec["village"] = VILLAGES.get(v.lower())
            if not rec["village"]:
                _err(errors, n, f"Fshat i panjohur: '{v}' (Kçiq i Madh ose Kçiq i Vogël)", f"Unknown village: '{v}' (Kçiq i Madh or Kçiq i Vogël)"); continue
        la, lo = get("lat"), get("lon")
        if la or lo:
            try:
                rec["lat"], rec["lon"] = num(la), num(lo)
            except ValueError:
                _err(errors, n, "Koordinatat nuk janë numra", "The coordinates are not numbers"); continue
            if not (lat0 <= rec["lat"] <= lat1 and lon0 <= rec["lon"] <= lon1):
                _err(errors, n, "Koordinatat janë jashtë zonës (përdorni WGS84, gradë dhjetore)", "The coordinates are outside the zone (use WGS84 decimal degrees)"); continue
        my = get("meter_year")
        if my:
            try:
                rec["meter_year"] = int(num(my))
                if not 1950 <= rec["meter_year"] <= year:
                    raise ValueError
            except ValueError:
                _err(errors, n, f"Viti i ujëmatësit i pavlefshëm: '{my}'", f"Invalid meter year: '{my}'"); continue
        seen.add(code)
        out.append(rec)
    return out, errors


# ------------------------------------------------------------------ monthly billed volumes
def parse_readings(raw: bytes) -> tuple[list[dict], list[dict]]:
    header, rows, _ = read_table(raw)
    errors: list[dict] = []
    ci = {k: column(header, k) for k in ("code", "period", "m3")}
    missing = [k for k, v in ci.items() if v is None]
    if missing:
        _err(errors, 1, "Mungojnë kolonat: " + ", ".join(missing) + " (duhen code, period, m3)",
             "Missing columns: " + ", ".join(missing) + " (code, period, m3 are required)")
        return [], errors
    out = {}
    this_month = dt.date.today().strftime("%Y-%m")
    for n, r in rows:
        try:
            code, per, m3 = r[ci["code"]].upper(), r[ci["period"]], r[ci["m3"]]
        except IndexError:
            _err(errors, n, "Rresht i paplotë", "Incomplete row"); continue
        try:
            p = period(per)
        except ValueError:
            _err(errors, n, f"Periudhë e pavlefshme: '{per}' (p.sh. 2026-10)", f"Invalid period: '{per}' (e.g. 2026-10)"); continue
        if p > this_month:
            _err(errors, n, f"Periudha {p} është në të ardhmen", f"Period {p} is in the future"); continue
        try:
            v = num(m3)
        except ValueError:
            _err(errors, n, f"Sasia nuk është numër: '{m3}'", f"The volume is not a number: '{m3}'"); continue
        if not 0 <= v <= 100000:
            _err(errors, n, f"Sasia {v} m³ është jashtë kufijve 0–100 000", f"Volume {v} m³ is outside 0–100,000"); continue
        if not code:
            _err(errors, n, "Mungon kodi", "The code is missing"); continue
        out[(code, p)] = {"code": code, "period": p, "m3": round(v, 3)}  # a later line for the same month wins
    return list(out.values()), errors


# ------------------------------------------------------------------ logger / SCADA telemetry
def _sensor(name: str, ids: list[str]) -> str | None:
    s = name.strip().upper().replace("_", "-")
    for i in ids:
        if s == i or i.endswith("-" + s) or i.split("-", 1)[-1] == s:
            return i
    return None


def parse_telemetry(raw: bytes, sensors: dict[str, str]) -> tuple[list[tuple[str, str, float]], list[dict]]:
    """Long format (timestamp, sensor, value[, unit]) or wide format (timestamp, one column per sensor).

    sensors maps sensor id -> kind ('flow' or 'pressure'). Flow is stored in m³/h, pressure in bar."""
    header, rows, _ = read_table(raw)
    errors: list[dict] = []
    ids = list(sensors)
    ti = column(header, "ts")
    if ti is None:
        _err(errors, 1, "Mungon kolona e kohës (timestamp / koha).", "The time column is missing (timestamp / koha).")
        return [], errors
    si, vi, ui = column(header, "sensor"), column(header, "value"), column(header, "unit")
    wide = {}
    if si is None or vi is None:
        wide = {k: _sensor(h, ids) for k, h in enumerate(header) if k != ti and _sensor(h, ids)}
        if not wide:
            _err(errors, 1, "Nuk gjeta kolona sensor/vlera, as kolona me emrat e sensorëve (" + ", ".join(ids) + ").",
                 "No sensor/value columns and no columns named after the sensors (" + ", ".join(ids) + ").")
            return [], errors
    limits = {"flow": (0.0, 5000.0), "pressure": (-1.0, 25.0)}
    now = dt.datetime.now() + dt.timedelta(minutes=10)
    out = {}
    for n, r in rows:
        try:
            t = timestamp(r[ti])
        except (ValueError, IndexError):
            _err(errors, n, f"Kohë e pavlefshme: '{r[ti] if ti < len(r) else ''}'", f"Invalid time: '{r[ti] if ti < len(r) else ''}'"); continue
        if t > now:
            _err(errors, n, "Koha është në të ardhmen", "The time is in the future"); continue
        pairs = [(sid, r[k] if k < len(r) else "", "") for k, sid in wide.items()] if wide else \
            [(_sensor(r[si], ids) if si < len(r) else None, r[vi] if vi < len(r) else "", r[ui] if ui is not None and ui < len(r) else "")]
        for sid, val, unit in pairs:
            if sid is None:
                _err(errors, n, f"Sensor i panjohur: '{r[si] if si is not None and si < len(r) else ''}'", f"Unknown sensor: '{r[si] if si is not None and si < len(r) else ''}'"); break
            if val == "" and wide:
                continue  # an empty cell in a wide export is a missing sample, not an error
            try:
                v = num(val)
            except ValueError:
                _err(errors, n, f"Vlerë jo numerike: '{val}'", f"Not a number: '{val}'"); break
            u = unit.strip().lower().replace(" ", "")
            if u:
                if u not in UNIT_FACTOR:
                    _err(errors, n, f"Njësi e panjohur: '{unit}'", f"Unknown unit: '{unit}'"); break
                v *= UNIT_FACTOR[u]
            lo, hi = limits[sensors[sid]]
            if not lo <= v <= hi:
                _err(errors, n, f"{sid}: {v:g} jashtë kufijve {lo:g}–{hi:g}", f"{sid}: {v:g} outside {lo:g}–{hi:g}"); break
            out[(t.isoformat(), sid)] = (t.isoformat(), sid, round(v, 4))
    return list(out.values()), errors


# ------------------------------------------------------------------ pipe network (GIS)
def _hav(a, b) -> float:
    la1, lo1, la2, lo2 = map(math.radians, (a[1], a[0], b[1], b[0]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def parse_network(raw: bytes, bbox: tuple[float, float, float, float]) -> tuple[dict | None, float, list[dict]]:
    """GeoJSON FeatureCollection of LineString / MultiLineString pipes in WGS84. Returns (geojson, km, errors)."""
    errors: list[dict] = []
    try:
        gj = json.loads(decode(raw))
    except json.JSONDecodeError as e:
        _err(errors, e.lineno, "Skedari nuk është GeoJSON i vlefshëm", "The file is not valid GeoJSON")
        return None, 0.0, errors
    feats = gj.get("features") if isinstance(gj, dict) else None
    if not isinstance(feats, list):
        _err(errors, 1, "Pritet një FeatureCollection", "A FeatureCollection is expected")
        return None, 0.0, errors
    lat0, lon0, lat1, lon1 = bbox
    keep, length = [], 0.0
    for n, f in enumerate(feats, start=1):
        g = (f or {}).get("geometry") or {}
        lines = [g.get("coordinates")] if g.get("type") == "LineString" else g.get("coordinates") if g.get("type") == "MultiLineString" else None
        if not lines:
            _err(errors, n, f"Objekti {n}: pritet LineString ose MultiLineString", f"Feature {n}: LineString or MultiLineString expected"); continue
        try:
            pts = [(float(p[0]), float(p[1])) for ln in lines for p in ln]
        except (TypeError, ValueError, IndexError):
            _err(errors, n, f"Objekti {n}: koordinata të pavlefshme", f"Feature {n}: invalid coordinates"); continue
        if any(abs(x) > 180 or abs(y) > 90 for x, y in pts):
            _err(errors, n, f"Objekti {n}: koordinatat duken të projektuara; eksportoni në WGS84 (EPSG:4326)",
                 f"Feature {n}: the coordinates look projected; export in WGS84 (EPSG:4326)"); continue
        if not any(lat0 <= y <= lat1 and lon0 <= x <= lon1 for x, y in pts):
            _err(errors, n, f"Objekti {n}: jashtë zonës", f"Feature {n}: outside the zone"); continue
        seg = sum(_hav(ln[k], ln[k + 1]) for ln in lines for k in range(len(ln) - 1))
        props = {k: v for k, v in ((f.get("properties") or {}).items()) if isinstance(v, (str, int, float)) and len(str(v)) < 80}
        props["length_m"] = round(seg, 1)
        keep.append({"type": "Feature", "geometry": g, "properties": dict(list(props.items())[:12])})
        length += seg
    if not keep:
        return None, 0.0, errors
    return {"type": "FeatureCollection", "features": keep}, round(length / 1000, 2), errors
