"""Smoke tests for the API. Run: python -m pytest -q  (or python test_api.py)"""
from fastapi.testclient import TestClient

import main
import sim

c = TestClient(main.app)


def test_all_get_endpoints():
    for p in ["zone", "buildings", "roads", "flows", "balance", "anomalies", "mismatches", "sensors", "live", "plan",
              "assumptions", "customers?limit=2", "customers/K-10001", "workorders", "readings"]:
        r = c.get("/api/" + p)
        assert r.status_code == 200, (p, r.text[:300])


def test_zone_covers_both_villages():
    z = c.get("/api/zone").json()
    assert set(z["villages"]) == {"Kçiq i Madh", "Kçiq i Vogël"}
    assert z["households"] == 779 and z["population"] == 4276
    assert sum(v["customers"] for v in z["villages"].values()) == 779


def test_balance_adds_up():
    b = c.get("/api/balance").json()
    assert abs(b["input"] - (b["billed"] + b["unbilled_auth"] + b["apparent"] + b["real"])) <= 2
    assert 0 < b["nrw_pct"] < 100 and b["ili"] > 0


def test_pressure_reduction_saves_water_and_respects_minimum():
    r = c.post("/api/pressure", json={"prv_on": True, "prv_set_bar": 3.0, "prv_bands": "A"}).json()
    assert r["saved_m3d"] > 0 and r["leak_new"] < r["leak_now"]
    assert r["critical_bar"] >= 3.0 - 0.05
    off = c.post("/api/pressure", json={"prv_on": False}).json()
    assert off["saved_m3d"] == 0


def test_mismatch_finds_unregistered_dwellings():
    m = c.get("/api/mismatches").json()
    ids = {s["id"] for s in m["suspects"]}
    assert all("B-%d" % i in ids for i in sim.UNREGISTERED)


def test_workorder_lifecycle_and_duplicate_guard():
    r = c.post("/api/workorders", json={"kind": "anomaly", "ref": "K-TEST", "title": "Kontrollo ujëmatësin"})
    assert r.status_code == 200
    oid = r.json()["id"]
    assert c.post("/api/workorders", json={"kind": "anomaly", "ref": "K-TEST", "title": "dup"}).status_code == 409
    assert c.patch("/api/workorders/%d" % oid, json={"status": "done"}).json()["status"] == "done"
    c.delete("/api/workorders/%d" % oid)


def test_field_reading_warns_on_zero():
    r = c.post("/api/readings", json={"code": "K-10001", "reading": 0}).json()
    assert r["warning"] == "zero"
    import sqlite3
    con = sqlite3.connect(main.DB)
    con.execute("delete from field_readings where code='K-10001' and reading=0")
    con.commit()


def test_assumption_validation():
    assert c.put("/api/assumptions", json={"values": {"nope": 1}}).status_code == 400
    assert c.put("/api/assumptions", json={"values": {"connections": 5}}).status_code == 400


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
