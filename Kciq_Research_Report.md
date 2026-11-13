# Kçiq DMA pilot: research report

Hackathon: reducing non-revenue water (UPF/UFF), KRU Mitrovica, 13–14 November 2026.
Updated 13 November 2026. Scope: **Kçiq i Madh and Kçiq i Vogël**, the two villages of the official cadastral zone "Kçiqi I Madh" (71202012).

How to read the confidence labels in this report:

- **Sourced**: taken from a document or dataset, with a link.
- **Measured**: computed by us from open map and terrain data for the zone.
- **Estimate**: our arithmetic on top of sourced numbers. Replace it with KRU's real figures as soon as you get them.
- **Model**: an output of the panel's simulation. It follows the assumptions on the panel's Assumptions page.

---

## 1. The one thing to know about Kçiq

**The 788 buildings in the zone sit between 510 m and 673 m above sea level, a 163 m height difference (Measured).** Every 10.2 m of height is 1 bar, so a network fed from one reservoir level has about 16 bar more static pressure at the bottom (along the M-2 road) than at the top.

Why this matters for the jury:

- Leakage rises with pressure, and bursts rise faster still. The low part of the village is where water is lost.
- ARRU Rule 02/2016, s.17, allows **1.5 to 7 bar at the connection** (Sourced). With an assumed reservoir grade of 620 m, the 423 buildings of the low band sit at 7.4–10.8 bar, and **492 buildings in the zone are above 7 bar** (Model).
- The top of the zone is pumped. News reports confirm Kçiq lost water because of a pump-station fault ([syri.net, May 2021](https://www.syri.net/syri_kosova/lajme/250297/fshati-kciq-i-mitrovices-mbetet-pa-uje/)).
- So **pressure management is the biggest and cheapest win**, and it is criterion 2 (20%).
- The sensor slide shows a 0–10 bar transducer. The lowest point would read about 10.8 bar, so the low-point logger needs a 0–16 bar range. **Ask KRU.**

---

## 2. The baseline: KRU Mitrovica in numbers

All Sourced from the [KRU Mitrovica Annual Performance Report 2025](https://www.kru-mitrovica.com/wp-content/uploads/2026/04/Raporti-Vjetor-2025.pdf) unless noted.

| Indicator | 2024 | 2025 |
|---|---|---|
| Water produced, whole company | 28.0 million m³ | 26.9 million m³ |
| Water billed, whole company | 13.1 million m³ | 13.8 million m³ |
| Non-revenue water, whole company | 53% | 49% |
| Non-revenue water, excluding the north | 66% | 60% |
| **Non-revenue water, Mitrovica unit** | **68%** | **64%** (7.4 million m³) |
| Non-revenue water, Vushtrri unit | 63% | 53% |
| Non-revenue water, Skenderaj unit | 66% | 64% |

Other facts:

- Customers: 56,536 in billing but only 54,020 in GIS, so **about 2,500 customers are billed but not on the map.** This is ASEE challenge A.
- Illegal connections found in 2025: 403 (148 in the Mitrovica unit).
- Pressure-reducing valves in GIS: only 14 for the whole company.
- Target: 100% of customers metered by 2027.
- Collection rate excluding the north is about 100%. The money problem is water that is never billed, not bills that go unpaid.
- Tariffs 2026 ([Kallxo, Jan 2026](https://kallxo.com/lajm/shtrenjtimi-i-ujit-arru-eshte-ndikuar-nga-rritja-e-cmimit-te-rrymes-dhe-kostot-operative-dhe-investive/)): household 0.53 €/m³ (up from 0.39), non-household 0.69 €/m³. ARRU blamed electricity costs, which matters because upper Kçiq is pumped.
- ARRU Rule 02/2016 (Sourced): pressure 1.5–7 bar at the connection (s.17); 24-hour supply (s.18); meters read every 1–3 months; estimated bills limited to 6 months for households and 3 for others.
- Donors already active: EBRD, EIB, EU/WBIF, GIZ, and the FOPIP performance programme.

---

## 3. Zone profile

**Boundary.** The official cadastral zone "Kçiqi I Madh" (ID 71202012, 8.0 km²), taken from the Kosovo Geoportal (AKK) with a WMS GetFeatureInfo request and converted from EPSG:7392 (KosovaRef01) to WGS84. It contains both villages. Neighbouring zones (Pantinë, Shupkovc and others) are drawn as dashed lines on the map.

| Item | Kçiq i Madh | Kçiq i Vogël | Zone | Label |
|---|---|---|---|---|
| Population, 2024 census | 2,880 | 1,396 | 4,276 | Sourced (KAS) |
| Households, 2024 census | 552 | 227 | 779 | Sourced (KAS) |
| Buildings (OSM) | 558 | 230 | 788 (677 over 60 m²) | Measured |
| Elevation of buildings | 512–655 m | 510–673 m | 510 / 543 / 673 m (min / median / max) | Measured (EU-DEM) |
| Roads | | | 33.1 km | Measured; an upper limit for pipe length |

Note: the OpenStreetMap point for "Kçiq i Vogël" is misplaced and falls in the Shupkovc zone. We split the villages using the census counts and building positions instead.

Public buildings (Measured, OSM): "Bislim Imeri" primary school, health clinic, mosque, Veda Petrol, RIGA Pharm.

Three natural pressure bands (Measured):

| Band | Elevation | Buildings | Static pressure at 620 m grade (Model) |
|---|---|---|---|
| A, low | 510–545 m | 423 | 7.4–10.8 bar |
| B, middle | 545–592 m | 276 | 2.8–7.3 bar |
| C, high (pumped to 700 m) | 595–673 m | 89 | 2.6–10.3 bar |

Proposed sensors (Measured positions): critical point DMA01-P-KRIT at 673 m, lowest point DMA01-P-ULET at 510 m, average zone point DMA01-P-AZP at 552 m, plus the inlet flow meter DMA01-Q-HYRJA.

---

## 4. What the losses are probably worth (Model)

KRU has the real inflow and billing data. Until we get it, the panel uses these calibrated assumptions (all editable on the Assumptions page): 779 connections, 356 m³/day billed (Mitrovica unit average per customer), 424 m³/day true use, 565 m³/day background leakage, 30 km of mains, 10 m service pipes, reservoir grade 620 m, N1 = 1.0, production cost 0.25 €/m³.

7-day IWA water balance (Model):

| Component | m³/day |
|---|---|
| System input | 1,036 |
| Billed authorised | 358 |
| Unbilled authorised | 10 |
| Apparent losses (under-registration 31, unauthorised 31) | 62 |
| Real losses | 606 |
| **Non-revenue water** | **678 (65.5%)** |

- Real losses are 778 litres per connection per day. The 7-day average includes about four days of the new leak that the night-flow alarm caught.
- UARL = (18 × 30 + 0.8 × 779 + 25 × 7.8) × 76.8 m ÷ 1000 = 104 m³/day, so **ILI = 5.8, World Bank band B** for developing countries ("potential for marked improvement"). This is illustrative: it uses assumed pipe lengths and the average static pressure of all buildings, and must be recomputed with KRU's network data.
- Value: all NRW at the household tariff is about €131,000 a year. Real losses at production cost are about €55,000 a year. Apparent losses at tariff are about €12,000 a year.

**One PRV on band A at 3 bar (Model):** leakage falls from 565 to 389 m³/day (−176 m³/day, 64,000 m³/year, €16,000/year at production cost). With €15,000 invested, payback is 11 months. NRW drops from 65.5% to 58.5%. Buildings above 7 bar drop from 492 to 69, and none falls below 2.5 bar. Bursts in band A are expected to fall by about 57% (1.4 × the cut in band A's maximum pressure; a tendency, not a guarantee). Bands B and C see no change.

How to say the payback in one sentence: the €15,000 buys the valve and its chamber, the saving counts only real losses at the €0.25/m³ production cost, and avoided burst repairs are left out, so 11 months is a cautious figure. The measurement kit in every tier is what proves the saving.

The same valve on band A + B does almost nothing: the highest house in band B already gets only 2.8 bar.

A comparable Kosovo case (Sourced: [Lajqi et al., Sustainability 2023](https://www.mdpi.com/2071-1050/15/21/15554)): in Graçanica one DN150 PRV for about €15,000 cut inlet pressure from 5.9 to 2.5 bar, saved about 640 m³/day, cut bursts from 196 to 88 a year and saved about €132,000 a year.

---

## 5. Targets (Model)

| Indicator | Today | Month 6 | Month 12 |
|---|---|---|---|
| Non-revenue water | 65.5% | 54.1% | 46.5% |
| Real losses, l/connection/day | 778 | 496 | 347 |
| Minimum night flow | 29.7 m³/h | 19.4 m³/h | 14.0 m³/h |
| Maximum pressure in band A | 10.8 bar | 6.4 bar | 6.4 bar |
| Buildings above 7 bar | 492 | 69 | 69 |
| Customers with a GIS point | 95.5% | 100% | 100% |

Month 6 assumes the PRV on band A, the new leak repaired, and the flagged meters and suspect dwellings brought into billing. Month 12 adds active leakage control that removes a further 30% of the remaining real losses. The 69 buildings still above 7 bar are at the bottom of band B and of the pumped band C; they need a second PRV, which is outside this budget.

---

## 6. The engineering method

**Water balance (IWA).** Input = billed authorised + unbilled authorised + apparent losses + real losses.

**Minimum night flow.** Between 02:00 and 04:00 almost nobody uses water. Night leakage = minimum night flow − legitimate night use (1.7 l per connection per hour, so 1.3 m³/h for 779 connections). It only works with 24-hour supply (ARRU s.18). The panel raises an alarm after two nights in a row more than 10% above the baseline.

**Pressure and leakage (FAVAD).** L₁/L₀ = (P₁/P₀)^N1, N1 ≈ 0.5 for rigid pipes, 1.0 for mixed networks, 1.5 for plastic pipes with split leaks.

**Benchmark.** UARL = (18 × Lm + 0.8 × Nc + 25 × Lp) × P; ILI = real losses ÷ UARL. World Bank bands for developing countries: A < 4, B 4–8, C 8–16, D > 16.

**DMA practice.** 500–3,000 connections per DMA (779 fits); zero-pressure test to prove the boundary is closed; step test to locate leaks.

**Billing anomaly rules (challenge B).** Zero for three months running; a drop of over 60% against the customer's own history; below 25% of the 8 nearest neighbours; a spike over 3 times the usual level.

**Action plan (criterion 5, six months):**

1. Month 1: confirm the boundary in GIS, close boundary valves, zero-pressure test.
2. Months 1–2: inlet meter, three pressure loggers, LoRaWAN gateway.
3. Month 2: two weeks of baseline data, first water balance, night flow, billing–GIS match.
4. Months 3–4: step test, acoustic leak detection, repairs, illegal connections, broken meters.
5. Months 4–5: PRV for band A, set from the critical point.
6. Month 6: compare with the baseline, report to ARRU, plan the next DMA.

Go/no-go gate: the PRV is ordered only after months 1–2 have proved the boundary closed (zero-pressure test), found every inlet, and logged at least two weeks of real pressure at the low point and the critical point. Every flow and pressure figure in this report is a scenario until then.

---

## 7. Technology

**Communications.** Recommended: a private LoRaWAN network on 868 MHz. ARKEP Regulation 012/B/24 allows it without an individual licence (25 mW) (Sourced). One gateway on the hill covers the zone. NB-IoT in Kosovo was not confirmed by any source; ask Vala and IPKO.

**Budget tiers (Estimate, lines priced from public lists where possible, contingency included):** Minimal €11,540 (inlet meter, three loggers, gateway); **Standard, recommended, €41,786** (adds 8 loggers, 2 gateways, 10 noise loggers, a ground microphone, and the band A PRV with its chamber); Advanced €58,214 (adds a smart PRV controller and 40 smart meters on large users). The PRV lines in Standard come to about €12,000 with contingency; the pressure page uses €15,000 as a cautious figure close to the Graçanica cost. The full breakdown is on the panel's Plan page.

**How it fits KRU's architecture.** Sensor data comes through the Monitoring API (SSE/WebSocket; the panel already reads an SSE stream). Billing is read-only from Billing Core (MS SQL Server). Field readings come through the Android offline app and Mobile Sync. Sensor data (timestamp, sensor ID such as `DMA01-P-HYRJA`, value, unit, status) is kept apart from sensor metadata (location, calibration, type, install date).

**Free GIS tools.** QGIS, the Kosovo Geoportal, EPANET with QGISRed or Giswater, WNTR (Python), and Google Earth Pro for the fly-through.

---

## 8. What we built: the DMA Kçiq panel

A working web app in `app/`: a Python FastAPI backend with SQLite storage, and a React + TypeScript frontend with Leaflet maps and Recharts. It is in Albanian by default, with English as a toggle. It covers ASEE challenges A, B, C and D in one tool:

| Page | What it shows | Challenge / criterion |
|---|---|---|
| Overview | KPIs, the pressure profile of every building, what needs action | 1, 4 |
| GIS map | Official boundary, 788 buildings coloured by band, village or pressure (now and after the PRV), sensors, anomalies, suspects | C; 1, 2 |
| Water balance | IWA table, ILI on the World Bank scale, value in € | 1, 4 |
| Night flow | 14 days hourly, alarm after two nights, leak scenario sliders, send a crew | B, C; 3 |
| Pressure and PRV | Profile with the ARRU 1.5–7 bar corridor, set-point slider, savings, payback, histogram | 2, 6 |
| Anomalies, Customers | Four rules, customer drawer with 12 months against 8 neighbours, one-click work orders | B |
| Billing ↔ GIS | Dwellings with no meter, customers with no GIS point, CSV exports | A |
| Work orders | Open / in the field / done board, stored on the server | D; 5 |
| Field reading | Phone form with GPS, warns on zero, high and low readings, and on distance from the meter | D |
| Plan and budget | Timeline, model-derived targets, budget tiers, comms, cases | 5, 6 |
| Assumptions, Sources | Every assumption is editable, and the whole panel recalculates | 3 |

Run it: from `app/backend`, `python -m uvicorn main:app --port 8000`, then open http://localhost:8000. API documentation is at /api/docs.

---

## 9. Questions to ask KRU tomorrow morning

1. Where does water enter the zone, from which reservoir or pump station, and at what level? One inlet or several?
2. Is the zone already split into pressure zones? Any existing PRVs?
3. Measured inflow (m³/day) and active customers for both villages?
4. Pipe materials, diameters and ages? Can we have the GIS network layer?
5. Is supply continuous? (Night-flow analysis needs it.)
6. Anonymised meter-reading history for the zone?
7. The range of the pressure transducers: the low point needs more than 10 bar.
8. Is NB-IoT available from Vala or IPKO?

---

## 10. Files in this folder

- `app/`: the DMA Kçiq panel (backend and frontend).
- `Kciq_DMA_pilot.kml`: open in Google Earth Pro. Folders: zone boundary, neighbouring zones, sensors, buildings by village and band, roads, public buildings.
- `kciq_gis_layers.geojson`: the same layers for QGIS.
- `kciq_stats.json`: the terrain and band statistics used above.

## 11. What we could not confirm

- KRU's pipe network, inlet location and reservoir level for the zone. None of this is public; the 620 m and 700 m grades are assumptions.
- Real inflow and billing for the zone; every flow and pressure figure above is Model.
- Which pump station feeds upper Kçiq.
- NB-IoT availability in Kosovo.
- Geoportal map images (WMS GetMap) return nothing outside the Geoportal site, so the panel draws the boundary we extracted instead of live cadastral tiles.
- The agenda PDF's title says 13–14 November but its tables say 9–10 October; we assumed the title is right.
