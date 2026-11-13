"""Kçiq DMA model.

REAL data: building positions, terrain elevations, roads (OpenStreetMap + EU-DEM).
SIMULATED data (seeded, repeatable): customers, meter readings, flows, pressures.
Every assumption lives in ASSUMPTIONS so it can be replaced by KRU figures.
"""
from __future__ import annotations

import copy
import datetime as dt
import json
import statistics
import math
import random
from pathlib import Path

DATA = json.loads((Path(__file__).parent / "data" / "kciq_zone.json").read_text("utf-8"))
ZONE = DATA["zone"]
NEIGHBOURS = DATA["neighbours"]
STATS = DATA["stats"]
BUILDINGS: list[dict] = [{"i": i, **b} for i, b in enumerate(DATA["buildings"])]
ROADS: list[dict] = DATA["roads"]
SENSOR_POINTS: dict = {s["key"]: s for s in DATA["sensors"]}
POIS = DATA["pois"]
ROAD_KM = STATS["road_km_local"]
VILLAGES = STATS["villages"]

# ---------------------------------------------------------------- assumptions
ASSUMPTIONS: dict[str, dict] = {
    "connections": {"v": 779, "unit": "", "src": "census",
                    "sq": "Lidhje shërbimi (552 + 227 ekonomi familjare, Regjistrimi 2024)", "en": "Service connections (552 + 227 households, 2024 census)"},
    "billed_m3d": {"v": 356.0, "unit": "m³/d", "src": "estimate",
                   "sq": "Uji i faturuar (mesatarja e njësisë Mitrovicë për klient)", "en": "Billed water (Mitrovica unit average per customer)"},
    "true_cons_m3d": {"v": 424.0, "unit": "m³/d", "src": "assumption",
                      "sq": "Konsumi real, përfshirë atë të pamatur", "en": "True consumption, including unmetered use"},
    "base_leak_m3d": {"v": 565.0, "unit": "m³/d", "src": "assumption",
                      "sq": "Rrjedhja bazë (jep UPF 64% si njësia Mitrovicë)", "en": "Base leakage (gives 64% NRW like the Mitrovica unit)"},
    "mains_km": {"v": 30.0, "unit": "km", "src": "assumption",
                 "sq": "Gjatësia e rrjetit (rrugët në OSM: %s km si kufi i sipërm)" % ROAD_KM, "en": "Mains length (OSM roads: %s km as upper bound)" % ROAD_KM},
    "service_pipe_m": {"v": 10.0, "unit": "m", "src": "assumption",
                       "sq": "Tub privat nga kufiri i pronës deri te ujëmatësi (Lp në UARL; 0 nëse ujëmatësi është në kufi)", "en": "Private pipe from the property boundary to the meter (Lp in UARL; 0 if the meter is at the boundary)"},
    "hgl_low_m": {"v": 620.0, "unit": "m", "src": "assumption",
                  "sq": "Niveli hidraulik i zonës së poshtme (brezat A dhe B)", "en": "Hydraulic grade of the lower zone (bands A and B)"},
    "hgl_high_m": {"v": 700.0, "unit": "m", "src": "assumption",
                   "sq": "Niveli hidraulik i zonës me pompim (brezi C)", "en": "Hydraulic grade of the pumped zone (band C)"},
    "n1": {"v": 1.0, "unit": "", "src": "literature",
           "sq": "Eksponenti N1 presion–rrjedhje", "en": "Pressure–leakage exponent N1"},
    "under_reg_pct": {"v": 8.0, "unit": "%", "src": "assumption",
                      "sq": "Nën-regjistrimi i ujëmatësve (% e konsumit të matur)", "en": "Meter under-registration (% of metered use)"},
    "unauth_pct": {"v": 3.0, "unit": "%", "src": "assumption",
                   "sq": "Konsumi i paautorizuar (% e hyrjes)", "en": "Unauthorised consumption (% of input)"},
    "unbilled_auth_pct": {"v": 1.0, "unit": "%", "src": "assumption",
                          "sq": "Konsumi i autorizuar i pafaturuar (% e hyrjes)", "en": "Unbilled authorised consumption (% of input)"},
    "prod_cost": {"v": 0.25, "unit": "€/m³", "src": "assumption",
                  "sq": "Kosto e prodhimit dhe pompimit", "en": "Production and pumping cost"},
    "tariff": {"v": 0.53, "unit": "€/m³", "src": "sourced",
               "sq": "Tarifa shtëpiake 2026 (ARRU)", "en": "Household tariff 2026 (ARRU)"},
    "legit_night_lph": {"v": 1.7, "unit": "l/lidhje/h", "src": "literature",
                        "sq": "Konsumi legjitim i natës për lidhje", "en": "Legitimate night use per connection"},
    "min_pressure_bar": {"v": 2.5, "unit": "bar", "src": "assumption",
                         "sq": "Presioni minimal i shërbimit në pikën kritike", "en": "Minimum service pressure at the critical point"},
}
SCENARIO = {"leak_m3h": 3.2, "leak_start_day": 9}   # the demo leak; editable from the UI
DEFAULTS = copy.deepcopy(ASSUMPTIONS)
# Which datasets come from KRU's own files instead of the model. None means modelled; a dict holds the import metadata.
SOURCES: dict = {"billing": None, "telemetry": None, "network": None}
TELEMETRY: dict | None = None   # {"days": [...], "hourly": [...]} hourly inlet flow from the loggers
LATEST: dict | None = None      # newest logger value per sensor
NETWORK: dict | None = None     # pipe GeoJSON from KRU's GIS


