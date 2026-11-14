"""Build zones.json from the KRU network design KML (DMA_Kciq_rruget_reale.kml).

usage: python build_zones.py <kml>   (writes data/zones.json next to this script)
Zones Z1–Z19 with their design table, polygon and every consumer point's static pressure.
"""
import json
import re
import sys
from pathlib import Path

s = Path(sys.argv[1]).read_text("utf-8")
desc = re.search(r"<description><!\[CDATA\[(.*?)\]\]></description>", s, re.S).group(1)
table = desc[desc.find("<h3>1."):desc.find("<h3>2.")]
rows = re.findall(r"<tr>(.*?)</tr>", table, re.S)[1:]
zones = {}
for r in rows:
    c = [re.sub(r"<[^>]+>", "", x).strip() for x in re.findall(r"<td>(.*?)</td>", r, re.S)]
    z0, z1 = map(float, c[3].split("–"))
    zones[c[0]] = {"id": c[0], "street": c[1], "village": "Kçiq i Vogël" if c[1].startswith("Kçiq i Vogël") else "Kçiq i Madh",
                   "connections": int(c[2]), "elev_min": z0, "elev_max": z1, "supply": "gravity" if c[4] == "Gravitet" else "R-1",
                   "hgl": float(c[5]), "p_min": float(c[6]), "p_max": float(c[7]), "in_3_5": int(c[8]), "house_prv": int(c[9]),
                   "demand_m3d": float(c[10])}


def coords(txt):
    return [[round(float(b), 6), round(float(a), 6)] for a, b, *_ in (p.split(",") for p in txt.split())]


seg = s[s.find("<name>2. Zonat e presionit"):s.find("<name>3. Gypat")]
for name, body in re.findall(r"<Placemark><name>(Z\d+)</name>(.*?)</Placemark>", seg, re.S):
    ring = re.search(r"<coordinates>(.*?)</coordinates>", body, re.S)
    if name in zones and ring:
        zones[name]["polygon"] = coords(ring.group(1))

pts = []
cseg = s[s.find("<name>6. Konsumatorët"):]
for name, body in re.findall(r"<Placemark><name>(Z\d+-\d+)</name>(.*?)</Placemark>", cseg, re.S):
    e = re.search(r"Lartësia (\d+(?:\.\d+)?) m", body)
    p = re.search(r"/ (\d+(?:\.\d+)?) bar statik", body)
    c = re.search(r"<coordinates>([^<]+)</coordinates>", body)
    if e and p and c:
        lon, lat = map(float, c.group(1).split(",")[:2])
        pts.append([name.split("-")[0], round(lat, 6), round(lon, 6), float(e.group(1)), float(p.group(1))])
out = {"source": "KRU – DMA_Kciq_rruget_reale.kml (OSM + SRTM 30 m)", "zones": list(zones.values()), "consumers": pts}
Path(__file__).with_name("zones.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), "utf-8")
print(len(zones), "zones", sum("polygon" in z for z in zones.values()), "with polygons,", len(pts), "consumers")
