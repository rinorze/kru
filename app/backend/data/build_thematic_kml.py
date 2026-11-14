"""Write a Google Earth Pro thematic KML (zones by max static pressure, with a legend overlay) from zones.json.

usage: python build_thematic_kml.py <out.kml>
"""
import json
import sys
from pathlib import Path

d = json.loads(Path(__file__).with_name("zones.json").read_text("utf-8"))
C = [(5, "4575B4", "1.5–5 bar objektiv"), (7, "91BFDB", "5–7 bar brenda kufirit"), (9, "FDAE61", "7–9 bar mbi 7 bar"),
     (11, "F03B20", "9–11 bar shumë i lartë"), (99, "BD0026", "≥ 11 bar rrezik plasjeje")]
kml = lambda h, a="b3": a + h[4:6] + h[2:4] + h[0:2]  # RRGGBB -> aabbggrr
cls = lambda p: next(i for i, c in enumerate(C) if p < c[0])
o = ['<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>DMA Kçiq – harta tematike e presionit</name>']
for i, (_, h, _) in enumerate(C):
    o.append(f'<Style id="p{i}"><LineStyle><color>ffffffff</color><width>1.5</width></LineStyle><PolyStyle><color>{kml(h)}</color></PolyStyle>'
             f'<IconStyle><color>{kml(h, "ff")}</color><scale>0.45</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/shaded_dot.png</href></Icon></IconStyle><LabelStyle><scale>0</scale></LabelStyle></Style>')
o.append('<ScreenOverlay><name>Legjenda</name><Icon><href>Kciq_legjenda.png</href></Icon><overlayXY x="0" y="0" xunits="fraction" yunits="fraction"/>'
         '<screenXY x="12" y="40" xunits="pixels" yunits="pixels"/><size x="0" y="0" xunits="pixels" yunits="pixels"/></ScreenOverlay>')
o.append('<Folder><name>Zonat Z1–Z19 (presioni maks. statik)</name>')
for z in d["zones"]:
    ring = " ".join(f"{lon},{lat},0" for lat, lon in z["polygon"])
    o.append(f'<Placemark><name>{z["id"]}</name><description>{z["street"]}: {z["connections"]} lidhje, {z["p_min"]}–{z["p_max"]} bar, '
             f'{z["house_prv"]} PRV shtëpiake, {z["demand_m3d"]} m³/ditë</description><styleUrl>#p{cls(z["p_max"])}</styleUrl>'
             f'<Polygon><outerBoundaryIs><LinearRing><coordinates>{ring}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>')
o.append('</Folder><Folder><name>Konsumatorët (presioni statik)</name><visibility>0</visibility>')
for z, lat, lon, e, p in d["consumers"]:
    o.append(f'<Placemark><visibility>0</visibility><name>{z}</name><description>{e} m, {p} bar</description><styleUrl>#p{cls(p)}</styleUrl><Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>')
o.append("</Folder></Document></kml>")
Path(sys.argv[1]).write_text("".join(o), "utf-8")

# legend PNG next to the KML (Pillow)
from PIL import Image, ImageDraw, ImageFont
f = lambda s: ImageFont.truetype("arial.ttf", s)
im = Image.new("RGBA", (300, 206), (255, 255, 255, 240)); g = ImageDraw.Draw(im)
g.text((12, 10), "Presioni statik maks. (bar)", fill="#13232E", font=f(16))
for i, (_, h, label) in enumerate(C):
    y = 40 + i * 26
    g.rectangle((12, y, 34, y + 16), fill="#" + h, outline="#888"); g.text((44, y), label, fill="#13232E", font=f(14))
g.text((12, 176), "Kufiri ARRU 7 bar · KRU KML (OSM+SRTM)", fill="#4A5D69", font=f(11))
im.save(Path(sys.argv[1]).with_name("Kciq_legjenda.png"))
print("ok", len(d["zones"]), "zones")