def A(key: str) -> float:
    return ASSUMPTIONS[key]["v"]


def dist_m(a: dict, b: dict) -> float:
    dy = (a["lat"] - b["lat"]) * 111320
    dx = (a["lon"] - b["lon"]) * 81600
    return math.hypot(dx, dy)


# ---------------------------------------------------------------- customers
MONTHS: list[str] = []
_d = dt.date.today().replace(day=1)
for _ in range(12):
    _d = (_d - dt.timedelta(days=1)).replace(day=1)
    MONTHS.insert(0, _d.strftime("%Y-%m"))

_rng = random.Random(20261113)
N_CUST = int(A("connections"))
_dwell = [b["i"] for b in BUILDINGS if b["area"] >= 60]
_rng.shuffle(_dwell)
UNREGISTERED = _dwell[:18]                     # dwellings with no account: the billing–GIS check should find them
_slots = _dwell[18:]
_big = [i for i in _slots if BUILDINGS[i]["area"] >= 150]
_k = 0
while len(_slots) < N_CUST:                    # second households in larger houses
    _slots.append(_big[_k % len(_big)])
    _k += 1
_slots = _slots[:N_CUST]
CUSTOMERS: list[dict] = []
for n, bi in enumerate(_slots):
    base = math.exp(math.log(13) + 0.45 * _rng.gauss(0, 1))
    m = [max(0.5, base * (1 + 0.25 * math.sin((k - 2) / 12 * 2 * math.pi)) * (1 + 0.1 * _rng.gauss(0, 1))) for k in range(12)]
    CUSTOMERS.append({"code": "K-%d" % (10001 + n), "bi": bi, "m": m, "meter_year": _rng.choice(range(2004, 2025))})
_scale = A("billed_m3d") * 30.4 / sum(sum(c["m"]) / 12 for c in CUSTOMERS)
for c in CUSTOMERS:
    c["m"] = [x * _scale for x in c["m"]]
# things that happen in a real network
for c in _rng.sample(CUSTOMERS, 9):
    c["m"][9:] = [0, 0, 0]
for c in _rng.sample(CUSTOMERS, 7):
    c["m"][8:] = [x * 0.3 for x in c["m"][8:]]
for c in _rng.sample(CUSTOMERS, 6):
    c["m"] = [x * 0.12 for x in c["m"]]
