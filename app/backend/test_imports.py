"""Tests for loading KRU's own exports. Run: python -m pytest -q

The files are written the way Kosovo utility exports usually look: semicolons, decimal commas,
Albanian column names, l/s for flow, wide logger exports. They are test fixtures, not panel data.
"""
import datetime as dt
import json
import os
import tempfile

os.environ.setdefault("KCIQ_DB", os.path.join(tempfile.mkdtemp(), "test.db"))

import pytest
from fastapi.testclient import TestClient

import main
import sim

c = TestClient(main.app)


def post(kind, text, **params):
    q = "&".join("%s=%s" % kv for kv in params.items())
    return c.post("/api/data/import/%s?%s" % (kind, q), content=text.encode("utf-8"), headers={"Content-Type": "text/csv"})


@pytest.fixture(autouse=True)
def back_to_model():
    yield
    for d in ("billing", "telemetry", "network"):
        c.delete("/api/data/" + d)


def _months(n=12):
    d = dt.date.today().replace(day=1)
    out = []
    for _ in range(n):
        d = (d - dt.timedelta(days=1)).replace(day=1)
        out.insert(0, d.strftime("%Y-%m"))
    return out


def test_billing_export_replaces_the_model_and_comes_back():
    base = c.get("/api/balance").json()
    b1, b2 = sim.BUILDINGS[10], sim.BUILDINGS[200]
    cust = "\n".join([
        "Kodi;Fshati;Gjerësia;Gjatësia;Viti_ujëmatësit;Adresa",
        "A-1;Kçiq i Madh;%s;%s;2015;Rruga 1" % (str(b1["lat"]).replace(".", ","), str(b1["lon"]).replace(".", ",")),
        "A-2;;%s;%s;2019;Rruga 2" % (b2["lat"], b2["lon"]),
        "A-3;Kçiq i Vogël;;;2010;pa koordinata",
        "A-1;Kçiq i Madh;1;1;2015;dublikatë",
        "A-4;Prishtinë;;;;",
        "A-5;;43,5;21,9;;jashtë zonës",
    ])
    r = post("customers", cust, filename="klientet.csv").json()
    assert r["accepted"] == 3 and r["rejected"] == 3
    assert {e["line"] for e in r["errors"]} == {5, 6, 7}

    rows = ["kodi;periudha;konsumi"]
    for k, p in enumerate(_months()):
        rows += ["A-1;%s;%s" % (p, "12,5"), "A-2;%s;%s" % (p, "0" if k >= 9 else "14"), "A-3;%s;9" % p]
    rows += ["A-1;2099-01;5", "A-2;muaj;5", "A-3;%s;abc" % _months()[0]]
    r = post("readings", "\n".join(rows)).json()
    assert r["accepted"] == 36 and r["rejected"] == 3

    st = r["status"]["billing"]["active"]
    assert st["customers"] == 3 and st["located"] == 2
    assert sim.A("connections") == 3 and sim.ASSUMPTIONS["connections"]["src"] == "measured"
    an = c.get("/api/anomalies").json()
    assert [(a["code"], a["rule"]) for a in an["rows"]] == [("A-2", "zero")]
    mm = c.get("/api/mismatches").json()
    assert [x["code"] for x in mm["no_gis"]] == ["A-3"]
    d = c.get("/api/customers/A-3").json()  # no GIS point: compared with its village
    assert d["lat"] is None and len(d["readings"]) == 12
    assert c.get("/api/customers/A-1").json()["village"] == "Kçiq i Madh"
    assert c.get("/api/buildings/B-10").json()["customers"][0]["code"] == "A-1"
    assert c.post("/api/readings", json={"code": "A-3", "reading": 9}).json()["warning"] is None

    c.delete("/api/data/billing")
    assert c.get("/api/balance").json() == base and sim.A("connections") == 779


