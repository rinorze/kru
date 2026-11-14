# Hunt night leaks, then tame Kçiq's pressure

The strongest single idea for DMA Kçiq is the one the team has already chosen: an **intelligent DMA that first uses minimum night flow (MNF) to find and repair the leak backlog (months 1–3), then locks in the gain with PRV-controlled pressure zones (months 4–6)**. The water balance explains why. About **1,599 m³/day goes in and about 481 m³/day is billed, leaving about 1,118 m³/day of NRW**. That is roughly 1,085 L per account per day, or 20 m³ per km of main per day, and apparent losses appear to be only around 7–13% of it. Kçiq's NRW is therefore mostly physical leakage driven by static pressures of up to 12.6 bar. The international guidance gives a clear order for that situation: measure, clear the backlog of large leaks, then manage pressure so they do not come back. Pressure management is the most cost-effective physical-loss tool ([World Bank, Kingdom et al. 2006](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf); [GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)). A Kosovo study projects that one EUR 15,000 PRV saves 640 m³/day with payback under two months ([Lajqi et al. 2023](https://www.mdpi.com/2071-1050/15/21/15554/htm)). Measured results in Greece, Cyprus and Turkey are of the same order. The monitoring layer costs little: LoRaWAN pulse counters, pressure sensors, a gateway and open-source software come to roughly **EUR 2,000–4,000**. A realistic six-month target is to cut NRW by 300–400 m³/day for a total outlay of about EUR 35–65k. At production cost alone that pays back in **roughly 6–16 months**. These are team estimates, and a two-week logging campaign has to confirm them before the pitch can present them as fact.

## Kçiq's water balance points at pipes, not meters

