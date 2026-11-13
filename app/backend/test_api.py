"""Smoke tests for the API. Run: python -m pytest -q  (or python test_api.py)"""
import os
import tempfile

os.environ.setdefault("KCIQ_DB", os.path.join(tempfile.mkdtemp(), "test.db"))  # contracts are append-only: never test on the real DB

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


SIG = "data:image/png;base64," + "iVBORw0KGgo" * 20


def _reg(**kw):
    import datetime as dt
    body = {"full_name": "Arta Krasniqi", "personal_no": "1234567890", "phone": "+383 44 123 456", "village": "Kçiq i Madh",
            "address": "Rruga e Kçiqit 12", "building": "B-5", "use_type": "household", "persons": 4,
            "start_date": dt.date.today().isoformat(), "accept_terms": True, "accept_data": True, "signature": SIG}
    body.update(kw)
    return c.post("/api/contracts", json=body)


def test_building_detail():
    b = c.get("/api/buildings/B-5").json()
    assert b["ref"] == "B-5" and b["p_prv"] <= b["p_now"] and len(b["use"]) == 12
    assert c.get("/api/buildings/B-99999").status_code == 404
    s = sim.UNREGISTERED[0]
    assert c.get("/api/buildings/%d" % s).json()["suspect"] is not None


def test_contract_is_stored_hashed_and_append_only():
    import sqlite3
    v = sim.BUILDINGS[5]["village"]
    r = _reg(village=v)
    assert r.status_code == 200, r.text
    k = r.json()
    assert k["number"].startswith("KRU-MI-") and k["customer_code"].startswith("K-2") and len(k["hash"]) == 64
    assert _reg(village=v).status_code == 409                       # same person, same building
    assert _reg(village=v, accept_terms=False, personal_no="1111111111").status_code == 400
    assert _reg(village=v, personal_no="12").status_code == 422
    public = c.get("/api/contracts/" + k["number"]).json()
    assert public["verified"] and not public["full"] and public["personal_no"] != "1234567890" and "signature" not in public
    assert not c.get("/api/contracts/%s?k=wrong" % k["number"]).json()["full"]
    full = c.get("/api/contracts/%s?k=%s" % (k["number"], k["access"])).json()
    assert full["full"] and full["personal_no"] == "1234567890" and full["signature"] == SIG
    listed = c.get("/api/contracts").json()
    assert listed[0]["personal_no"] != "1234567890" and "signature" not in listed[0]
    assert c.get("/api/buildings/B-5").json()["contracts"][0]["number"] == k["number"]
    con = sqlite3.connect(main.DB)
    for sql in ("update contracts set data='{}'", "delete from contracts"):
        try:
            con.execute(sql)
            raise AssertionError("append-only trigger missing: " + sql)
        except sqlite3.IntegrityError:
            pass


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