def _logger_rows(days=5, leak_from=None):
    t0 = dt.datetime.combine(dt.date.today() - dt.timedelta(days=days), dt.time())
    rows = ["timestamp;sensor;value;unit"]
    for h in range(days * 24):
        t = t0 + dt.timedelta(hours=h)
        flow_ls = (6.0 if t.hour in (2, 3) else 14.0) + (1.0 if leak_from is not None and h >= leak_from * 24 else 0)
        rows.append("%s;HYRJA;%s;l/s" % (t.strftime("%d.%m.%Y %H:%M"), str(flow_ls).replace(".", ",")))
        rows.append("%s;DMA01-P-ULET;10,9;bar" % t.isoformat())
        rows.append("%s;AZP;62;m" % t.isoformat())
    return rows


def test_logger_export_drives_night_flow_live_and_grade():
    r = post("telemetry", "\n".join(_logger_rows(5, leak_from=3) + ["31.02.2026 10:00;HYRJA;1;l/s", "2026-01-01T00:00;NOPE;1;bar"])).json()
    assert r["accepted"] == 5 * 24 * 3 and r["rejected"] == 2
    f = c.get("/api/flows").json()
    assert f["source"] == "measured" and len(f["days"]) == 5 and len(f["hourly"]) == 120
    assert abs(f["mnf"][0] - 6.0 * 3.6) < 0.01                     # l/s converted to m³/h
    assert f["alarm"] is not None                                   # +1 l/s for the last two nights
    live = c.get("/api/live").json()
    assert live["source"] == "measured" and abs(live["values"]["DMA01-P-AZP"] - 62 / 10.2) < 0.01
    assert sim.ASSUMPTIONS["hgl_low_m"]["src"] == "measured"
    assert c.get("/api/data/status").json()["telemetry"]["flow_days"] == 5
    c.put("/api/scenario", json={"leak_m3h": 9, "leak_start_day": 7})  # the demo leak must not touch real data
    assert c.get("/api/flows").json()["hourly"] == f["hourly"]
    c.put("/api/scenario", json={"leak_m3h": 3.2, "leak_start_day": 9})


def test_wide_logger_export_and_too_little_data():
    t = dt.datetime.combine(dt.date.today() - dt.timedelta(days=1), dt.time(2))
    wide = "Koha,DMA01-Q-HYRJA,DMA01-P-KRIT\n%s,30.5,\n%s,31.0,2.4\n" % (t.isoformat(), (t + dt.timedelta(hours=1)).isoformat())
    r = post("telemetry", wide).json()
    assert r["accepted"] == 3 and r["rejected"] == 0
    assert c.get("/api/flows").json()["source"] == "model"          # 2 hours is not a day: night flow stays modelled
    assert c.get("/api/live").json()["source"] == "measured"


def test_pipe_network_geojson():
    b = sim.BUILDINGS[0]
    line = {"type": "Feature", "properties": {"material": "PE", "dn": 110},
            "geometry": {"type": "LineString", "coordinates": [[b["lon"], b["lat"]], [b["lon"] + 0.01, b["lat"]]]}}
    projected = {"type": "Feature", "properties": {}, "geometry": {"type": "LineString", "coordinates": [[7480000, 4750000], [7480100, 4750000]]}}
    r = c.post("/api/data/import/network", content=json.dumps({"type": "FeatureCollection", "features": [line, projected]}).encode()).json()
    assert r["accepted"] == 1 and r["rejected"] == 1 and "WGS84" in r["errors"][0]["en"]
    assert 0.7 < sim.A("mains_km") < 0.9 and sim.ASSUMPTIONS["mains_km"]["src"] == "measured"
    assert c.get("/api/network").json()["features"][0]["properties"]["dn"] == 110


def test_bad_requests():
    assert post("customers", "").status_code == 400
    assert post("nope", "a").status_code == 404
    r = post("readings", "kodi;sasia\nA;1").json()
    assert r["accepted"] == 0 and "period" in r["errors"][0]["en"]
    assert c.get("/api/data/template/readings.csv").text.strip("﻿\r\n") == "code;period;m3"