The jury's 15% "situation analysis" criterion rewards a correct diagnosis, and Kçiq's numbers lead to one. Over February–September 2026 (242 days) the DMA took in 386,956 m³ and billed 116,345 m³. That works out to about **1,118 m³/day of NRW (69.9%)** across 56 km of mains and about 1,031 accounts, according to KRU data. Field inspections of 1,025 properties found no mass illegal connections, and billed use of about 112 L/person/day is plausible for 4,276 residents. An upper-bound sketch makes the commercial side small. If the 485 meters older than ten years under-register by 10–15%, which is within the 5–15% range reported internationally ([Water SA 2019](https://scielo.org.za/scielo.php?script=sci_arttext&pid=S1816-79502019000200002)), and some of the 250 zero-bill accounts hide stuck meters, apparent losses come to roughly **75–150 m³/day**. That leaves **about 85–90% of NRW as physical leakage**. This is an inference, and MNF data will confirm or overturn it.

The local trend shows that business as usual has not worked. Kosovo's regulator reports national losses stuck at about 55% "without any substantial improvement". It calls NRW reduction "the highest priority for the water sector". RWC Mitrovica's NRW moved between **50% and 62% from 2013 to 2019** with no lasting fall ([ARRU/WSRA NRW report](https://arru-rks.org/wp-content/uploads/2025/10/200604_AA_Raport-per-gjendjen-e-Ujit-te-Pa-faturuar_Eng.pdf)). One caution belongs in the pitch. Kçiq's monthly loss percentage dropped from 76% to 61% in July–August as billing rose. That is what a percentage does when consumption rises against a roughly constant leakage volume, and it is not evidence that leakage fell. Report m³/day, L/connection/day and m³/km/day instead.

Pressure is what makes Kçiq unusual. Leak flow scales with pressure to the power N1, where **N1 ranges from about 0.5 to 2.8** ([MDPI Water 2024 review](https://www.mdpi.com/2073-4441/16/11/1534)). Across 112 international case studies, burst frequency fell by about 1.4 times the percentage pressure reduction, with new-break reductions **typically 25–90% and averaging about 50%** ([WaterWorld, Thornton & Lambert](https://www.waterworld.com/home/article/16189891/preventing-pipe-breaks-through-pressure-management)). Gračanica's 5.9 bar was described as "excessive" in the Kosovo study, and Kçiq reaches more than twice that. Bringing a 12.6 bar zone down to a 4–5 bar service level is a 60–68% pressure cut. Under FAVAD that shrinks the flow from that zone's existing leaks by about **37–44% if N1 = 0.5 and 60–68% if N1 = 1.0**. This is illustrative arithmetic until a night pressure-step test measures N1 for Kçiq.

## Six candidate ideas, ranked against the jury matrix

The research produced six standalone ideas. The table converts each idea's qualitative jury-fit ratings into a 1–5 score (very high = 5, high = 4, medium = 3, low = 2) and weights them by the jury matrix. The ratings are the researchers' judgement, not an external standard. The evidence and cost columns are sourced.

| Rank | Idea | What it attacks | Strongest evidence | Indicative cost | Weighted jury score |
|---|---|---|---|---|---|
| — | **A + B + D combined: intelligent DMA (team choice)** | Bursts, then background leakage, then new bursts | All of the below | ~EUR 35–65k pilot (estimate) | **~4.8 / 5** |
| 1 | A. PRV pressure zones | All pressure-dependent leakage in high zones | Gračanica: 640 m³/d projected for EUR 15k ([Lajqi 2023](https://www.mdpi.com/2071-1050/15/21/15554/htm)); Kozani: 2,500 m³/d measured ([Tsitsifli 2017](https://www.ewra.net/wuj/pdf/WUJ_2017_16_03.pdf)) | ~EUR 15k per installed PRV | 4.3 |
| 2 | D. Intelligent monitoring (MNF and pressure alarms) | Run time of new bursts | IWA: permanent leakage and pressure control is "the first step" ([IWA DMA Guidance 2024](https://www.leakssuitelibrary.com/wp-content/uploads/2026/01/IWA-DMA-Guidance-Notes-2024.pdf)) | EUR 2–4k hardware | 4.2 |
| 3 | B. MNF-led active leakage control | Unreported bursts and leaks | Nicosia DMA 15: 266,450 m³/yr saved ([Tsitsifli 2017](https://www.ewra.net/wuj/pdf/WUJ_2017_16_03.pdf)) | Survey ~US$100/km ([MDPI Water 2019](https://www.mdpi.com/2073-4441/11/1/48)) | 3.8 |
| 4 | E. Sub-DMA sectorisation | Enabler for A and B | Kozani DMA formation: 144,595 m³/yr ([Tsitsifli 2017](https://www.ewra.net/wuj/pdf/WUJ_2017_16_03.pdf)) | Meters, valves, chambers (no Balkan prices found) | 3.5 |
| 5 | C. Smart/AMR customer meters | Apparent losses (~10% of NRW here) | Under-registration 5–15% ([Water SA 2019](https://scielo.org.za/scielo.php?script=sci_arttext&pid=S1816-79502019000200002)) | Highest capex if all 1,031 meters are fitted | 3.3 |
| 6 | F. Service-connection replacement | Service-pipe leaks | Asset replacement is the least cost-effective leakage tool ([AWA 2018](https://www.awa.asn.au/hubfs/Water%20e-journal/2018/November%202018/201811_003_004_038_Reducing%20Leakage%20to%20Save%20Bulk%20Water%20Costs.pdf)) | Highest per m³/day saved | 2.4 |

**Pressure management (A)** has the best standalone case. It is the only idea with Kosovo-specific evidence, although that evidence is a calculated projection rather than a field result. In the Gračanica study, cutting city-inlet pressure from 5.9 to 2.5 bar saves an estimated 640 m³/day and EUR 132,485/yr ([Lajqi et al. 2023](https://www.mdpi.com/2071-1050/15/21/15554/htm)). Measured regional results answer the jury's likely objection that the savings are theoretical. In Kozani, one PRV dropping the setting from 57 m to 37 m saved **2,500 m³/day, more than the hydraulic model predicted**. In Nicosia, pressure cuts of 32–38% reduced supply by 1,097 m³/day and pumping energy by up to 36% ([Tsitsifli et al. 2017](https://www.ewra.net/wuj/pdf/WUJ_2017_16_03.pdf)). In Sakarya, PRV control cut network failures from 39 to 23, or **−41%** ([PMC, Sakarya study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12284174)). The World Bank calls pressure management "often an underestimated option", and puts typical physical-loss reduction cost at about **US$250 per m³/day saved** ([Kingdom et al. 2006](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf)).

**Active leakage control (B)** found more water than pressure management in one Nicosia DMA: 266,450 m³/yr against 77,000 m³/yr. It is fast as well. In Jakarta, simply eliminating large leaks in the first permanent area cut leakage by **more than 60 L/s** ([IWA DMA Guidance 2024](https://www.leakssuitelibrary.com/wp-content/uploads/2026/01/IWA-DMA-Guidance-Notes-2024.pdf)). Its weakness at Kçiq is pressure. At 12.6 bar, repaired networks break again, and a high-burst area exposed to high pressure "will likely lead to a spate of bursts" ([Koeller/Veritec 2010](https://calwep.org/wp-content/uploads/2021/03/Distribution-System-Pressure-Management-PBMP-2010.pdf)). B on its own also scores poorly on the 20% DMA-plus-pressure criterion.

**Smart customer meters (C)** look modern but target the smaller part of the problem. Selangor's 119,000 meter replacements made sense where commercial losses were large ([Kingdom et al. 2006](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf)). In Kçiq they would address perhaps a tenth of NRW. If the 250 zero-bill accounts are vacant emigrant homes, they recover little revenue. Pitch C as a follow-on module on the same LoRaWAN network, targeted at the 250 zero-bill and 485 old meters.

## Reading the 24-hour inflow curve and minimum night flow

The 24-hour inflow profile is the pitch's best diagnostic chart, because a leakage-dominated DMA has a recognisable shape. Leakage runs around the clock, while consumption peaks in the morning and evening and almost disappears between 02:00 and 04:00. During that window leakage makes up the largest share of inflow ([GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)).

### The method in eight steps

1. **Check zone integrity.** Confirm the boundary valves are closed so that inlet flow equals DMA consumption plus losses.
2. **Log the data.** Record inflow and pressure at the inlet, the average zone point (AZP) and the critical point at **15-minute intervals for at least 7 and preferably 14 nights**. UK practice uses a rolling 7-day 20th percentile of each night's minimum rolling hour ([UKWIR 99/WM/08/21](https://ukwir.org/eng/topic-catalogue?object=41cad5e3-48c0-4f66-8546-ff1bdc6f9dfe)).
3. **Subtract legitimate night use.** The international default is population × 6% active night population × 10 L per flush per hour ([Amoatey et al., citing Farley 2001](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content)). Large night users such as schools, bakeries and livestock watering are added separately ([WRC BENCHLEAK](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf)).
4. **Convert night leakage to a daily volume.** Multiply it by the hour-day factor, HDF = Σ(P_i/P_MNF)^N1. HDF is usually **18–22 in South Africa and 15–30 (average 22) in the UK**, and at most 24 in gravity systems ([Amoatey et al.](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content)).
5. **Split the leakage.** Separate background leakage, using the BABE defaults of 20 L/km/h on mains plus 1.25 L/connection/h at 50 m, from bursts. Then express the burst component as equivalent service-pipe bursts of 1.6 m³/h each ([McKenzie, Bhagwan & Lambert](http://www.geocities.ws/kikory2004/10_mckenzie.pdf)).
6. **Reconcile.** Compare the bottom-up leakage figure with the top-down water balance over the same period.
7. **Benchmark.** Compute UARL = (18·Lm + 0.8·Nc + 25·Lp)·P and ILI = current real losses / UARL ([LEAKSSuite](https://www.leakssuitelibrary.com/uarl-and-ili)).
8. **Measure N1.** Run a night pressure-step test and use N1 = ln(L1/L0)/ln(P1/P0) ([Lambert & Fantozzi](https://www.leakssuitelibrary.com/wp-content/uploads/2021/05/LambertFantozziJun2010-updated15May2021.pdf)).

Errors in the night-use allowance matter less in a DMA like Kçiq. In a high-loss zone, legitimate night use is a small share of MNF, so a wrong allowance barely changes the result ([McKenzie lecture](https://www.youtube.com/watch?v=MlCbiaI8GBc)). Kçiq's default allowance is only about **0.4–0.8 L/s**, so a ±0.4 L/s error changes the daily leakage estimate by roughly 3%.

### What Kçiq's curve should look like (estimate, not yet measured)

Combining the totals with these defaults and an assumed gravity pressure model gives a **nearly flat curve**:

| Indicator | Central estimate | Range |
|---|---|---|
| Average inflow | 18.5 L/s | — |
| Expected MNF | **13.3 L/s ≈ 48 m³/h** | 12.1–14.6 L/s |
| MNF / average inflow | 0.72 | 0.65–0.79 |
| Night leakage | ≈ 44 L/conn/h, ≈ 0.81 m³/km/h | — |
| Daily real losses (HDF ≈ 22) | ≈ 1,000 m³/day | 899–1,118 m³/day |
| ILI (UARL ≈ 82.5 m³/day at 45 m) | **≈ 12** | 9.6–13.6 |
| Peak/MNF ratio | ~1.6 | vs ~4.6 for the design demand curve alone |

An ILI of about 12 places Kçiq in World Bank developing-country **Category C, close to D** ([Kingdom et al. 2006](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf)). With only about 1,031 connections, below the 3,000-connection validity limit, the ILI is indicative only, so report L/connection/day and m³/km/day next to it ([GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)). The BABE split matters most for planning. Background leakage, even with a poor-condition factor of 2–3, explains only about 4–6 m³/h. The remaining **39–43 m³/h is equivalent to about 25–28 service-pipe bursts**, which are detectable and repairable. That is the arithmetic case for doing the leak hunt first.

### What the measured MNF would tell you

- **MNF of about 12–15 L/s with a flat plateau** confirms the physical-leakage diagnosis.
- **MNF of 5–9 L/s** means real losses are only 400–750 m³/day. Attention then shifts to meters, the 250 zero-bill accounts and the accuracy of the inlet meter.
- **MNF above 0.8 × average inflow** points to night tank refilling, irrigation or an open boundary valve.
- **A night-to-night step of about 0.4–0.5 L/s** marks a new service-pipe burst and becomes the alarm trigger.

### Pitfalls for the logging campaign

Several pitfalls are specific to Kosovo and Kçiq:

- **Household tanks.** Roof and ground tanks refill at night. One model shows MNF rising by up to **400%** if every customer has a tank ([Applied Water Science 2025](https://link.springer.com/article/10.1007/s13201-025-02490-6)). On the curve, refilling looks like a slow decay after midnight, while leakage looks like a flat floor.
- **Intermittent supply.** MNF is valid only after the zone is saturated. That took 63 hours in Zarqa ([Al-Washali et al. 2019](https://www.mdpi.com/2073-4441/11/1/48)).
- **Season.** Summer irrigation inflates night flow, so run the baseline outside July–August. A November–January start is well timed.
- **Inlet meter at low flow.** An oversized inlet meter can under-read at night, so check its accuracy at about 12 L/s.
- **Clocks.** Synchronise the logger clocks so that flow and pressure line up.

## A EUR 2–4k LoRaWAN kit covers the whole monitoring layer

Generic LoRaWAN sensors cost 10–30 times less than water-industry loggers and are enough for a DMA pilot. Indicative prices (dated 2026-11-14, excluding Kosovo VAT and customs) are:

| Device | Role at Kçiq | Price | Key spec |
|---|---|---|---|
| Milesight EM300-DI pulse counter | Inlet meter, 15-min flow and MNF | **€99** ([Orbita Digital](https://www.orbitadigital.com/en/electricidad/smart-home-home-automation/iot-lorawan/51475-milesight-ms-em300-di-868m-lorawan-pulse-counter-up-to-15km-range-with-direct.html)) | 5–10 yr battery at 10-min interval; flow alarms ([MCCI](https://store.mcci.com/products/milesight-pulse-counter-em300-di)) |
| Milesight EM500-PP pressure sensor | Inlet, critical high point, >12 bar low point, future PRV sites | **US$330 (~€290)** ([MCCI](https://store.mcci.com/products/milesight-uc500-pp-series-pipe-pressure-sensor)) | 0–16 bar, ±0.5% FS, 10-yr battery ([datasheet](https://resource.milesight.com/milesight/iot/document/em500-pp-datasheet-en.pdf)) |
| Dragino PS-LB-I3 level probe | Reservoir level; bypasses the broken Notus cable | **€129.80** ([InviBIT](https://invibitshop.com/products/dragino-ps-lb-i3-lorawan-pressure-liquid-level-sensor-with-3m-cable-eu868)) | 3 m immersion probe |
| Dragino PS-LB-NA | Reads a 4–20 mA meter or a 0–25 bar transducer | No price found ([Dragino](https://www.dragino.com/products/lora-lorawan-end-node/item/258-ps-lb-ls-na.html)) | Powers the external sensor |
| Dragino DLOS8N gateway | One gateway on high ground near the reservoir | **€259.30** ([IoT-Shop.de](https://iot-shop.de/en/shop/dragino-dlos8n-outdoor-lorawan-gateway-5841)) | IP65, optional 4G backhaul |
| Milesight UG65 (alternative) | Gateway with built-in network server | US$468–565 ([Choovio](https://www.choovio.com/product/dlos8n-outdoor-lorawan-gateway)) | MQTT/HTTP API, Node-RED ([datasheet](https://resource.milesight.com/milesight/iot/document/ug65-datasheet-en.pdf)) |
| Network server | — | **Free**: The Things Stack Discovery for ≤10 devices ([TTI](https://www.thethingsindustries.com/stack/plans/)) or self-hosted ChirpStack, MIT licence ([GitHub](https://github.com/chirpstack/chirpstack)) | — |
| Noise loggers (phase 1b, rotated) | Pinpoint leaks in sub-areas flagged by MNF | **US$500–1,500 each**; correlator US$15–30k ([H2Leak](https://h2leak.com/best-leak-detection-methods-ranking)) | 60–80 m spacing on PE, 80–140 m on metallic pipe ([Hydrograph](https://hydrograph.co.nz/solutions/water-leak-monitoring-systems)) |
| Ground microphone kit | Low-cost alternative to buying loggers | Gutermann AquaScope 3 basic **US$1,999.99** ([GP Technical](https://gp-technical.com/product-category/uncategorized/leak-detector-correlator)) | Used together with step tests |

Built from these unit prices, the team's estimate for phase 1 is **€1,800–3,900**. It covers one or two pulse counters, three to five pressure sensors, one level probe and one gateway, plus estimated amounts for masts, fittings, a SIM and a small server. The data stack is LoRaWAN sensors → gateway → Mosquitto MQTT → TimescaleDB or InfluxDB → Grafana for dashboards and alarms, with "no per-device fee" ([LoRaWAN-Consulting](https://lorawan-consulting.com/articles/chirpstack-private-lorawan-server)). That is enough for the pilot. Kafka-scale pipelines only make sense with tens of thousands of AMI meters.

Network choice is the main technical risk, and it favours LoRaWAN. **NB-IoT and LTE-M coverage in Kosovo could not be confirmed**: coverage data lists them as "check availability", and IPKO lists 2G/3G/LTE only, with a 3G sunset on 31/12/2025 ([Netquori](https://www.netquori.com/connectivity/coverage/kosovo); [Onomondo](https://onomondo.com/nb-iot-sim)). That rules out NB-IoT-only devices such as Gutermann ZONESCAN AI for now. Sewerin's SePem 351 is a LoRaWAN noise logger with a nine-year battery, used by Veolia in France ([Sewerin](https://www.sewerin.com/en-us/news-stories/stories/how-water-leak-detection-experts-work)), which leaves a path to permanent acoustic monitoring later. Kosovo also has a local precedent: KRU Gjakova runs what was described as the first residential smart-meter deployment in Kosovo on a dedicated LoRaWAN network, delivered by the integrator Fourbyte ([Fourbyte](https://www.linkedin.com/posts/fourbyte_smartwater-waterutilities-digitaltransformation-activity-7491072390328934400-_-7v)). Citing Gjakova shows the jury the approach already works in Kosovo. The SDC-funded IWRM-K Phase 2 programme (2024–2029), which explicitly covers "piloting smart solutions", is a possible co-funding route ([Skat](https://skat.ch/projects/integrated-water-resources-management-in-kosovo-iwrm-k-program-phase-2)).

For valves, start with a **fixed-outlet pilot PRV** such as the Bermad 720 or Cla-Val 90-01. Upgrade to time-modulated control (Bermad 720-4T) or a 4–20 mA remote set-point (Cla-Val 390-02) only after four to eight weeks of pressure data show night-time over-pressure ([Bermad 720](http://www.tuberiasdeacero.com/pdf/tienda/bermad_reducto_a_de_presion.pdf); [Cla-Val E-390-02](https://www.cla-val.com/wp-content/uploads/2021/03/E-390-02.pdf)). Waterworks PRV prices are quote-only. A DN100 pilot PRV from a non-waterworks brand lists at **€3,489 excluding VAT** ([Bola Systems](https://www.bolasystems.com/honeywell-dr300-100a-pressure-reducing-valve-dn100)). The Kosovo study's **EUR 15,000 installed** figure, which includes the chamber and civil works, is the safer number to budget per site.

## Pressure maps need fixed breaks at the 7 bar limit

The maps carry the "DMA + pressure" argument visually, and one rule matters most: **use manual class breaks tied to the regulatory and operational thresholds, not quantiles or Jenks**. Manual breaks are the right choice when a fixed breakpoint matters or when several maps must share the same classes. Natural breaks give each dataset its own solution, so maps in a series cannot be compared, and quantiles can split similar values ([Axis Maps](https://www.axismaps.com/guide/data-classification)). On Kçiq's data, where roughly half the buildings exceed 7 bar, a quantile scheme would bury the limit in the middle of a class.

The recommended pressure scheme is a diverging blue-to-red ramp split exactly at 7 bar. It uses verified ColorBrewer swatches ([ColorBrewer JSON](https://raw.githubusercontent.com/axismaps/colorbrewer/master/export/colorbrewer.json)) and must be identical in Leaflet, KML and on the slide:

| Class (bar) | Meaning | Hex | KML (aabbggrr, 80%) |
|---|---|---|---|
| < 1.5 | Below minimum (keep in legend, n = 0) | hollow, black outline | `ff000000` |
| 1.5–5.0 | Compliant target band | `#4575B4` | `ccb47545` |
| 5.0–7.0 | Compliant, high | `#91BFDB` | `ccdbbf91` |
| 7.0–9.0 | Above 7 bar limit | `#FDAE61` | `cc61aefd` |
| 9.0–11.0 | Well above limit | `#F03B20` | `cc203bf0` |
| ≥ 11.0 | Severe (max 12.63) | `#BD0026` | `cc2600bd` |
| No data | — | `#BDBDBD` | `ccbdbdbd` |

The 1.5–7 bar corridor comes from the project's own reading of ARRU Rule 02/2016. The rule text could not be found online, so check it on arru-rks.org before printing it on the slide.

For the Z1–Z19 zone choropleth, use a transparent leakage-risk score rather than the DMA's single 69.93% NRW figure. That figure is measured once for the whole DMA and cannot be allocated to zones without zone meters, so the team should show it as a text box. No standard zone-risk index exists. Published methods combine weighted layers such as pressure, pipe age, burst history and night-flow drift ([US patent 9,053,519](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9053519); [Renaud et al., IWA PI2023](https://hal.inrae.fr/hal-04314106/file/IWA_PI2023_Session5_EddyRenaud.pdf)). The weights are local judgement, so state them on the slide. A defensible Kçiq score uses FAVAD-style pressure exposure (mean of (P/3 bar)^N1), connection density, the share of buildings above 7 bar and household-PRV mitigation. Map it with fixed 0–25/25–50/50–75/75–100 breaks in sequential OrRd, because 19 zones are too few for quantiles to mean anything. Show pipe diameter by line weight in a single hue across four DN classes, with mains drawn on top, and keep colour for pressure and risk.

On colour, avoid red-green ramps such as RdYlGn and rainbow ramps. Drop pale yellows on satellite imagery, never map raw totals as a choropleth, and put at most five classes on a projector slide. Every legend needs a unit, a count per class, a no-data swatch, a "7 bar limit" divider line and a source line labelling the values as modelled ([ColorBrewer](https://colorbrewer2.org/); [Esri on basemaps and ramps](https://www.esri.com/arcgis-blog/products/arcgis-online/mapping/smart-choices-for-basemaps-and-color-ramps-when-mapping-demographic-data)).

In KML, colours are written as **aabbggrr**, so a hex colour typed as RRGGBB comes out with red and blue swapped. Use these elements ([Google KML Reference](https://developers.google.com/kml/documentation/kmlreference); [KML Regions](https://developers.google.com/kml/documentation/regions)):

- one shared Style per class
- a StyleMap for hover highlighting
- a PNG legend in a ScreenOverlay, packaged inside a KMZ
- `radioFolder` ListStyle to switch between the "Pressure" and "Risk" views
- Region/Lod so the 1,040 consumer points appear only when the user zooms in

In Leaflet, follow the official choropleth pattern of one break array shared by `getColor`, the style function and the legend control ([Leaflet tutorial](https://leafletjs.com/examples/choropleth/)). Use `L.circleMarker` on a canvas renderer so phones stay responsive.

## Why leak hunt then PRVs beats either half alone

The team's two-phase design follows the published sequence. GIZ says that once a DMA is set up, the first job is to quantify leakage and clear the backlog. Only then is the DMA upgraded to a pressure management area with PRVs at its inlets, which reduces background leakage and new bursts ([GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)). The IWA describes "a permanent leakage and pressure control system" as "the first step" in high-loss networks ([IWA DMA Guidance 2024](https://www.leakssuitelibrary.com/wp-content/uploads/2026/01/IWA-DMA-Guidance-Notes-2024.pdf)). Its Jakarta case followed the same order: big leaks first (−60 L/s), then a PRV pilot with night-time pressure reduction. Limassol (Lemesos) combined MNF-driven leakage control and pressure management to cut leakage from **138 to 92 L/connection/day** and ILI from 2.66 to 1.96 ([Charalambous, LEAKSSuite](https://www.leakssuitelibrary.com/wp-content/uploads/2019/08/Bambos-EU-Ref-Doc-Case-Study-update.pdf)).

Each half fails on its own in a predictable way. A PRV without a leak hunt leaves the 25–28 equivalent bursts running at reduced flow. A leak hunt without PRVs watches repaired pipes fail again at 12.6 bar. Together they cover every jury criterion:

| Jury criterion | Weight | How the combined idea covers it |
|---|---|---|
| Situation analysis | 15% | MNF evidence that losses are physical |
| DMA + pressure | 20% | Pressure zones with PRVs |
| Smart/IoT | 15% | LoRaWAN telemetry and alarms |
| KPIs | 20% | A complete KPI set (below) |
| 3–6 month pilot | 15% | A phased plan that fits the window |
| Economics | 10% | Payback in months |

The **phase 1 night-flow leak hunt (months 1–3)** runs as follows:

- **Week 1–2:** install the EM300-DI on the January 2026 inlet meter, three to five EM500-PP pressure sensors, the reservoir level probe and the gateway. Confirm the meter's output type first, because it decides which pulse or analog node to buy. Audit the boundary valves.
- **Weeks 2–4:** log a 14-night baseline to fix MNF, HDF and ILI.
- **Weeks 4–8:** run night step tests from about 02:00 to 04:00 with the zone valves to rank sections by burst flow. Deploy rotated noise loggers, a hired survey crew or a ground microphone only in the flagged sections. Repair crews clear the backlog.
- **Month 2:** begin PRV procurement so the valves arrive on time, since waterworks PRVs are quote-only and can have long lead times. Run a night pressure-step test to measure N1.

The **phase 2 pressure zones (months 4–6)** run as follows:

- Commission **one to three fixed-outlet PRVs** at the worst zones from the existing 19-zone design (the over-11 bar areas). The pilot's critical-point and low-point pressure data validate the PRV placement in that design before KRU commits to buying all 17 PRVs.
- Hold the critical-point pressure at no less than the service minimum.
- Add time modulation if the night data justify it.
- Move MNF alarms into routine operation, with a trigger of about +0.4–0.5 L/s above the post-repair baseline.

The KPIs to report each week are:

- MNF (m³/h)
- NRW in m³/day and L/connection/day, not just %
- m³/km/day
- ILI, marked as indicative
- AZP and critical-point pressure
- burst count
- repair time

The economics hold up even on cautious assumptions. Using the team's **target of 300–400 m³/day** of NRW reduction, which would take NRW from about 1,118 toward 700–800 m³/day, valued at Badovc's **EUR 0.453/m³ production cost** as a Kosovo proxy ([Lajqi et al. 2023](https://www.mdpi.com/2071-1050/15/21/15554/htm)), the saving is about **EUR 50–66k per year** before any avoided-burst savings. The target is in line with Gračanica's projected 640 m³/day and Nicosia's measured 1,097 m³/day. The pilot outlay, estimated at **EUR 35–65k**, covers EUR 2–4k of sensors, survey and repair costs, and one to three PRVs at about EUR 15k each installed. That gives a **payback of roughly 6–16 months**, with about 9–10 months in the central case. The cost per m³/day saved is roughly US$100–240, about US$150 in the central case, below the World Bank's typical **US$250 per m³/day** for physical-loss reduction ([Kingdom et al. 2006](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf)). The pitch should be open about the uncertainties. The Kosovo PRV figures are a projection, no Balkan prices exist for repairs or zone chambers, and the burst-reduction target should be stated as the observed **average of about 50%**, not the more than 80% that the 1.4 rule would mechanically predict.

## Conclusion

The data turn Kçiq from an "NRW problem" into a pressure problem. A near-flat inflow curve, an ILI of around 12 and 25–28 equivalent bursts are the signature of leaks forced open by excess head, not of theft or bad billing. That is why customer meters, the most visibly "smart" option, rank fifth. In this DMA, the smart part of the pitch is the logger and alarm layer that proves the diagnosis and keeps repairs from being undone. The MNF campaign also tests the pitch's central assumption. If measured MNF comes in at 5–9 L/s rather than 12–15 L/s, the diagnosis shifts toward meters and the plan should change before PRVs are bought.

The pilot's lasting value goes beyond the water it saves in six months. It converts a 19-zone, 17-PRV design study from a paper plan into one that has been validated in the field, for about the price of a single PRV, on a LoRaWAN network that customer meters can later join. A KRU-wide rollout could then start from Kçiq's own measured N1, HDF and savings rather than borrowed figures from Gračanica or Kozani. The most useful message for the jury is that the same results can be measured and repeated in KRU's other DMAs.
