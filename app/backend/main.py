"""Kçiq DMA Panel API (FastAPI).

Run:  python -m uvicorn main:app --port 8000   (from this folder)
Docs: http://localhost:8000/docs
If ../frontend/dist exists it is served at /, so one process runs the whole app.
"""
from __future__ import annotations

import asyncio
import csv
import datetime as dt
import io
import json
import os
import secrets
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import imports
import plan
import sim

app = FastAPI(title="Kçiq DMA Panel API", version="1.0", docs_url="/api/docs", openapi_url="/api/openapi.json",
              description="Prototype API for a pilot District Metered Area in Kçiq i Madh. "
                          "Terrain and buildings are real; flows, pressures and customers are simulated.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB = Path(os.environ.get("KCIQ_DB", Path(__file__).parent / "kciq.db"))


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


with db() as _c:
    _c.execute("""create table if not exists work_orders(
        id integer primary key autoincrement, kind text, ref text, title text, lat real, lon real,
        status text default 'open', note text default '', created text, updated text)""")
    _c.execute("""create table if not exists field_readings(
        id integer primary key autoincrement, code text, reading real, lat real, lon real, note text, ts text)""")
    # Digital service contracts. Append-only: SQLite triggers refuse UPDATE and DELETE, and every row
    # carries the SHA-256 of its content plus the previous row's hash, so any later edit breaks the chain.
    _c.execute("""create table if not exists contracts(
        id integer primary key autoincrement, number text unique, customer_code text unique, building text,
        data text, signature text, created text, prev_hash text, hash text)""")
    _c.execute("""create trigger if not exists contracts_no_update before update on contracts
        begin select raise(abort, 'contracts are append-only'); end""")
    _c.execute("""create trigger if not exists contracts_no_delete before delete on contracts
        begin select raise(abort, 'contracts are append-only'); end""")
    # private key for the full contract (personal number and signature); only the signer receives it
    if "access" not in [col[1] for col in _c.execute("pragma table_info(contracts)")]:
        _c.execute("alter table contracts add column access text")
    # KRU's own data, loaded from its exports through /api/data/import. When present it replaces the model.
    _c.execute("create table if not exists imp_customers(code text primary key, village text, lat real, lon real, meter_year integer, address text)")
    _c.execute("create table if not exists imp_readings(code text, period text, m3 real, primary key(code, period))")
    _c.execute("create table if not exists telemetry(ts text, sensor text, value real, primary key(ts, sensor))")
    _c.execute("create table if not exists imp_network(id integer primary key check(id = 1), geojson text, km real)")
    _c.execute("""create table if not exists import_log(id integer primary key autoincrement, kind text, filename text,
        accepted integer, rejected integer, at text)""")


SENSOR_KIND = {s["id"]: s["kind"] for s in sim.SENSORS}
_lats = [b["lat"] for b in sim.BUILDINGS]
_lons = [b["lon"] for b in sim.BUILDINGS]
BBOX = (min(_lats) - 0.01, min(_lons) - 0.013, max(_lats) + 0.01, max(_lons) + 0.013)  # the zone plus about 1 km


def _last_import(con: sqlite3.Connection, *kinds: str) -> dict | None:
    r = con.execute("select filename, at from import_log where kind in (%s) order by id desc limit 1" % ",".join("?" * len(kinds)), kinds).fetchone()
    return {"file": r["filename"], "at": r["at"]} if r else None


def reload_imports() -> None:
    """Point the model at whatever KRU data is stored; anything missing stays modelled."""
    with db() as con:
        readings = [dict(r) for r in con.execute("select code, period, m3 from imp_readings")]
        customers = [dict(r) for r in con.execute("select * from imp_customers")]
        sim.use_billing(customers, readings or None, _last_import(con, "readings", "customers"))

        n, t0, t1 = con.execute("select count(*), min(ts), max(ts) from telemetry").fetchone()
        if n:
            hourly = [(h, v) for h, v in con.execute(
                "select substr(ts, 1, 13), avg(value) from telemetry where sensor = 'DMA01-Q-HYRJA' group by 1 order by 1")]
            since = (dt.datetime.fromisoformat(t1) - dt.timedelta(days=7)).isoformat()
            night = {}
            for sid, kind in SENSOR_KIND.items():
                if kind != "pressure":
                    continue
                vals = [v for (v,) in con.execute("select value from telemetry where sensor = ? and ts >= ? and substr(ts, 12, 2) in ('02', '03')", (sid, since))]
                if vals:
                    night[sid] = sorted(vals)[len(vals) // 2]
            latest_rows = con.execute("select sensor, value, max(ts) as ts from telemetry group by sensor").fetchall()
            latest = {"ts": max(r["ts"] for r in latest_rows), "values": {r["sensor"]: r["value"] for r in latest_rows}}
            meta = {**(_last_import(con, "telemetry") or {}), "rows": n, "from": t0, "to": t1}
            sim.use_telemetry(hourly, night, latest, meta)
        else:
            sim.use_telemetry(None, None, None, None)

        net = con.execute("select geojson, km from imp_network").fetchone()
        sim.use_network(json.loads(net["geojson"]) if net else None, net["km"] if net else 0.0,
                        {**(_last_import(con, "network") or {}), "km": net["km"], "pipes": len(json.loads(net["geojson"])["features"])} if net else None)


reload_imports()


# ------------------------------------------------------------------ zone
@app.get("/api/zone")
def zone():
    st = sim.STATS
    by_v = {}
    for v in ("Kçiq i Madh", "Kçiq i Vogël"):
        bs = [b for b in sim.BUILDINGS if b["village"] == v]
        by_v[v] = {**sim.VILLAGES[v], "buildings": len(bs), "customers": sum(1 for c in sim.CUSTOMERS if c["village"] == v),
                   "elev_min": min(b["elev"] for b in bs), "elev_max": max(b["elev"] for b in bs)}
    return {"name": "Kçiq i Madh dhe Kçiq i Vogël", "dma": "DMA01", "cadastral_zone": st["zone"],
            "population": sum(v["population"] for v in sim.VILLAGES.values()),
            "households": sum(v["households"] for v in sim.VILLAGES.values()),
            "villages": by_v, "buildings": st["buildings"], "dwellings": st["buildings_over_60m2"],
            "elev_min": st["elev_min"], "elev_median": st["elev_median"], "elev_max": st["elev_max"],
            "road_km": st["road_km_local"], "bands": st["bands"], "boundary": sim.ZONE, "neighbours": sim.NEIGHBOURS,
            "pois": sim.POIS, "today": dt.date.today().isoformat()}


@app.get("/api/buildings")
def buildings():
    return sim.BUILDINGS


def _building_index(ref: str) -> int:
    """Accept 'B-123' or '123'."""
    try:
        i = int(ref.upper().removeprefix("B-"))
    except ValueError:
        raise HTTPException(404, "Ndërtesa nuk u gjet / Building not found: %s" % ref)
    if not 0 <= i < len(sim.BUILDINGS):
        raise HTTPException(404, "Ndërtesa nuk u gjet / Building not found: %s" % ref)
    return i


@app.get("/api/buildings/{ref}")
def building(ref: str):
    """Everything the panel knows about one building: terrain, pressure, accounts, flags, field work."""
    i = _building_index(ref)
    b = sim.BUILDINGS[i]
    _, p0, p1 = sim.pressures(True, 3.0, "A")["points"][i]
    flagged = {a["code"]: a for a in sim.ANOMALIES}
    accounts = [c for c in sim.CUSTOMERS if c["bi"] == i]
    custs = [{"code": c["code"], "avg": c["avg"], "last": c["m"][-1], "meter_year": c["meter_year"],
              "gis": c.get("gis", True), "rule": flagged[c["code"]]["rule"] if c["code"] in flagged else None,
              "lost_m3_month": flagged[c["code"]]["lost_m3_month"] if c["code"] in flagged else 0} for c in accounts]
    use = [None if all(c["m"][k] is None for c in accounts) else round(sum(c["m"][k] or 0 for c in accounts), 1) for k in range(12)]
    suspect = next((s for s in sim.MISMATCH["suspects"] if s["id"] == "B-%d" % i), None)
    sensors = sorted(({"id": s["id"], "sq": s["sq"], "en": s["en"], "distance_m": round(sim.dist_m(b, s))}
                      for s in sim.SENSORS if s["lat"] is not None), key=lambda s: s["distance_m"])
    with db() as con:
        orders = [dict(r) for r in con.execute("select id,kind,ref,title,status,lat,lon,created from work_orders where status<>'done'")
                  if r["lat"] is not None and sim.dist_m(b, {"lat": r["lat"], "lon": r["lon"]}) < 60]
        contracts = [{"number": r["number"], "customer_code": r["customer_code"], "created": r["created"],
                      "name": json.loads(r["data"])["full_name"]}
                     for r in con.execute("select number,customer_code,created,data from contracts where building=? order by id", ("B-%d" % i,))]
    hgl = sim.A("hgl_high_m") if b["band"] == "C" else sim.A("hgl_low_m")
    return {**b, "ref": "B-%d" % i, "hgl_m": hgl, "p_now": p0, "p_prv": p1,
            "arru": "over" if p0 > 7 else "under" if p0 < 1.5 else "ok",
            "customers": custs, "months": sim.MONTHS, "use": use, "suspect": suspect,
            "sensors": sensors, "orders": orders, "contracts": contracts}


@app.get("/api/roads")
def roads():
    return sim.ROADS


@app.get("/api/sensors")
def sensors():
    return sim.SENSORS


@app.get("/api/live")
def live():
    return sim.live_reading()


@app.get("/api/stream")
async def stream():
    """Server-sent events, one reading every 2 s — the same pattern as KRU's Monitoring API."""
    async def gen():
        while True:
            yield "data: %s\n\n" % json.dumps(sim.live_reading())
            await asyncio.sleep(2)
    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


# ------------------------------------------------------------------ analytics
@app.get("/api/flows")
def flows():
    return sim.flows()


@app.get("/api/balance")
def balance():
    return sim.balance()


class PressureIn(BaseModel):
    prv_on: bool = True
    prv_set_bar: float = Field(3.0, ge=1.5, le=8)
    prv_bands: str = Field("A", pattern="^(A|AB)$")
    capex: float = Field(15000, ge=0)


@app.post("/api/pressure")
def pressure(p: PressureIn):
    r = sim.pressures(p.prv_on, p.prv_set_bar, p.prv_bands)
    # express NRW against the same 7-day water balance the rest of the panel shows
    b = sim.balance()
    r["nrw_now"] = b["nrw_pct"]
    r["nrw_new"] = round((b["nrw"] - r["saved_m3d"]) / (b["input"] - r["saved_m3d"]) * 100, 1)
    r["payback_months"] = round(p.capex / r["saved_eur"] * 12, 1) if r["saved_eur"] > 0 else None
    return r


@app.get("/api/assumptions")
def get_assumptions():
    return sim.ASSUMPTIONS


class AssumptionIn(BaseModel):
    values: dict[str, float]


@app.put("/api/assumptions")
def put_assumptions(a: AssumptionIn):
    locked = {"connections"}  # customers are generated once from this
    may_be_zero = {"unauth_pct", "under_reg_pct", "unbilled_auth_pct", "legit_night_lph", "base_leak_m3d"}
    for k, v in a.values.items():  # validate everything first, then apply, so a bad value changes nothing
        if k not in sim.ASSUMPTIONS or k in locked:
            raise HTTPException(400, "Supozim i panjohur ose i kyçur / Unknown or locked assumption: %s" % k)
        if v < 0 or (v == 0 and k not in may_be_zero):
            raise HTTPException(400, "Vlera duhet të jetë pozitive / Value must be positive: %s" % k)
        if k.endswith("_pct") and v >= 50:
            raise HTTPException(400, "Përqindja duhet të jetë nën 50 / Percentage must be under 50: %s" % k)
    if a.values.get("hgl_low_m", sim.A("hgl_low_m")) <= max(b["elev"] for b in sim.BUILDINGS if b["band"] != "C"):
        raise HTTPException(400, "Niveli hidraulik duhet të jetë mbi ndërtesën më të lartë të brezit B / Hydraulic grade must be above the highest band B building")
    for k, v in a.values.items():
        sim.ASSUMPTIONS[k]["v"] = float(v)
    return sim.ASSUMPTIONS


class ScenarioIn(BaseModel):
    leak_m3h: float = Field(3.2, ge=0, le=30)
    leak_start_day: int | None = Field(9, ge=7, le=12)


@app.get("/api/scenario")
def get_scenario():
    return sim.SCENARIO


@app.put("/api/scenario")
def put_scenario(s: ScenarioIn):
    sim.SCENARIO.update(s.model_dump())
    return sim.SCENARIO


# ------------------------------------------------------------------ customers
@app.get("/api/customers")
def customers(q: str = "", band: str = "", village: str = "", limit: int = 100):
    rows = [c for c in sim.CUSTOMERS if q.upper() in c["code"] and (not band or c["band"] == band) and (not village or c["village"] == village)]
    flagged = {a["code"]: a["rule"] for a in sim.ANOMALIES}
    return {"total": len(rows), "rows": [
        {"code": c["code"], "band": c["band"], "village": c["village"], "elev": c["elev"], "avg": c["avg"], "last": c["m"][-1],
         "meter_year": c["meter_year"], "rule": flagged.get(c["code"]), "lat": c["lat"], "lon": c["lon"]}
        for c in rows[:limit]]}


@app.get("/api/customers/{code}")
def customer(code: str):
    c = sim.CUST_BY_CODE.get(code)
    if not c:
        raise HTTPException(404, "Customer not found")
    an = next((a for a in sim.ANOMALIES if a["code"] == code), None)
    if c["lat"] is not None:
        near = sorted((o for o in sim.CUSTOMERS if o["lat"] is not None and o is not c), key=lambda o: sim.dist_m(c, o))[:8]
    else:  # no GIS point: compare with the customers of the same village
        near = [o for o in sim.CUSTOMERS if o is not c and o["village"] == c["village"]]
    peer = []
    for k in range(12):
        vals = [o["m"][k] for o in near if o["m"][k] is not None]
        peer.append(round(sum(vals) / len(vals), 1) if vals else None)
    with db() as con:
        fr = [dict(r) for r in con.execute("select * from field_readings where code=? order by id desc", (code,))]
    return {**{k: c[k] for k in ("code", "band", "village", "elev", "avg", "meter_year", "lat", "lon", "bi")},
            "months": sim.MONTHS, "readings": c["m"], "peer": peer, "anomaly": an, "field_readings": fr}


@app.get("/api/anomalies")
def anomalies():
    lost = sum(a["lost_m3_month"] for a in sim.ANOMALIES)
    by_rule = {}
    for a in sim.ANOMALIES:
        by_rule[a["rule"]] = by_rule.get(a["rule"], 0) + 1
    return {"rules": sim.RULES, "rows": sim.ANOMALIES, "by_rule": by_rule, "lost_m3_month": round(lost),
            "lost_eur_year": round(lost * 12 * sim.A("tariff"))}


@app.get("/api/mismatches")
def mismatches():
    return sim.MISMATCH


# ------------------------------------------------------------------ field work
class WorkOrderIn(BaseModel):
    kind: str = Field(pattern="^(anomaly|suspect|leak|pressure|other)$")
    ref: str = ""
    title: str = Field(min_length=3, max_length=200)
    lat: float | None = None
    lon: float | None = None
    note: str = ""


class WorkOrderPatch(BaseModel):
    status: str | None = Field(None, pattern="^(open|field|done)$")
    note: str | None = None


@app.get("/api/workorders")
def list_orders():
    with db() as con:
        return [dict(r) for r in con.execute("select * from work_orders order by id desc")]


@app.post("/api/workorders")
def create_order(w: WorkOrderIn):
    now = dt.datetime.now().isoformat(timespec="seconds")
    with db() as con:
        dup = con.execute("select id from work_orders where ref=? and ref<>'' and status<>'done'", (w.ref,)).fetchone()
        if dup:
            raise HTTPException(409, "Ekziston tashmë një urdhër i hapur për %s / An open work order already exists for %s" % (w.ref, w.ref))
        cur = con.execute("insert into work_orders(kind,ref,title,lat,lon,note,created,updated) values(?,?,?,?,?,?,?,?)",
                          (w.kind, w.ref, w.title, w.lat, w.lon, w.note, now, now))
        return dict(con.execute("select * from work_orders where id=?", (cur.lastrowid,)).fetchone())


@app.patch("/api/workorders/{oid}")
def patch_order(oid: int, p: WorkOrderPatch):
    with db() as con:
        row = con.execute("select * from work_orders where id=?", (oid,)).fetchone()
        if not row:
            raise HTTPException(404, "Work order not found")
        status = p.status or row["status"]
        note = row["note"] if p.note is None else p.note
        con.execute("update work_orders set status=?, note=?, updated=? where id=?",
                    (status, note, dt.datetime.now().isoformat(timespec="seconds"), oid))
        return dict(con.execute("select * from work_orders where id=?", (oid,)).fetchone())


@app.delete("/api/workorders/{oid}")
def delete_order(oid: int):
    with db() as con:
        con.execute("delete from work_orders where id=?", (oid,))
    return {"ok": True}


class ReadingIn(BaseModel):
    code: str
    reading: float = Field(ge=0)
    lat: float | None = None
    lon: float | None = None
    note: str = ""


@app.post("/api/readings")
def add_reading(r: ReadingIn):
    c = sim.CUST_BY_CODE.get(r.code)
    if not c:
        raise HTTPException(404, "Konsumatori nuk u gjet / Customer not found: %s" % r.code)
    warn = None
    hist = [x for x in c["m"][:8] if x is not None]
    prev = sum(hist) / len(hist) if hist else 0
    if r.reading == 0:
        warn = "zero"
    elif prev and r.reading > 3 * prev:
        warn = "high"
    elif prev and r.reading < 0.4 * prev:
        warn = "low"
    far = None
    if r.lat is not None and r.lon is not None and c["lat"] is not None:
        far = round(sim.dist_m({"lat": r.lat, "lon": r.lon}, c))
    with db() as con:
        con.execute("insert into field_readings(code,reading,lat,lon,note,ts) values(?,?,?,?,?,?)",
                    (r.code, r.reading, r.lat, r.lon, r.note, dt.datetime.now().isoformat(timespec="seconds")))
    return {"ok": True, "warning": warn, "expected": round(prev, 1), "distance_m": far}


@app.get("/api/readings")
def list_readings():
    with db() as con:
        return [dict(r) for r in con.execute("select * from field_readings order by id desc limit 100")]


# ------------------------------------------------------------------ registration and digital contracts
class RegistrationIn(BaseModel):
    full_name: str = Field(min_length=3, max_length=120)
    personal_no: str = Field(pattern=r"^\d{10}$")
    phone: str = Field(pattern=r"^\+?[0-9 ]{8,18}$")
    email: str = Field("", max_length=120, pattern=r"^$|^[^@\s]+@[^@\s]+\.[^@\s]+$")
    village: str = Field(pattern="^(Kçiq i Madh|Kçiq i Vogël)$")
    address: str = Field(min_length=3, max_length=160)
    building: str = Field("", max_length=12)
    use_type: str = Field(pattern="^(household|commercial|institution)$")
    persons: int = Field(1, ge=1, le=40)
    start_date: dt.date
    lang: str = Field("sq", pattern="^(sq|en)$")
    accept_terms: bool
    accept_data: bool
    signature: str = Field(min_length=100, max_length=300_000, pattern=r"^data:image/png;base64,[A-Za-z0-9+/=]+$")


def _contract_hash(number: str, code: str, building: str, data: str, signature: str, created: str, prev: str) -> str:
    import hashlib
    sig = hashlib.sha256(signature.encode()).hexdigest()
    payload = json.dumps([number, code, building, data, sig, created, prev], ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


def _mask(pn: str) -> str:
    return pn[:2] + "•" * 6 + pn[-2:]


def _contract_out(r: sqlite3.Row, full: bool) -> dict:
    d = json.loads(r["data"])
    out = {"number": r["number"], "customer_code": r["customer_code"], "building": r["building"], "created": r["created"],
           "hash": r["hash"], "prev_hash": r["prev_hash"], **d}
    if full:
        out["signature"] = r["signature"]
    else:
        out["personal_no"] = _mask(d["personal_no"])
    return out


@app.post("/api/contracts")
def create_contract(f: RegistrationIn):
    if not (f.accept_terms and f.accept_data):
        raise HTTPException(400, "Duhet të pranoni kushtet dhe përpunimin e të dhënave / You must accept the terms and data processing")
    if f.start_date < dt.date.today():
        raise HTTPException(400, "Data e fillimit nuk mund të jetë në të kaluarën / The start date cannot be in the past")
    building = ""
    if f.building.strip():
        bi = _building_index(f.building.strip())
        building = "B-%d" % bi
        if sim.BUILDINGS[bi]["village"] != f.village:
            raise HTTPException(400, "Ndërtesa %s është në %s / Building %s is in %s" % (building, sim.BUILDINGS[bi]["village"], building, sim.BUILDINGS[bi]["village"]))
    now = dt.datetime.now()
    data = {"full_name": f.full_name.strip(), "personal_no": f.personal_no, "phone": f.phone.strip(), "email": f.email.strip(),
            "village": f.village, "address": f.address.strip(), "use_type": f.use_type, "persons": f.persons,
            "start_date": f.start_date.isoformat(), "lang": f.lang,
            "tariff": sim.A("tariff") if f.use_type == "household" else None}
    with db() as con:
        for r in con.execute("select building,data from contracts where building=? and building<>''", (building,)):
            if json.loads(r["data"])["personal_no"] == f.personal_no:
                raise HTTPException(409, "Ky person ka tashmë kontratë për %s / This person already has a contract for %s" % (building, building))
        last = con.execute("select id, hash from contracts order by id desc limit 1").fetchone()
        seq = (last["id"] if last else 0) + 1
        number = "KRU-MI-%d-%05d" % (now.year, seq)
        code = "K-%d" % (20000 + seq)  # new accounts start at K-20001, after the 779 existing ones
        created = now.isoformat(timespec="seconds")
        prev = last["hash"] if last else "0" * 64
        blob = json.dumps(data, ensure_ascii=False, sort_keys=True)
        h = _contract_hash(number, code, building, blob, f.signature, created, prev)
        access = secrets.token_urlsafe(16)
        con.execute("insert into contracts(number,customer_code,building,data,signature,created,prev_hash,hash,access) values(?,?,?,?,?,?,?,?,?)",
                    (number, code, building, blob, f.signature, created, prev, h, access))
        return {**_contract_out(con.execute("select * from contracts where number=?", (number,)).fetchone(), True), "access": access}


@app.get("/api/contracts")
def list_contracts():
    with db() as con:
        return [_contract_out(r, False) for r in con.execute("select * from contracts order by id desc")]


@app.get("/api/contracts/{number}")
def get_contract(number: str, k: str = ""):
    """One contract, with an integrity check: its own hash and the link to the contract before it.

    Contract numbers are sequential, so without the signer's access key `k` the personal number
    is masked and the signature withheld."""
    with db() as con:
        r = con.execute("select * from contracts where number=?", (number,)).fetchone()
        if not r:
            raise HTTPException(404, "Kontrata nuk u gjet / Contract not found: %s" % number)
        prev = con.execute("select hash from contracts where id<? order by id desc limit 1", (r["id"],)).fetchone()
    own_ok = _contract_hash(r["number"], r["customer_code"], r["building"], r["data"], r["signature"], r["created"], r["prev_hash"]) == r["hash"]
    chain_ok = r["prev_hash"] == (prev["hash"] if prev else "0" * 64)
    full = bool(k) and bool(r["access"]) and secrets.compare_digest(k, r["access"])
    return {**_contract_out(r, full), "verified": own_ok and chain_ok, "full": full}


# ------------------------------------------------------------------ KRU data import
TEMPLATES = {"customers": "code;village;lat;lon;meter_year;address", "readings": "code;period;m3",
             "telemetry": "timestamp;sensor;value;unit"}


def data_status() -> dict:
    with db() as con:
        cnt = lambda t: con.execute("select count(*) from %s" % t).fetchone()[0]
        per_sensor = {r[0]: {"rows": r[1], "from": r[2], "to": r[3]} for r in
                      con.execute("select sensor, count(*), min(ts), max(ts) from telemetry group by sensor")}
        log = [dict(r) for r in con.execute("select * from import_log order by id desc limit 12")]
        return {
            "billing": {"active": sim.SOURCES["billing"], "customer_rows": cnt("imp_customers"), "reading_rows": cnt("imp_readings")},
            "telemetry": {"active": sim.SOURCES["telemetry"] if sim.TELEMETRY or sim.LATEST else None, "flow_days": len(sim.TELEMETRY["days"]) if sim.TELEMETRY else 0,
                          "sensors": per_sensor},
            "network": {"active": sim.SOURCES["network"]},
            "log": log,
        }


@app.get("/api/data/status")
def get_data_status():
    return data_status()


@app.post("/api/data/import/{kind}")
async def import_data(kind: str, request: Request, filename: str = "", replace: bool = False):
    """Upload a file as the raw request body. customers and network replace what is stored;
    readings and telemetry add to it (a repeated month or timestamp overwrites), unless replace=true."""
    if kind not in ("customers", "readings", "telemetry", "network"):
        raise HTTPException(404, "Lloj i panjohur të dhënash / Unknown data kind: %s" % kind)
    raw = await request.body()
    if not raw.strip():
        raise HTTPException(400, "Skedari është bosh / The file is empty")
    if len(raw) > 60 * 1024 * 1024:
        raise HTTPException(413, "Skedari është mbi 60 MB; ndajeni në pjesë / The file is over 60 MB; split it")
    now = dt.datetime.now().isoformat(timespec="seconds")
    with db() as con:
        if kind == "customers":
            rows, errors = imports.parse_customers(raw, BBOX)
            if rows:
                con.execute("delete from imp_customers")
                con.executemany("insert into imp_customers values(:code, :village, :lat, :lon, :meter_year, :address)", rows)
        elif kind == "readings":
            rows, errors = imports.parse_readings(raw)
            if rows and replace:
                con.execute("delete from imp_readings")
            con.executemany("insert or replace into imp_readings values(:code, :period, :m3)", rows)
        elif kind == "telemetry":
            rows, errors = imports.parse_telemetry(raw, SENSOR_KIND)
            if rows and replace:
                con.execute("delete from telemetry")
            con.executemany("insert or replace into telemetry values(?, ?, ?)", rows)
        else:
            gj, km, errors = imports.parse_network(raw, BBOX)
            rows = gj["features"] if gj else []
            if gj:
                con.execute("insert or replace into imp_network values(1, ?, ?)", (json.dumps(gj, ensure_ascii=False), km))
        con.execute("insert into import_log(kind, filename, accepted, rejected, at) values(?,?,?,?,?)",
                    (kind, filename[:120], len(rows), len(errors), now))
    reload_imports()
    return {"kind": kind, "accepted": len(rows), "rejected": len(errors), "errors": errors[:imports.MAX_ERRORS], "status": data_status()}


@app.delete("/api/data/{dataset}")
def clear_data(dataset: str):
    """Remove an imported dataset; that part of the panel goes back to the model."""
    tables = {"billing": ["imp_customers", "imp_readings"], "telemetry": ["telemetry"], "network": ["imp_network"]}
    if dataset not in tables:
        raise HTTPException(404, "Unknown dataset: %s" % dataset)
    with db() as con:
        for t in tables[dataset]:
            con.execute("delete from %s" % t)
        con.execute("insert into import_log(kind, filename, accepted, rejected, at) values(?, '', 0, 0, ?)",
                    ("clear-" + dataset, dt.datetime.now().isoformat(timespec="seconds")))
    reload_imports()
    return data_status()


@app.get("/api/data/template/{kind}.csv")
def template(kind: str):
    if kind not in TEMPLATES:
        raise HTTPException(404, "Unknown template")
    return StreamingResponse(iter(["\ufeff" + TEMPLATES[kind] + "\r\n"]), media_type="text/csv",
                             headers={"Content-Disposition": 'attachment; filename="kru_%s.csv"' % kind})


@app.get("/api/network")
def network():
    return sim.NETWORK or {"type": "FeatureCollection", "features": []}


# ------------------------------------------------------------------ plan, budget, exports
def targets() -> list[dict]:
    """Targets derived from the model, so they move with the assumptions.

    Month 6: PRV on band A at 3 bar, the new leak repaired, flagged meters and suspect dwellings billed.
    Month 12: active leakage control removes a further 30% of the remaining real losses.
    """
    b, f = sim.balance(), sim.flows()
    pr = sim.pressures(True, 3.0, "A")
    nc = sim.A("connections")
    last, first = f["daily"][-7:], f["daily"][:7]
    leak_in_avg = sum(last) / len(last) - sum(first) / len(first)  # the new leak inside the 7-day balance
    rec = sum(a["lost_m3_month"] for a in sim.ANOMALIES) / 30 + len(sim.MISMATCH["suspects"]) * 0.4
    billed = b["billed"] + rec
    apparent = max(0.0, b["apparent"] - rec)
    real6 = max(0.0, b["real"] - pr["saved_m3d"] - max(0.0, leak_in_avg))
    real12 = real6 * 0.7

    def nrw(real):
        inp = billed + b["unbilled_auth"] + apparent + real
        return (inp - billed) / inp * 100

    night_leak = f["night_leak_m3h"]
    mnf = lambda real: f["legit_night"] + night_leak * real / b["real"]
    pct = lambda x: ("%.1f%%" % x).replace(".0%", "%")
    gis = (nc - len(sim.MISMATCH["no_gis"])) / nc * 100
    return [
        {"sq": "Uji pa të ardhura", "en": "Non-revenue water", "base": pct(b["nrw_pct"]), "m6": pct(nrw(real6)), "m12": pct(nrw(real12))},
        {"sq": "Humbjet reale (l/lidhje/ditë)", "en": "Real losses (l/connection/day)", "base": "%d" % b["real_l_conn_day"],
         "m6": "%d" % (real6 * 1000 / nc), "m12": "%d" % (real12 * 1000 / nc)},
        {"sq": "Rrjedha minimale e natës", "en": "Minimum night flow", "base": "%.1f m³/h" % mnf(b["real"]), "m6": "%.1f m³/h" % mnf(real6), "m12": "%.1f m³/h" % mnf(real12)},
        {"sq": "Presioni maksimal në brezin A", "en": "Maximum pressure in band A", "base": "%.1f bar" % pr["bands"]["A"]["p_now_max"],
         "m6": "%.1f bar" % pr["bands"]["A"]["p_new_max"], "m12": "%.1f bar" % pr["bands"]["A"]["p_new_max"]},
        {"sq": "Ndërtesa mbi 7 bar (ARRU)", "en": "Buildings above 7 bar (ARRU)", "base": "%d" % pr["arru_over_now"], "m6": "%d" % pr["arru_over_new"], "m12": "%d" % pr["arru_over_new"]},
        {"sq": "Presioni në pikën kritike", "en": "Pressure at the critical point", "base": "për t'u matur / to be measured", "m6": "≥ 2.5 bar", "m12": "≥ 2.5 bar"},
        {"sq": "Konsumatorë me pikë në GIS", "en": "Customers with a GIS point", "base": pct(gis), "m6": "100%", "m12": "100%"},
    ]


@app.get("/api/plan")
def get_plan():
    return {**plan.PLAN, "targets": targets(),
            "targets_note": {"sq": "Muaji 6: PRV në brezin A në 3 bar, rrjedhja e re e riparuar, ujëmatësit e shënuar dhe banesat e dyshimta në faturim. Muaji 12: kontrolli aktiv i rrjedhjeve heq edhe 30% të humbjeve reale që mbeten. Ndërtesat që mbeten mbi 7 bar janë në fund të brezit B dhe të brezit C me pompë; për to duhet një PRV e dytë, jashtë këtij buxheti. Vlerat rillogariten kur ndryshoni supozimet.",
                             "en": "Month 6: PRV on band A at 3 bar, the new leak repaired, flagged meters and suspect dwellings billed. Month 12: active leakage control removes a further 30% of the remaining real losses. The buildings still above 7 bar sit at the bottom of band B and of the pumped band C; they need a second PRV, outside this budget. Values recalculate when you change the assumptions."}}


@app.get("/api/export/{name}.csv")
def export(name: str):
    if name == "anomalies":
        rows = sim.ANOMALIES
    elif name == "suspects":
        rows = sim.MISMATCH["suspects"]
    elif name == "no_gis":
        rows = sim.MISMATCH["no_gis"]
    elif name == "workorders":
        rows = list_orders()
    else:
        raise HTTPException(404, "Unknown export")
    buf = io.StringIO()
    if not rows and name == "workorders":
        buf.write("id,kind,ref,title,lat,lon,status,note,created,updated" + chr(10))
    if rows:
        w = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    return StreamingResponse(iter(["﻿" + buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": 'attachment; filename="kciq_%s.csv"' % name})


# ------------------------------------------------------------------ serve the built frontend
DIST = (Path(__file__).parent.parent / "frontend" / "dist").resolve()
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        f = (DIST / path).resolve()
        # only files inside dist; "/..%2f..%2fbackend/kciq.db" must not reach the database
        return FileResponse(f if path and f.is_relative_to(DIST) and f.is_file() else DIST / "index.html")
