"""Build the one-idea pitch deck (DMA-Kciq-ideja.pptx) with its charts from KRU's real figures and zones.json.

usage: python build_deck.py
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Patch, Polygon as MPoly
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Emu, Pt

HERE = Path(__file__).parent
IMG = HERE / "img"
IMG.mkdir(exist_ok=True)
Z = json.loads((HERE.parent.parent / "app/backend/data/zones.json").read_text("utf-8"))

NAVY, SKY, INK, MUTED, RED, PAPER = "0C2D44", "5AB0E8", "13232E", "4A5D69", "D7301F", "ECF0F2"
DAYS, IN_M3, BILL_M3 = 242, 386956, 116345
IN_D, BILL_D = IN_M3 / DAYS, BILL_M3 / DAYS
APPARENT = 100  # m³/day [ESTIMATED]
plt.rcParams.update({"font.family": "Arial", "font.size": 12, "axes.spines.top": False, "axes.spines.right": False})

# --- 24-hour chart (same model as the web page /24-oret, N1 = 1) ---
D = [3.0, 2.5, 2.3, 2.3, 2.6, 3.9, 7.2, 10.2, 10.5, 9.5, 8.6, 8.2, 8.6, 8.2, 7.2, 6.9, 7.2, 8.2, 9.5, 10.5, 10.2, 8.6, 6.2, 4.1]
night = lambda h: 1 <= h <= 4
shape = sum(q for h, q in enumerate(D) if not night(h)) * 3.6
use = [0.7 if night(h) else q * (BILL_D - 4 * 0.7 * 3.6) / shape for h, q in enumerate(D)]
app = [q * APPARENT / (sum(D) * 3.6) for q in D]
pf = [1 - 0.15 * (q / max(D)) ** 2 for q in D]
real_d = IN_D - BILL_D - APPARENT
leak = [x * real_d / (sum(pf) * 3.6) for x in pf]
inflow = [a + b + c for a, b, c in zip(use, app, leak)]
mnf = (inflow[2] + inflow[3]) / 2
fig, ax = plt.subplots(figsize=(11, 4.6), dpi=160)
h = list(range(24))
ax.axvspan(2, 4, color="#0C2D44", alpha=.08)
ax.text(3, max(inflow) * 1.04, "MNF 02–04", ha="center", fontsize=11, color="#0C2D44")
ax.stackplot(h, leak, app, use, colors=["#F03B20", "#FDAE61", "#5AB0E8"], alpha=.8,
             labels=["Rrjedhje (humbje fizike)", "Humbje komerciale", "Konsum i faturuar"])
ax.plot(h, inflow, color="#0C2D44", lw=2.2, label="Hyrja në zonë")
ax.set_xticks(range(0, 24, 2), [f"{x:02d}:00" for x in range(0, 24, 2)])
ax.set_ylabel("l/s"); ax.set_xlim(0, 23); ax.set_ylim(0, max(inflow) * 1.12)
ax.legend(loc="upper center", bbox_to_anchor=(.5, -.1), ncol=4, frameon=False)
fig.tight_layout(); fig.savefig(IMG / "24h.png"); plt.close(fig)

# --- thematic zone map ---
C = [(5, "#4575B4", "1,5–5 bar · objektiv"), (7, "#91BFDB", "5–7 bar · brenda kufirit"), (9, "#FDAE61", "7–9 bar · mbi 7 bar"),
     (11, "#F03B20", "9–11 bar · shumë i lartë"), (99, "#BD0026", "≥ 11 bar · rrezik plasjeje")]
cls = lambda p: next(c for c in C if p < c[0])
fig, ax = plt.subplots(figsize=(8, 7), dpi=160)
for z in Z["zones"]:
    ax.add_patch(MPoly([(lon, lat) for lat, lon in z["polygon"]], closed=True, fc=cls(z["p_max"])[1], ec="white", lw=1.4, alpha=.55))
    lats, lons = zip(*z["polygon"])
    ax.text(sum(lons) / len(lons), sum(lats) / len(lats), z["id"], ha="center", va="center", fontsize=8, weight="bold", color="#13232E")
cs = Z["consumers"]
ax.scatter([c[2] for c in cs], [c[1] for c in cs], s=5, c=[cls(c[4])[1] for c in cs], lw=0)
counts = [sum(1 for c in cs if lo <= c[4] < hi) for (lo, hi) in zip([0] + [c[0] for c in C[:-1]], [c[0] for c in C])]
ax.legend(handles=[Patch(fc=c[1], label=f"{c[2]}  ({n})") for c, n in zip(C, counts)], title="Presioni statik maks. (pika)",
          loc="lower left", fontsize=9, title_fontsize=10, framealpha=.95)
ax.set_aspect(1 / 0.733); ax.autoscale(); ax.axis("off")
ax.set_title("Burimi: KRU, DMA_Kciq_rruget_reale.kml (OSM + SRTM 30 m)", fontsize=8, color="#4A5D69", loc="right", y=-0.04)
fig.tight_layout(); fig.savefig(IMG / "zonat.png", bbox_inches="tight"); plt.close(fig)
over7 = sum(1 for c in cs if c[4] >= 7)
over9 = sum(1 for c in cs if c[4] >= 9)

# --- deck ---
prs = Presentation()
prs.slide_width, prs.slide_height = Emu(12192000), Emu(6858000)
W, H = prs.slide_width, prs.slide_height
blank = prs.slide_layouts[6]
IN = 914400


def box(s, x, y, w, h, text, size=18, color=INK, bold=False, fill=None, align=None):
    shp = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if fill else MSO_SHAPE.RECTANGLE, int(x * IN), int(y * IN), int(w * IN), int(h * IN))
    if fill:
        shp.fill.solid(); shp.fill.fore_color.rgb = RGBColor.from_string(fill); shp.adjustments[0] = 0.08
    else:
        shp.fill.background()
    shp.line.fill.background()
    tf = shp.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Emu(int(.15 * IN))
    for k, line in enumerate(text.split("\n")):
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        r = p.add_run(); r.text = line
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = RGBColor.from_string(color); r.font.name = "Arial"
        if align: p.alignment = align
    return shp


def slide(title, kicker=None, dark=False):
    s = prs.slides.add_slide(blank)
    bg = s.background.fill; bg.solid(); bg.fore_color.rgb = RGBColor.from_string(NAVY if dark else "FFFFFF")
    if kicker: box(s, .6, .35, 12, .4, kicker.upper(), 12, SKY, True)
    box(s, .6, .7, 12.2, 1, title, 30, "FFFFFF" if dark else NAVY, True)
    return s


def note(s, text):
    box(s, .6, 6.95, 12.2, .45, text, 10, MUTED)


def stat(s, x, y, big, small, color=NAVY, w=2.9):
    box(s, x, y, w, .8, big, 34, color, True)
    box(s, x, y + .8, w, .9, small, 13, MUTED)


prs.slide_height = Emu(int(7.5 * IN)); prs.slide_width = Emu(int(13.333 * IN))

s = slide("DMA inteligjente për Kçiqin", "Hackathoni për humbjet e ujit · KRU \"Mitrovica\" · 13–14 nëntor 2026", dark=True)
box(s, .6, 1.9, 11.5, 1.4, "Gjej rrjedhjet, pastaj ul presionin.\nNjë ide, dy faza, gjashtë muaj.", 26, "B9CCDA")
stat(s, .6, 4.2, "69,9%", "ujë pa të ardhura në DMA Kçiq,\nshkurt–shtator 2026 [MATUR]", SKY, 3.6)
stat(s, 4.6, 4.2, "1 118 m³", "humbin çdo ditë\n(1 599 hyjnë, 481 faturohen)", SKY, 3.6)
stat(s, 8.6, 4.2, "≤ 45%", "objektivi pas 6 muajsh\n[VLERËSUAR]", SKY, 3.6)

s = slide("Dy nga tre litra që hyjnë në Kçiq nuk paguhen", "1 · Situata (të dhëna të matura)")
stat(s, .6, 1.9, "386 956 m³", "hyrje në DMA, 27.01–30.09.2026\nmatësi i zonës", NAVY, 3.8)
stat(s, 4.6, 1.9, "116 345 m³", "të faturuar\n(1 031 llogari, lexuesi i zonës)", "1468B0", 3.8)
stat(s, 8.6, 1.9, "270 611 m³", "humbje, ≈ 33 826 m³ në muaj\n69,93%", RED, 3.8)
box(s, .6, 4.1, 12, 2.6,
    "• Inspektimet në terren (1 025 konsumatorë) nuk gjetën lidhje ilegale masive.\n"
    "• 485 ujëmatës (49%) janë mbi 10 vjeç: nën-regjistrimi 5–15% jep vetëm 3 300–10 000 m³.\n"
    "• Pra humbja komerciale është e vogël (≈ 75–150 m³/ditë). Shumica, rreth 85–90%, është rrjedhje fizike.\n"
    "• Telemetria nuk punon: Notus joaktiv, kablli i sinjalit nga rezervuari i dëmtuar.", 17, INK)
note(s, "Burimi: KRU, Prezantim-DMA-Kqiq; faturimi i Kçiqit (Inkasanti = lexuesi i zonës): 113 606 m³ shkurt–shtator, 97,6% e shifrës së KRU-së.")

s = slide("Natën askush nuk përdor ujë, por uji vazhdon të hyjë", "2 · Uji në 24 orë")
s.shapes.add_picture(str(IMG / "24h.png"), int(.5 * IN), int(1.75 * IN), width=int(8.6 * IN))
box(s, 9.3, 1.9, 3.6, 4.8,
    f"Rrjedha minimale e natës\n≈ {mnf:.1f} l/s\n\nKonsum legjitim i natës\n≈ 0,7 l/s\n\nRrjedhje\n≈ {real_d:,.0f} m³/ditë\n≈ {100 * real_d / IN_D:.0f}% e hyrjes".replace(",", " "),
    17, NAVY, True, PAPER)
note(s, "Hyrja dhe faturimi: mesatare të matura (242 ditë). Forma orare: profili i projektit të KRU-së [VLERËSUAR] derisa logger-i i hyrjes të regjistrojë çdo 15 min. Nata: Farley 2001.")

s = slide("Shkaku: presion deri në 12,6 bar", "3 · Zonat e presionit Z1–Z19")
s.shapes.add_picture(str(IMG / "zonat.png"), int(.5 * IN), int(1.6 * IN), height=int(5.3 * IN))
box(s, 7.2, 1.9, 5.7, 4.8,
    f"• {over7} nga {len(cs)} pika konsumatori marrin mbi 7 bar, kufirin e ARRU-së.\n"
    f"• {over9} pika mbi 9 bar, në Z7 dhe Z17 (maks. 12,6 bar).\n"
    "• Kuota ndryshon 510–673 m; ujë nga rezervuari R-1 në 707 m.\n"
    "• Rrjedhja rritet me presionin (FAVAD, N1 ≈ 0,5–1,5), dhe plasaritjet me 1,4× uljen e presionit.\n"
    "• Pa ulje presioni, rrjedhjet e riparuara kthehen.", 16, INK)
note(s, "Legjenda me klasa fikse sipas kufirit ARRU 7 bar (ColorBrewer). Versioni për Google Earth Pro: Kciq_zonat_tematike.kmz.")

s = slide("Një ide: DMA inteligjente, në dy faza", "4 · Zgjidhja")
box(s, .6, 1.9, 5.9, 4.7,
    "FAZA 1 · muaji 1–3\nGjej rrjedhjet\n\n"
    "• Riparo telemetrinë: kablli SP, Notus.\n• Matje çdo 15 min në hyrje dhe 3–5 pika presioni.\n"
    "• Kurba 24 orë dhe MNF çdo natë, alarm automatik.\n• Test hap pas hapi zonë për zonë, sipas renditjes së rrezikut.\n"
    "• Logger akustik në zonat e flamuruara, pastaj riparim.", 16, INK, False, PAPER)
box(s, 6.8, 1.9, 5.9, 4.7,
    "FAZA 2 · muaji 4–6\nUl presionin\n\n"
    "• Zona presioni me PRV, së pari Z17 dhe Z7 (> 9 bar).\n• PRV me regjim nate: presion më i ulët kur konsumi bie.\n"
    "• Synimi 3–5 bar te lidhja, asnjë pikë mbi 7 bar.\n• MNF tregon menjëherë sa ra rrjedhja.\n"
    "• Pastaj zona e radhës e KRU-së me të njëjtin model.", 16, INK, False, PAPER)

s = slide("Smart/IoT me kosto të ulët, të dhënat në një panel", "5 · Integrimi i të dhënave")
box(s, .6, 1.9, 6.2, 4.6,
    "Paketa e pilotit (LoRaWAN)\n"
    "• 1–2 lexues impulsi në matësin e hyrjes (≈ 100 €)\n• 3–5 sensorë presioni 0–16 bar (≈ 290 €)\n"
    "• 1 sondë niveli për rezervuarin R-1 (≈ 130 €)\n• 1 gateway (260–560 €), server falas (ChirpStack)\n\n"
    "≈ 1 800–3 900 € gjithsej [VLERËSUAR]\nLogger akustik: me qira, vetëm në zonat e flamuruara.", 16, INK, False, PAPER)
box(s, 7.1, 1.9, 5.6, 4.6,
    "Paneli kciq-dma.vercel.app\n"
    "• Uji në 24 orë dhe MNF\n• Harta tematike e zonave me legjendë\n• Bilanci IWA, alarmi i natës, PRV\n"
    "• Urdhra pune për ekipin në terren\n\nNB-IoT nuk është i konfirmuar në Kosovë, prandaj LoRaWAN. KRU Gjakova ka tashmë rrjet LoRaWAN.",
    16, INK, False, PAPER)
note(s, "Çmimet: dyqane publike (Milesight, Dragino), nëntor 2026, pa TVSH dhe transport. Kërkohen oferta lokale.")

s = slide("Çfarë matim", "6 · Rezultatet e pritshme dhe KPI")
rows = [("KPI", "Sot", "Pas 6 muajsh"), ("NRW (%)", "69,9% [MATUR]", "≤ 45% [VLERËSUAR]"),
        ("Humbje (m³/ditë)", "1 118", "≈ 700"), ("MNF (l/s)", f"≈ {mnf:.1f} [VLERËSUAR]", "≤ 7"),
        ("Pika mbi 7 bar", f"{over7}", "0"), ("ILI", "≈ 12 (kategoria C)", "< 8"),
        ("Telemetria aktive", "jo", "24/7, çdo 15 min")]
tbl = s.shapes.add_table(len(rows), 3, int(.6 * IN), int(1.9 * IN), int(12 * IN), int(4.4 * IN)).table
for r, row in enumerate(rows):
    for c, v in enumerate(row):
        cell = tbl.cell(r, c); cell.text = v
        f = cell.text_frame.paragraphs[0].runs[0].font; f.size = Pt(17); f.name = "Arial"; f.bold = r == 0
        if r == 0:
            cell.fill.solid(); cell.fill.fore_color.rgb = RGBColor.from_string(NAVY); f.color.rgb = RGBColor.from_string("FFFFFF")
note(s, "Objektivat konfirmohen pas matjes bazë në muajin e parë. ILI tregues, sepse formula vlen nga 3 000 lidhje.")

s = slide("Kthehet brenda vitit", "7 · Ekonomia")
saved = 400 * 365
stat(s, .6, 1.9, "≈ 400 m³", "më pak humbje në ditë\n[VLERËSUAR]", NAVY, 3.8)
stat(s, 4.6, 1.9, f"≈ {saved * .25 / 1000:.0f} 000 €", "në vit me koston e prodhimit 0,25 €/m³\n(≈ 77 000 € me tarifën 0,53 €/m³)", "1E7F4F", 3.8)
stat(s, 8.6, 1.9, "≈ 42 000 €", "pilot 6-mujor: matje, kërkim\nrrjedhjesh, PRV", NAVY, 3.8)
box(s, .6, 4.3, 12, 2.4,
    "• Kthimi: ≈ 14 muaj me koston e prodhimit, ≈ 7 muaj me tarifën.\n"
    "• Prova nga rajoni: Gračanicë (Kosovë) 1 PRV ≈ 15 000 €, kursim i modeluar 640 m³/ditë; "
    "Kozani (Greqi) 1 PRV, kursim i matur 2 500 m³/ditë.\n• Banka Botërore: ulja e presionit është mjeti më i nënvlerësuar kundër humbjeve fizike.", 16, INK)
note(s, "Burimet: Lajqi et al. 2023; Tsitsifli et al. 2017; Kingdom et al. 2006 (World Bank). Kursimet janë vlerësim, jo matje.")

s = slide("Plani gjashtëmujor", "8 · Fizibiliteti")
steps = [("M1", "Telemetria dhe sensorët", "riparim kablli/Notus, LoRaWAN"), ("M2", "Matja bazë", "24 orë, MNF, kodi i konsumatorit → zona"),
         ("M3", "Testi hap pas hapi", "zonat sipas rrezikut, logger akustik, riparime"), ("M4", "PRV në Z17 dhe Z7", "zona presioni"),
         ("M5", "Regjimi i natës", "PRV me dy pika, MNF ndiqet çdo natë"), ("M6", "Rezultatet", "raport KPI, zona e radhës")]
for k, (m, a, b) in enumerate(steps):
    x = .6 + k * 2.05
    box(s, x, 2.0, 1.9, .7, m, 22, "FFFFFF", True, NAVY if k < 3 else "1468B0")
    box(s, x, 2.8, 1.95, 1.0, a, 15, NAVY, True)
    box(s, x, 3.7, 1.95, 1.4, b, 12, MUTED)
box(s, .6, 5.3, 12, 1.2, "Faza 1 (M1–M3): gjej rrjedhjet · Faza 2 (M4–M6): ul presionin.\nPronar: sektori i humbjeve të KRU-së; ekipi ynë: paneli, analizat, trajnimi.", 16, INK)

s = slide("Çfarë kërkojmë nga KRU", "9 · Hapi i radhës", dark=True)
box(s, .6, 1.9, 12, 3.8,
    "1. Miratim për pilotin 6-mujor në DMA Kçiq.\n"
    "2. Të dhënat: hyrja mujore/orare e matësit të zonës, kodi i konsumatorit → adresa ose zona.\n"
    "3. Riparimi i kabllit të sinjalit dhe i Notus-it në javën e parë.\n"
    "4. Një person kontakti nga sektori i humbjeve për testet e natës.", 22, "FFFFFF")
box(s, .6, 5.9, 12, .6, "Paneli është gati: kciq-dma.vercel.app", 20, SKY, True)

out = HERE / "DMA-Kciq-ideja.pptx"
prs.save(out)
print(out, len(prs.slides), "slides; MNF", round(mnf, 1), "over7", over7, "over9", over9)