for c in _rng.sample(CUSTOMERS, 5):
    c["m"][10:] = [x * 4.2 for x in c["m"][10:]]
for c in CUSTOMERS:
    c["m"] = [round(x, 1) for x in c["m"]]
    b = BUILDINGS[c["bi"]]
    c.update(lat=b["lat"], lon=b["lon"], elev=b["elev"], band=b["band"], village=b["village"], avg=round(sum(c["m"]) / 12, 1))
CUST_BY_CODE = {c["code"]: c for c in CUSTOMERS}
_used = {c["bi"] for c in CUSTOMERS}
NO_CUSTOMER_BUILDINGS = [b["i"] for b in BUILDINGS if b["i"] not in _used]


def _neighbour_median(c: dict, k: int = 8) -> float | None:
    if c["lat"] is None:
        return None
    pool = [o for o in CUSTOMERS if o["lat"] is not None]
    near = sorted(pool, key=lambda o: dist_m(c, o))[1:k + 1]
    vals = sorted(o["avg"] for o in near if o["avg"] is not None)
    if len(vals) == k:
        return (vals[k // 2 - 1] + vals[k // 2]) / 2
    return statistics.median(vals) if len(vals) >= 4 else None


RULES = {
    "zero": {"sq": "Lexim zero 3 muaj rresht", "en": "Zero reading 3 months running",
             "why_sq": "Ujëmatës i bllokuar, i anashkaluar ose objekt i zbrazët.", "why_en": "Stopped or bypassed meter, or an empty property."},
    "drop": {"sq": "Rënie mbi 60% ndaj historikut", "en": "Drop of over 60% against own history",
             "why_sq": "Ndërhyrje në ujëmatës ose lidhje e dytë e pamatur.", "why_en": "Meter tampering or a second, unmetered connection."},
    "peer": {"sq": "Nën 25% të fqinjëve", "en": "Below 25% of neighbours",
             "why_sq": "Konsum shumë i ulët krahasuar me 8 klientët më të afërt.", "why_en": "Very low use compared with the 8 nearest customers."},
    "spike": {"sq": "Rritje mbi 3 herë", "en": "Rise of more than 3 times",
              "why_sq": "Rrjedhje e mundshme pas ujëmatësit; njofto klientin.", "why_en": "Possible leak after the meter; notify the customer."},
}


def detect_anomalies() -> list[dict]:
    out = []
    for c in CUSTOMERS:
        m = c["m"]
        first = [x for x in m[:8] if x is not None]
        if len(first) < 4 or any(x is None for x in m[8:]):
            continue  # not enough billing history to judge this meter
        prev = sum(first) / len(first)
        last4 = sum(m[8:]) / 4
        rule = lost = expected = None
        if m[9] == m[10] == m[11] == 0 and prev > 1:
            rule, expected = "zero", prev
            lost = prev
        elif prev > 2 and last4 < 0.4 * prev:
            rule, expected = "drop", prev
            lost = prev - last4
        elif prev > 2 and sum(m[10:]) / 2 > 3 * prev:
            rule, expected = "spike", prev
            lost = 0.0
        else:
            med = _neighbour_median(c)
            if med is not None and c["avg"] < 0.25 * med:
                rule, expected = "peer", med
                lost = med - c["avg"]
        if rule:
            out.append({"code": c["code"], "rule": rule, "last": m[11], "expected": round(expected, 1),
                        "lost_m3_month": round(lost, 1), "lat": c["lat"], "lon": c["lon"], "band": c["band"], "village": c["village"],
                        "meter_year": c["meter_year"], "bi": c["bi"]})
    out.sort(key=lambda a: -a["lost_m3_month"])
    return out


ANOMALIES = detect_anomalies()


def mismatches() -> dict:
    located = [c for c in CUSTOMERS if c["lat"] is not None]
    suspects = []
    for bi in NO_CUSTOMER_BUILDINGS:
        b = BUILDINGS[bi]
        d = min((dist_m(b, c) for c in located), default=None)
        if b["area"] >= 60:
            suspects.append({"id": "B-%d" % bi, "lat": b["lat"], "lon": b["lon"], "elev": b["elev"], "band": b["band"],
                             "village": b["village"], "area": b["area"], "nearest_m": round(d) if d is not None else None})
    suspects.sort(key=lambda s: -s["area"])
    if SOURCES["billing"]:  # real export: a customer is missing from GIS when it has no coordinates
        no_gis = [{"code": c["code"], "village": c["village"], "avg": c["avg"]} for c in CUSTOMERS if c["lat"] is None]
        return {"buildings_without_customer": len(NO_CUSTOMER_BUILDINGS), "suspects": suspects, "no_gis": no_gis}
    rng = random.Random(7)
    n = round(N_CUST * (56536 - 54020) / 56536)  # same ratio as the whole company (annual report 2025)
    picked = sorted(rng.sample(CUSTOMERS, n), key=lambda c: c["code"])
    for c in picked:
        c["gis"] = False  # billed, but the meter has no point in GIS
    no_gis = [{"code": c["code"], "village": c["village"], "avg": c["avg"]} for c in picked]
    return {"buildings_without_customer": len(NO_CUSTOMER_BUILDINGS), "suspects": suspects, "no_gis": no_gis}


MISMATCH = mismatches()
MODEL_BILLING = (CUSTOMERS, MONTHS)


def _months_back(last: str, n: int = 12) -> list[str]:
    y, m = map(int, last.split("-"))
    out = []
    for _ in range(n):
        out.insert(0, "%04d-%02d" % (y, m))
        y, m = (y - 1, 12) if m == 1 else (y, m - 1)
    return out


def nearest_building(lat: float, lon: float, max_m: float = 30.0) -> int | None:
    """The building a customer's meter point belongs to: the closest one within max_m metres."""
    p = {"lat": lat, "lon": lon}
    best = min(BUILDINGS, key=lambda b: dist_m(p, b))
    return best["i"] if dist_m(p, best) <= max_m else None


def _restore(*keys: str) -> None:
    for k in keys:
        ASSUMPTIONS[k] = copy.deepcopy(DEFAULTS[k])


def _measured(key: str, value: float, note_sq: str, note_en: str) -> None:
    ASSUMPTIONS[key].update(v=round(value, 2), src="measured", sq=DEFAULTS[key]["sq"] + " — " + note_sq, en=DEFAULTS[key]["en"] + " — " + note_en)


def use_billing(customers: list[dict] | None, readings: list[dict] | None, meta: dict | None = None) -> None:
    """Run the customer register, anomalies and billing checks on KRU's billing export, or on the model when readings is None."""
    global CUSTOMERS, CUST_BY_CODE, NO_CUSTOMER_BUILDINGS, ANOMALIES, MISMATCH, MONTHS, N_CUST
    if not readings:
        CUSTOMERS, MONTHS = MODEL_BILLING
        SOURCES["billing"] = None
        _restore("connections", "billed_m3d")
    else:
        months = _months_back(max(r["period"] for r in readings))
        idx = {p: k for k, p in enumerate(months)}
        master = {c["code"]: c for c in customers or []}
        series: dict[str, list] = {}
        for r in readings:
            if r["period"] in idx:
                series.setdefault(r["code"], [None] * 12)[idx[r["period"]]] = r["m3"]
        custs = []
        for code in sorted(set(master) | set(series)):
            mc = master.get(code, {})
            lat, lon = mc.get("lat"), mc.get("lon")
            bi = nearest_building(lat, lon) if lat is not None else None
            b = BUILDINGS[bi] if bi is not None else None
            m = series.get(code, [None] * 12)
            got = [x for x in m if x is not None]
            custs.append({"code": code, "bi": bi, "m": m, "meter_year": mc.get("meter_year"), "lat": lat, "lon": lon,
                          "elev": b["elev"] if b else None, "band": b["band"] if b else None,
                          "village": mc.get("village") or (b["village"] if b else None), "address": mc.get("address", ""),
                          "avg": round(sum(got) / len(got), 1) if got else None, "gis": lat is not None})
        CUSTOMERS, MONTHS = custs, months
        SOURCES["billing"] = {**(meta or {}), "customers": len(custs), "located": sum(1 for c in custs if c["lat"] is not None),
                              "first_period": months[0], "last_period": months[-1]}
        _measured("connections", len(custs), "nga eksporti i faturimit", "from the billing export")
        # billed m³/day: the last three months that most customers were billed for
        counts = [sum(1 for c in custs if c["m"][k] is not None) for k in range(12)]
        full = [k for k in range(12) if counts[k] >= 0.5 * max(counts)][-3:]
        per_day = [sum(c["m"][k] or 0 for c in custs) / _days_in(months[k]) for k in full]
        if per_day:
            _measured("billed_m3d", sum(per_day) / len(per_day), "mesatarja e 3 muajve të fundit të faturuar", "average of the last 3 billed months")
    CUST_BY_CODE = {c["code"]: c for c in CUSTOMERS}
    used = {c["bi"] for c in CUSTOMERS if c["bi"] is not None}
    NO_CUSTOMER_BUILDINGS = [b["i"] for b in BUILDINGS if b["i"] not in used]
    N_CUST = int(A("connections"))
    ANOMALIES = detect_anomalies()
    MISMATCH = mismatches()


def _days_in(period: str) -> int:
    y, m = map(int, period.split("-"))
    nxt = dt.date(y + (m == 12), m % 12 + 1, 1)
    return (nxt - dt.date(y, m, 1)).days


def use_telemetry(hourly: list[tuple[str, float]] | None, night_p: dict[str, float] | None, latest: dict | None,
                  meta: dict | None = None) -> None:
    """Run night flow, the water balance input and the live gauges on logger data.

    hourly: [('YYYY-MM-DDTHH', mean inlet m³/h)]; night_p: median 02–04 h pressure per sensor (bar);
    latest: {'ts', 'values'}. Days with fewer than 20 hourly means are left out; at least 3 days are needed."""
    global TELEMETRY, LATEST
    _restore("hgl_low_m", "hgl_high_m")
    TELEMETRY, LATEST = None, latest
    SOURCES["telemetry"] = {**meta, "days": 0} if meta else None
    if not meta:
        return
    by_day: dict[str, dict[int, float]] = {}
    for h, v in hourly or []:
        by_day.setdefault(h[:10], {})[int(h[11:13])] = v
    days = sorted(d for d, hs in by_day.items() if len(hs) >= 20)[-DAYS:]
    if len(days) >= 3:
        series = []
        for d in days:
            hs = by_day[d]
            for h in range(24):  # fill a missing hour from the nearest hours of the same day
                if h in hs:
                    series.append(round(hs[h], 2))
                else:
                    lo = max((k for k in hs if k < h), default=None)
                    hi = min((k for k in hs if k > h), default=None)
                    near = [hs[k] for k in (lo, hi) if k is not None]
                    series.append(round(sum(near) / len(near), 2))
        TELEMETRY = {"days": days, "hourly": series}
    SOURCES["telemetry"]["days"] = len(days)
    # static pressure at night tells the real hydraulic grade: HGL = sensor elevation + pressure head
    low = [SENSOR_POINTS[k]["elev"] + night_p["DMA01-P-" + k] * 10.2 for k in ("ULET", "AZP") if night_p and "DMA01-P-" + k in night_p]
    zmax_b = max(b["elev"] for b in BUILDINGS if b["band"] != "C")
    if low and statistics.median(low) > zmax_b:
        _measured("hgl_low_m", statistics.median(low), "nga presioni i natës te sensorët", "from the night pressure at the sensors")
    if night_p and "DMA01-P-KRIT" in night_p:
        hgl = SENSOR_POINTS["KRIT"]["elev"] + night_p["DMA01-P-KRIT"] * 10.2
        if hgl > max(b["elev"] for b in BUILDINGS):
            _measured("hgl_high_m", hgl, "nga presioni i natës te pika kritike", "from the night pressure at the critical point")


def use_network(geojson: dict | None, km: float = 0.0, meta: dict | None = None) -> None:
    global NETWORK
    NETWORK = geojson
    SOURCES["network"] = meta if geojson else None
    _restore("mains_km")
    if geojson and km > 0:
        _measured("mains_km", km, "nga GIS-i i rrjetit", "from the network GIS")

# ---------------------------------------------------------------- flows
PATTERN = [0.14, 0.09, 0.075, 0.075, 0.10, 0.35, 1.0, 1.75, 1.85, 1.5, 1.3, 1.25, 1.35, 1.3, 1.1, 1.0, 1.1, 1.4, 1.75, 1.8, 1.5, 1.0, 0.55, 0.25]
_PM = sum(PATTERN) / 24
DAYS = 14


def flows() -> dict:
    if TELEMETRY:  # measured inlet flow; the demo leak never touches real data
        days, hourly = TELEMETRY["days"], TELEMETRY["hourly"]
        billed = [round(A("billed_m3d"), 1)] * len(days)
    else:
        rng = random.Random(42)
        end = dt.date.today() - dt.timedelta(days=1)
        days = [(end - dt.timedelta(days=DAYS - 1 - d)).isoformat() for d in range(DAYS)]
        hourly = []
        start = SCENARIO["leak_start_day"]
        for d in range(DAYS):
            for h in range(24):
                cons = A("true_cons_m3d") / 24 * PATTERN[h] / _PM * (1 + 0.06 * rng.gauss(0, 1))
                leak = A("base_leak_m3d") / 24 * (1.07 if h < 6 else 0.975) * (1 + 0.015 * rng.gauss(0, 1))
                if start is not None and d * 24 + h >= start * 24 + 14:
                    leak += SCENARIO["leak_m3h"]
                hourly.append(round(cons + leak, 2))
        billed = [round(A("billed_m3d") * (1 + 0.02 * rng.gauss(0, 1)), 1) for _ in range(DAYS)]
        if SOURCES["billing"]:
            billed = [round(A("billed_m3d"), 1)] * DAYS
    n = len(days)
    daily = [round(sum(hourly[d * 24:d * 24 + 24]), 1) for d in range(n)]
    mnf = [round((hourly[d * 24 + 2] + hourly[d * 24 + 3]) / 2, 2) for d in range(n)]
    k = max(1, min(7, n // 2))
    base = sum(mnf[:k]) / k
    thr = base * 1.10
    alarm_day = next((d for d in range(1, n) if mnf[d] > thr and mnf[d - 1] > thr), None)
    legit = A("connections") * A("legit_night_lph") / 1000
    extra = mnf[-1] - base
    return {
        "source": "measured" if TELEMETRY else "model",
        "days": days, "hourly": hourly, "daily": daily, "billed": billed, "mnf": mnf,
        "baseline": round(base, 2), "threshold": round(thr, 2), "legit_night": round(legit, 2),
        "alarm": None if alarm_day is None else {
            "since": days[alarm_day - 1], "extra_m3h": round(extra, 1), "extra_m3d": round(extra * 24),
            "cost_year": round(extra * 24 * 365 * A("prod_cost"))},
        "night_leak_m3h": round(mnf[-1] - legit, 1),
    }


# ---------------------------------------------------------------- pressure
def pressures(prv_on: bool = False, prv_set_bar: float = 3.0, prv_bands: str = "A") -> dict:
    """Static pressure per building from the assumed hydraulic grades; head loss ignored."""
    zmaxA = max(b["elev"] for b in BUILDINGS if b["band"] == "A")
    zmaxB = max(b["elev"] for b in BUILDINGS if b["band"] == "B")
    ref_z = zmaxB if "B" in prv_bands else zmaxA
    out = []
    for b in BUILDINGS:
        hgl = A("hgl_high_m") if b["band"] == "C" else A("hgl_low_m")
        p0 = max(0.0, (hgl - b["elev"]) / 10.2)
        p1 = p0
        if prv_on and b["band"] in prv_bands:
            p1 = min(p0, max(0.0, (ref_z + prv_set_bar * 10.2 - b["elev"]) / 10.2))
        out.append((b, p0, p1))
    n1 = A("n1")
    w0 = sum(p0 ** n1 for _, p0, _ in out) or 1
    k = A("base_leak_m3d") / w0
    bands = {}
    for key in "ABC":
        rows = [(p0, p1) for b, p0, p1 in out if b["band"] == key]
        bands[key] = {
            "buildings": len(rows),
            "p_now_min": round(min(r[0] for r in rows), 1), "p_now_avg": round(sum(r[0] for r in rows) / len(rows), 1),
            "p_now_max": round(max(r[0] for r in rows), 1),
            "p_new_min": round(min(r[1] for r in rows), 1), "p_new_avg": round(sum(r[1] for r in rows) / len(rows), 1),
            "p_new_max": round(max(r[1] for r in rows), 1),
            "leak_now": round(k * sum(r[0] ** n1 for r in rows), 1), "leak_new": round(k * sum(r[1] ** n1 for r in rows), 1),
        }
    leak_now = A("base_leak_m3d")
    leak_new = sum(v["leak_new"] for v in bands.values())
    saved = leak_now - leak_new
    pmax0 = max(p0 for _, p0, _ in out)
    pmax1 = max(p1 for b, _, p1 in out if b["band"] in prv_bands) if prv_on else pmax0
    pmax0_t = max(p0 for b, p0, _ in out if b["band"] in prv_bands)
    burst_cut = min(90.0, 1.4 * (1 - pmax1 / pmax0_t) * 100) if prv_on and pmax0_t else 0.0
    inp = A("true_cons_m3d") + leak_now
    hist = [0] * 13
    hist_new = [0] * 13
    for _, p0, p1 in out:
        hist[min(12, int(p0))] += 1
        hist_new[min(12, int(p1))] += 1
    cost = A("prod_cost")
    return {
        "bands": bands, "leak_now": round(leak_now), "leak_new": round(leak_new), "saved_m3d": round(saved),
        "saved_m3y": round(saved * 365), "saved_eur": round(saved * 365 * cost),
        "nrw_now": round((inp - A("billed_m3d")) / inp * 100, 1),
        "nrw_new": round((inp - saved - A("billed_m3d")) / (inp - saved) * 100, 1),
        "burst_cut_pct": round(burst_cut), "critical_bar": round(min(p1 for b, _, p1 in out if b["band"] in prv_bands), 1),
        "over_6bar_now": sum(1 for _, p0, _ in out if p0 > 6), "over_6bar_new": sum(1 for _, _, p1 in out if p1 > 6),
        # ARRU Rule 02/2016 s.17: 1.5–7 bar at the connection
        "arru_over_now": sum(1 for _, p0, _ in out if p0 > 7), "arru_over_new": sum(1 for _, _, p1 in out if p1 > 7),
        "arru_under_now": sum(1 for _, p0, _ in out if p0 < 1.5), "arru_under_new": sum(1 for _, _, p1 in out if p1 < 1.5),
        "hgl_low": A("hgl_low_m"), "hgl_high": A("hgl_high_m"),
        "under_min_new": sum(1 for _, _, p1 in out if p1 < A("min_pressure_bar")),
        "hist_now": hist, "hist_new": hist_new, "avg_pressure_m": round(sum(p0 for _, p0, _ in out) / len(out) * 10.2, 1),
        "points": [[b["i"], round(p0, 1), round(p1, 1)] for b, p0, p1 in out],
    }


# ---------------------------------------------------------------- water balance (IWA)
def balance() -> dict:
    f = flows()
    inp = sum(f["daily"][-7:]) / 7
    billed = sum(f["billed"][-7:]) / 7
    unbilled_auth = inp * A("unbilled_auth_pct") / 100
    unauth = inp * A("unauth_pct") / 100
    under = billed * A("under_reg_pct") / (100 - A("under_reg_pct"))  # meters record (100-p)% of true use
    apparent = unauth + under
    real = max(0.0, inp - billed - unbilled_auth - apparent)
    nrw = inp - billed
    lm, nc = A("mains_km"), A("connections")
    lp = nc * A("service_pipe_m") / 1000
    p = pressures()["avg_pressure_m"]
    uarl = (18 * lm + 0.8 * nc + 25 * lp) * p / 1000  # m3/day
    ili = real / uarl if uarl else 0
    band = "A" if ili < 4 else "B" if ili < 8 else "C" if ili < 16 else "D"
    return {
        "input": round(inp), "billed": round(billed), "unbilled_auth": round(unbilled_auth),
        "unauth": round(unauth), "under_reg": round(under), "apparent": round(apparent), "real": round(real),
        "nrw": round(inp) - round(billed), "nrw_pct": round(nrw / inp * 100, 1),
        "real_l_conn_day": round(real * 1000 / nc), "real_m3_km_day": round(real / lm, 1),
        "uarl": round(uarl, 1), "ili": round(ili, 1), "ili_band": band, "avg_pressure_m": p,
        "value_tariff": round(nrw * 365 * A("tariff")),
        "value_real_cost": round(real * 365 * A("prod_cost")),
        "value_apparent_tariff": round(apparent * 365 * A("tariff")),
    }


# ---------------------------------------------------------------- live sensors
SENSORS = [
    {"id": "DMA01-Q-HYRJA", "kind": "flow", "unit": "m³/h", "sq": "Matësi i hyrjes", "en": "Inlet meter", "lat": None, "lon": None, "elev": None},
    {"id": "DMA01-P-KRIT", "kind": "pressure", "unit": "bar", "sq": "Pika kritike (më e larta)", "en": "Critical point (highest)", **SENSOR_POINTS["KRIT"]},
    {"id": "DMA01-P-ULET", "kind": "pressure", "unit": "bar", "sq": "Pika më e ulët", "en": "Lowest point", **SENSOR_POINTS["ULET"]},
    {"id": "DMA01-P-AZP", "kind": "pressure", "unit": "bar", "sq": "Pika mesatare e zonës", "en": "Average zone point", **SENSOR_POINTS["AZP"]},
]


def live_reading() -> dict:
    if LATEST:
        return {**LATEST, "source": "measured"}
    now = dt.datetime.now()
    h = now.hour + now.minute / 60
    lo, hi = PATTERN[int(h) % 24], PATTERN[(int(h) + 1) % 24]
    pat = lo + (hi - lo) * (h - int(h))
    rng = random.Random(int(now.timestamp() // 2))
    leak = A("base_leak_m3d") / 24 + (SCENARIO["leak_m3h"] if SCENARIO["leak_start_day"] is not None else 0)
    q = A("true_cons_m3d") / 24 * pat / _PM + leak
    q *= 1 + 0.02 * rng.gauss(0, 1)
    drop = 0.9 * (pat / max(PATTERN)) ** 2  # head loss grows with demand
    vals = {
        "DMA01-Q-HYRJA": round(q, 1),
        "DMA01-P-KRIT": round(max(0.2, (A("hgl_high_m") - SENSOR_POINTS["KRIT"]["elev"]) / 10.2 - drop + 0.03 * rng.gauss(0, 1)), 2),
        "DMA01-P-ULET": round((A("hgl_low_m") - SENSOR_POINTS["ULET"]["elev"]) / 10.2 - drop * 0.5 + 0.03 * rng.gauss(0, 1), 2),
        "DMA01-P-AZP": round((A("hgl_low_m") - SENSOR_POINTS["AZP"]["elev"]) / 10.2 - drop * 0.7 + 0.03 * rng.gauss(0, 1), 2),
    }
    return {"ts": now.isoformat(timespec="seconds"), "values": vals, "source": "model"}
