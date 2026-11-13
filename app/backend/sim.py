"""Kçiq DMA model.

REAL data: building positions, terrain elevations, roads (OpenStreetMap + EU-DEM).
SIMULATED data (seeded, repeatable): customers, meter readings, flows, pressures.
Every assumption lives in ASSUMPTIONS so it can be replaced by KRU figures.
"""
from __future__ import annotations

import datetime as dt
import json
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


def _neighbour_median(c: dict, k: int = 8) -> float:
    near = sorted(CUSTOMERS, key=lambda o: dist_m(c, o))[1:k + 1]
    vals = sorted(o["avg"] for o in near)
    return (vals[k // 2 - 1] + vals[k // 2]) / 2


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
        prev = sum(m[:8]) / 8
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
            if c["avg"] < 0.25 * med:
                rule, expected = "peer", med
                lost = med - c["avg"]
        if rule:
            out.append({"code": c["code"], "rule": rule, "last": m[11], "expected": round(expected, 1),
                        "lost_m3_month": round(lost, 1), "lat": c["lat"], "lon": c["lon"], "band": c["band"], "village": c["village"],
                        "meter_year": c["meter_year"]})
    out.sort(key=lambda a: -a["lost_m3_month"])
    return out


ANOMALIES = detect_anomalies()


def mismatches() -> dict:
    suspects = []
    for bi in NO_CUSTOMER_BUILDINGS:
        b = BUILDINGS[bi]
        d = min(dist_m(b, c) for c in CUSTOMERS)
        if b["area"] >= 60:
            suspects.append({"id": "B-%d" % bi, "lat": b["lat"], "lon": b["lon"], "elev": b["elev"], "band": b["band"],
                             "village": b["village"], "area": b["area"], "nearest_m": round(d)})
    suspects.sort(key=lambda s: -s["area"])
    rng = random.Random(7)
    n = round(N_CUST * (56536 - 54020) / 56536)  # same ratio as the whole company (annual report 2025)
    picked = sorted(rng.sample(CUSTOMERS, n), key=lambda c: c["code"])
    for c in picked:
        c["gis"] = False  # billed, but the meter has no point in GIS
    no_gis = [{"code": c["code"], "village": c["village"], "avg": c["avg"]} for c in picked]
    return {"buildings_without_customer": len(NO_CUSTOMER_BUILDINGS), "suspects": suspects, "no_gis": no_gis}


MISMATCH = mismatches()

# ---------------------------------------------------------------- flows
PATTERN = [0.14, 0.09, 0.075, 0.075, 0.10, 0.35, 1.0, 1.75, 1.85, 1.5, 1.3, 1.25, 1.35, 1.3, 1.1, 1.0, 1.1, 1.4, 1.75, 1.8, 1.5, 1.0, 0.55, 0.25]
_PM = sum(PATTERN) / 24
DAYS = 14


def flows() -> dict:
    rng = random.Random(42)
    end = dt.date.today() - dt.timedelta(days=1)
    days = [end - dt.timedelta(days=DAYS - 1 - d) for d in range(DAYS)]
    hourly = []
    start = SCENARIO["leak_start_day"]
    for d in range(DAYS):
        for h in range(24):
            cons = A("true_cons_m3d") / 24 * PATTERN[h] / _PM * (1 + 0.06 * rng.gauss(0, 1))
            leak = A("base_leak_m3d") / 24 * (1.07 if h < 6 else 0.975) * (1 + 0.015 * rng.gauss(0, 1))
            if start is not None and d * 24 + h >= start * 24 + 14:
                leak += SCENARIO["leak_m3h"]
            hourly.append(round(cons + leak, 2))
    daily = [round(sum(hourly[d * 24:d * 24 + 24]), 1) for d in range(DAYS)]
    mnf = [round((hourly[d * 24 + 2] + hourly[d * 24 + 3]) / 2, 2) for d in range(DAYS)]
    billed = [round(A("billed_m3d") * (1 + 0.02 * rng.gauss(0, 1)), 1) for _ in range(DAYS)]
    base = sum(mnf[:7]) / 7
    thr = base * 1.10
    alarm_day = next((d for d in range(1, DAYS) if mnf[d] > thr and mnf[d - 1] > thr), None)
    legit = N_CUST * A("legit_night_lph") / 1000
    extra = mnf[-1] - base
    return {
        "days": [x.isoformat() for x in days], "hourly": hourly, "daily": daily, "billed": billed, "mnf": mnf,
        "baseline": round(base, 2), "threshold": round(thr, 2), "legit_night": round(legit, 2),
        "alarm": None if alarm_day is None else {
            "since": days[alarm_day - 1].isoformat(), "extra_m3h": round(extra, 1), "extra_m3d": round(extra * 24),
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
    return {"ts": now.isoformat(timespec="seconds"), "values": vals}
