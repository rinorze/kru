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
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import plan
import sim

app = FastAPI(title="Kçiq DMA Panel API", version="1.0", docs_url="/api/docs", openapi_url="/api/openapi.json",
              description="Prototype API for a pilot District Metered Area in Kçiq i Madh. "
                          "Terrain and buildings are real; flows, pressures and customers are simulated.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB = Path(__file__).parent / "kciq.db"


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
    near = sorted(sim.CUSTOMERS, key=lambda o: sim.dist_m(c, o))[1:9]
    peer = [round(sum(o["m"][k] for o in near) / 8, 1) for k in range(12)]
    with db() as con:
        fr = [dict(r) for r in con.execute("select * from field_readings where code=? order by id desc", (code,))]
    return {**{k: c[k] for k in ("code", "band", "village", "elev", "avg", "meter_year", "lat", "lon")},
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
    prev = sum(c["m"][:8]) / 8
    if r.reading == 0:
        warn = "zero"
    elif prev and r.reading > 3 * prev:
        warn = "high"
    elif prev and r.reading < 0.4 * prev:
        warn = "low"
    far = None
    if r.lat is not None and r.lon is not None:
        far = round(sim.dist_m({"lat": r.lat, "lon": r.lon}, c))
    with db() as con:
        con.execute("insert into field_readings(code,reading,lat,lon,note,ts) values(?,?,?,?,?,?)",
                    (r.code, r.reading, r.lat, r.lon, r.note, dt.datetime.now().isoformat(timespec="seconds")))
    return {"ok": True, "warning": warn, "expected": round(prev, 1), "distance_m": far}


@app.get("/api/readings")
def list_readings():
    with db() as con:
        return [dict(r) for r in con.execute("select * from field_readings order by id desc limit 100")]


# ------------------------------------------------------------------ plan, budget, exports
def targets() -> list[dict]:
    """Targets derived from the model, so they move with the assumptions.

    Month 6: PRV on band A at 3 bar, the new leak repaired, flagged meters and suspect dwellings billed.
    Month 12: active leakage control removes a further 30% of the remaining real losses.
    """
    b, f = sim.balance(), sim.flows()
    pr = sim.pressures(True, 3.0, "A")
    nc = sim.A("connections")
    leak_in_avg = sum(f["daily"][-7:]) / 7 - sum(f["daily"][:7]) / 7  # the new leak inside the 7-day balance
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
DIST = Path(__file__).parent.parent / "frontend" / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        f = DIST / path
        return FileResponse(f if path and f.is_file() else DIST / "index.html")
