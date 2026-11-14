# Low-cost IoT hardware and data architecture for DMA Kçiq (KRU Mitrovica)

Research scope: flow loggers, pressure loggers, acoustic noise loggers, LoRaWAN gateways and network servers vs NB-IoT, smart meters (AMR vs AMI), the data stack, and PRV control, with indicative prices for a 3 to 6 month pilot.

Research notes:
- All web sources were retrieved on **2026-11-14**, which is the "price date" for every price below unless another date is given. Shop prices change, and prices from US or Australian shops are not EU prices. A price marked **ESTIMATE** is my own figure with no source behind it.
- USD-to-EUR conversions are approximate (about 1 USD = 0.86 to 0.92 EUR) and are marked as conversions.
- Firecrawl ran out of credits partway through, so the research used Tavily search and extract. Several vendor pages (Technolog, Primayer, Bermad, Cla-Val, i2O) publish no prices; those gaps are listed explicitly.

---

## Key question 1: Indicative unit prices (EUR), battery life, reporting interval and range per device class

### Takeaway
Generic LoRaWAN devices are 10 to 30 times cheaper than water-industry loggers, and they cover everything a pilot needs. Examples: Milesight EM300-DI pulse counter about €99, Milesight EM500-PP 16-bar pressure sensor about USD 330, Dragino DLOS8N outdoor gateway about €259, and self-hosted ChirpStack for free. The weak spots are leak *localisation* (acoustic loggers cost about USD 500 to 1,500 each, and the best-known IoT model, Gutermann Zonescan, depends on NB-IoT) and NB-IoT itself: no source confirmed NB-IoT or LTE-M coverage in Kosovo, so a LoRaWAN-first design is the safer default.

### Cited findings

#### (1) Flow loggers and pulse readers for the zone inlet meter
- **Milesight EM300-DI LoRaWAN pulse counter, EU868 version:** €99.49 incl. tax, discounted from €153.07 (Spanish reseller). Specs: one pulse input (dry contact), IP67, NFC configuration, quoted range up to 15 km line of sight. Price date 2026-11-14. — [Orbita Digital](https://www.orbitadigital.com/en/electricidad/smart-home-home-automation/iot-lorawan/51475-milesight-ms-em300-di-868m-lorawan-pulse-counter-up-to-15km-range-with-direct.html)
- EM300-DI in US shops: USD 80 ([MCCI](https://store.mcci.com/products/milesight-pulse-counter-em300-di)) and USD 96 ([Emergent Metering](https://emergentmetering.com/products/em300-di-lorawan-pulse-counter)). Battery life is 5 years with the 4,000 mAh cell or 10 years with 8,000 mAh, both at a **10-minute interval** — [MCCI](https://store.mcci.com/products/milesight-pulse-counter-em300-di)
- EM300-DI datasheet: digital filtering of interference pulses, built-in calculation of water consumption with **water flow and outage alarms**, stored history with retransmission to prevent data loss, and a line-of-sight range of 10 km in the datasheet (the shop page claims 15 km). — [Milesight datasheet](https://resource.milesight.com/milesight/iot/document/em300-di-datasheet-en.pdf)
- Milesight says the **UC50x/UC51x controllers handle two water meters** and have more interfaces (analog inputs, valve control), while the EM300-DI is the cheaper single-meter device. — [Milesight EM300-DI page](https://www.milesight.com/iot/product/lorawan-sensor/em300-di)
- **Dragino SW3L** LoRaWAN flow sensor: 8,500 mAh Li-SOCl2 battery (up to 10 years, depending on update period), default uplink every 20 minutes, flow alarm, datalog, outdoor enclosure. No price found. — [Dragino SW3L](https://www.dragino.com/products/water-meter-flow-sensor/item/222-sw3l.html)
- **Dragino PS-LB-NA** analog-to-LoRaWAN node: one 0 to 20 mA input and one 0 to 30 V input, with 5 V and 12 V outputs to power an external sensor, and an 8,500 mAh battery (a solar plus 3,000 mAh Li-ion version, PS-LS-NA, also exists). This is the device for reading a 4 to 20 mA output from an electromagnetic meter, or for adding any third-party 0–25 bar transducer. No price found. — [Dragino PS-LB/LS-NA](https://www.dragino.com/products/lora-lorawan-end-node/item/258-ps-lb-ls-na.html)
- Water-industry loggers (no public prices):
  - **Lacroix SOFREL LogUp**: 4G LTE-M/NB-IoT logger, IP68, 3-year warranty, LX CONNECT cloud with a REST API. — [PCD Sales](https://pcdsales.com/lacroix-sofrel-logup); [Lacroix](https://www.lacroix-environment.com/telemetry-solutions/offers/rtus-data-loggers/data-loggers-en)
  - **SOFREL DL4W**: 2G/4G LPWAN modem, up to 10-year lithium battery. Lacroix says its DMA loggers compute average, minimum and maximum flow and daily summaries, and raise burst alerts on thresholds. — [Lacroix DMA page](https://www.lacroix-environment.com/telemetry-solutions/water-markets/water-distribution/district-metering-of-drinking-water-networks)
  - **Technolog Cello 4S**: offered as a CAT-M1/NB-IoT version; Gutermann Pty sells it "price on request". — [IndustrySearch](https://www.industrysearch.com.au/technolog-cello-4s-cat-m1-nbiot-pressure-and-flow-telemetry-data-logger/p/71817)
  - **Primayer XiLog+**: GSM/GPRS, IP68; the 1Fm variant logs two flow inputs plus daily minimum, maximum and total flow. — [DirectIndustry](https://www.directindustry.com/prod/primayer-sas/product-109697-2401749.html); [The Water Network](https://thewaternetwork.com/organization-c6k/ovarro-1qB7WCGVKhdebQnzVp5xdQ/product/primayer-xilog-1fm-cost-effective-network-flow-data-logger-xaIyFn3DopaXF4kj9V30IA)
  - A "USD 47" price for the Cello 4S appeared on an unrelated-looking site (forequartermadison.com). I **discarded it as unreliable**.
- **ThingsLog NRW Data Logger Set**: purpose-built for DMA campaigns, with telemetry over 4G/2G, Cat-M1, NB-IoT or LoRaWAN, up to 4 pressure transducers, a built-in ultrasonic flow meter option and MNF analysis. The vendor describes 2 to 4 week deployments per DMA zone before the set moves to the next zone. No price found. — [ThingsLog](https://thingslog.com/products/non-revenue-water-data-logger-set)

#### (2) Pressure loggers and transducers
- **Milesight EM500-PP**: USD 330 ([MCCI, US](https://store.mcci.com/products/milesight-uc500-pp-series-pipe-pressure-sensor)); AUD 369 excl. GST ([IoT Store, AU](https://iot-store.com.au/products/milesight-em500-pp-lorawan-pipe-pressure-sensor)). That is roughly €285 to 300 converted. No EU shop price was found. Specs:
  - Gauge range **0 to 1,600 kPa (16 bar)**, ±0.5% FS accuracy, 1 kPa (0.01 bar) resolution, 150% FS overload, G1/2" male connection.
  - 19,000 mAh battery, **10-year life at a 10-minute interval** (25 °C). Stores 1,000 records, with retransmission and threshold alarms.
  - IP67 transceiver, IP65 sensor, 1.5 m cable.
  - Sources: [MCCI](https://store.mcci.com/products/milesight-uc500-pp-series-pipe-pressure-sensor); [Milesight datasheet](https://resource.milesight.com/milesight/iot/document/em500-pp-datasheet-en.pdf)
- **Dragino PS-LB/LS** air/water pressure sensor: thread-mount or immersion type, several pressure ranges, 8,500 mAh Li-SOCl2 battery (or a solar version), BLE and LoRaWAN remote configuration, OTA firmware updates. — [Dragino PS-LB/LS](https://www.dragino.com/products/distance-level-sensor/item/384-ps-lb-ls.html)
  - A threaded PS-LB variant (1 MPa, G1/4) listed at roughly €55 to 60 ex/incl. VAT in a search snippet from Antratek (NL). The page could not be fetched to confirm the variant and price, so treat it as **unverified**. — [Antratek (snippet only)](https://www.antratek.com/lorawan-pressure-sensor-1mpa)
- **Dragino PS-LB-I3** (immersion, 3 m hydrostatic probe), suitable for **reservoir level**: €129.80 ([InviBIT Shop](https://invibitshop.com/products/dragino-ps-lb-i3-lorawan-pressure-liquid-level-sensor-with-3m-cable-eu868)); €128.57 excl. VAT ([shopIoT.eu](https://shopiot.eu/products/dragino-ps-i-lorawan-submersible-liquid-level-pressure-sensor)); USD 160 ([DWMZone](https://dwmzone.com/en/dragino/1120-ps-lb-i-immersion-installation-type-lorawan-air-water-pressure-sensor.html)).
- **Milesight UC50x** can take analog sensors and two meters ([Milesight](https://www.milesight.com/iot/product/lorawan-sensor/em300-di)). No UC50x price was retrieved.

#### (3) Acoustic noise loggers and correlators
- Market range for noise loggers: **about USD 500 to 1,500 per logger**, and USD 5,000 to 20,000+ for a small fleet. Leak noise correlators cost USD 15,000 to 30,000 for a complete system. This is a secondary source from a tracer-gas vendor, so treat it as an order of magnitude. — [H2Leak ranking](https://h2leak.com/best-leak-detection-methods-ranking)
- Gutermann ZoneScan 820 acoustic noise logger system: USD 3,650 (discounted from 4,650). The page does not say how many loggers are included. — [Central Testers](https://centraltesters.com/product/gutermann-zonescan-820-acoustic-noise-logger-system)
- Primayer Enigma Compact three-logger system, certified pre-owned: USD 3,499.95 — [Cartoli](https://www.cartoli.com/enigma-compact-three-logger-system-leak-detector.html). Primayer Eureka 3 PrimeTouch with Enigma Compact kit: USD 5,999.99 ([GP Technical](https://gp-technical.com/product-category/uncategorized/leak-detector-correlator)), and USD 7,199.95 pre-owned on [eBay](https://www.ebay.com/itm/176787315600). Gutermann AquaScope 3 basic ground-microphone kit: USD 1,999.99 ([GP Technical](https://gp-technical.com/product-category/uncategorized/leak-detector-correlator)).
- **Gutermann ZONESCAN AI** is an NB-IoT correlating logger with field-replaceable battery, time sync of ≤1 ms and leak pinpointing typically ≤1 m. Gutermann gives deployment spacing of 50 to 300 m. — [Gutermann](https://en.gutermann-water.com/product/zonescan-ai-correlating-iot-leak-logger)
- Spacing by pipe material for ZoneScan: **60 to 80 m on MDPE/HDPE, 80 to 100 m on asbestos cement, 80 to 140 m on cast iron, ductile iron or steel**. Usual logging window is 02:00 to 04:00, with a sound recording at 03:00. The NB-IoT version transmits daily to the Gutermann cloud, and the distributor calls it the cheapest option "where an NB IoT network is available". — [Hydrograph NZ](https://hydrograph.co.nz/solutions/water-leak-monitoring-systems)
- **Sewerin SePem 351** transmits over **LoRaWAN**; Sewerin claims it is currently the only LoRaWAN noise logger. Battery life is 9 years. It is used by Veolia units in Chaumont and Metz (France), and data can go to the utility's own system or to Sewerin's platform. — [Sewerin](https://www.sewerin.com/en-us/news-stories/stories/how-water-leak-detection-experts-work)
- Irish Water's DMA pilots used **LoRa pressure sensors on hydrants plus NB-IoT acoustic loggers**. — [JASPERS/EIB webinar, K. Murray, 2021](https://jaspers.eib.org/activitiesNP/2021/4.Webinar%20on%20Digitalisation%20in%20the%20European%20Water%20Sector%20-%20October%202021/4.%20Smart%20Water%20Metering%20-%20K.%20Murray.pdf)

#### (4) LoRaWAN gateways, network servers, and NB-IoT in Kosovo
- **Dragino DLOS8N** outdoor gateway (EU868; SX1302 with 2× SX1250; Wi-Fi and Ethernet, optional 4G EC25-E module for EMEA; IP65; PoE): **€259.30** — [IoT-Shop.de](https://iot-shop.de/en/shop/dragino-dlos8n-outdoor-lorawan-gateway-5841); specs from [Dragino](https://www.dragino.com/products/lora-lorawan-gateway/item/225-dlos8n.html)
- The Things Network comparison video put the Dragino DLOS8 at about **€400**, the Wifx L1 at about **€550** and the RAK7289 (IP67, LTE) at about **€600**. The video date is unknown and the DLOS8 is the older SX1301 model. — [TTN YouTube](https://www.youtube.com/watch?v=yJ0PoNyczh0)
- **Milesight UG65** (SX1302, 8 channels, IP65, 27 dBm, Ethernet/4G/Wi-Fi) has a **built-in network server and MQTT/HTTP API**, plus Node-RED and a Python SDK ([datasheet](https://resource.milesight.com/milesight/iot/document/ug65-datasheet-en.pdf)). US prices: USD 468 to 565 ([Choovio](https://www.choovio.com/product/dlos8n-outdoor-lorawan-gateway)) and from USD 550 ([Emergent Metering](https://emergentmetering.com/products/em300-di-lorawan-pulse-counter)).
- A secondary TCO article gives typical figures: outdoor gateway **€295 to 436** (with 2 km urban and **up to 15 km rural** coverage), indoor gateway €100 to 150, managed The Things Stack about **€198/month per 1,000 devices**, and self-hosted ChirpStack at server cost only. — [chinaheimayi.com TCO, 2026](https://chinaheimayi.com/nb-iot-vs-lorawan-water-meter-cost)
- **The Things Stack Cloud "Discovery" plan is free for up to 10 devices and 10 gateways**, with no time limit. Live paid-tier prices did not load. — [The Things Industries](https://www.thethingsindustries.com/stack/plans/)
- **ChirpStack** is MIT-licensed, free for commercial use, and runs on PostgreSQL, Redis and Mosquitto MQTT. Its gateway OS supports RAK, Dragino and Seeed gateways. — [GitHub](https://github.com/chirpstack/chirpstack); [ChirpStack docs](https://www.chirpstack.io/docs/chirpstack/requirements.html); [chirpstack.io](https://www.chirpstack.io)
- EU868 rules: devices must support the 868.1, 868.3 and 868.5 MHz join channels, with a 1% duty cycle and +16 dBm EIRP. — [TTN docs](https://www.thethingsnetwork.org/docs/lorawan/regional-limitations-of-rf-use). Sub-band duty cycles are 1% (868.0 to 868.6 MHz), 0.1% (868.7 to 869.2 MHz) and 10% (869.4 to 869.65 MHz) — [Minew](https://en.minewsemi.com/blog/understanding-lora-frequency-bands)
- **Kosovo:** a hobbyist guide says EU_868 is the normal choice "subject to the current national SRD rules" and advises checking ARKEP rules before high-site relays or amplifiers. This is secondary; **no primary ARKEP document was found**. — [MeshAtlas](https://blog.meshatlas.org/knowledge-base/legal-frequency-rules-for-meshtastic-and-lora-in-europe/legal-frequency-rules-for-meshtastic-in-kosovo)
- **NB-IoT and LTE-M in Kosovo are not confirmed.** Netquori's coverage data (updated September 2026) lists Kosovo NB-IoT and LTE-M as "check availability", with 2G/3G/4G/5G available — [Netquori](https://www.netquori.com/connectivity/coverage/kosovo). Onomondo lists IPKO (MCC/MNC 22102) with 2G/3G/LTE only and a **3G sunset of 31/12/2025** — [Onomondo](https://onomondo.com/nb-iot-sim). The GSMA list of LTE-M/NB-IoT launches (Nov 2025) shows A1 Serbia, A1 Croatia and A1 Bulgaria, and the excerpt retrieved did not include a Kosovo operator — [GSMA](https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/mobile-iot-commercial-launches)
- Cellular M2M SIM benchmarks (EU resellers, not Kosovo operators): from €0.50/month, about €2/month for 1 GB ([IoT Discount NL](https://www.iotdiscount.nl/en-gb/prijzen)); from €3/SIM/month ([Netcom Mobile](https://www.netcommobile.com/en/iot-m2m-simkaarten)). A TCO article says to expect €1 to 3 per meter per month for NB-IoT in Europe ([chinaheimayi](https://chinaheimayi.com/nb-iot-vs-lorawan-water-meter-cost)). **No IPKO or Vala IoT tariff was found**; IPKO is listed as offering M2M on LTE/HSPA/GSM ([m2msupport.net](https://m2msupport.net/m2msupport/ipko-kosovo-m2m-modules-certification-sim-data-plans)).

#### (5) Smart meters: AMR walk-by/drive-by (wM-Bus) vs LoRaWAN AMI
- AMR (walk-by or drive-by wM-Bus EN 13757-4 at 868 MHz, often with OMS) still needs a person and delivers monthly or quarterly data. AMI (fixed wM-Bus, LoRaWAN or NB-IoT) delivers daily or hourly data, which is **what enables leak alarms and night-flow analysis**. — [Cloud Studio IoT](https://cloudstudioiot.com/hub/smart-water-metering)
- ACRIOS (wM-Bus/M-Bus-to-LoRaWAN or NB-IoT bridges) claims reading costs **"from €16/meter, paid once"** with a 10+ year battery, against manual reading of about €30/meter/year, and a typical payback under 18 months. It also says **15 to 20% of meters stay out of reach** in pits and basements whatever network is chosen, and uses a €25 site-visit cost for Central Europe. These are vendor claims. — [ACRIOS water utilities](https://acrios.com/water-utilities); [ACRIOS bridge](https://acrios.com/converters/wireless-m-bus-bup-to-lorawan)
- Hardware cost structure: an ultrasonic DN20 smart meter costs RMB 180 to 350 (about €22 to 43, converted). The radio module adds RMB 10 to 30 for LoRa or RMB 15 to 40 for NB-IoT, so the choice of protocol shifts hardware cost by only about 5 to 10%. — [chinaheimayi](https://chinaheimayi.com/nb-iot-vs-lorawan-water-meter-cost)
- Semtech notes that limited wM-Bus FSK range and AMR/AMI cost against manual reading have slowed adoption, and that drive-by AMR (wM-Bus modes C1/C2) needs minimal infrastructure. — [Semtech blog](https://blog.semtech.com/wm-bus-and-lorawan-demo-with-lr1121-and-lr2021)

#### (6) Data stack
- A self-hosted reference stack consists of ChirpStack (network and application server), PostgreSQL, Redis, Mosquitto MQTT, a time-series database, **Grafana for dashboards and alerting**, and Nginx with Let's Encrypt, with "no per-device fee". — [LoRaWAN-Consulting](https://lorawan-consulting.com/articles/chirpstack-private-lorawan-server)
- The Milesight UG65 gateway runs an embedded network server with an MQTT/HTTP API, so a single-gateway pilot can skip a separate LNS. — [UG65 datasheet](https://resource.milesight.com/milesight/iot/document/ug65-datasheet-en.pdf)

#### (7) PRV control
- **Bermad 720**: pilot-controlled, diaphragm-actuated PRV with V-port throttling plug (stable at low flow), complying with EN-1074. Variants include **720-4T dynamic multi-setting** (time-based) and **WW-720-4T Sigma EN ES** with an electronic Multi-Setting Pilot Control. — [Bermad 720 brochure](http://www.tuberiasdeacero.com/pdf/tienda/bermad_reducto_a_de_presion.pdf); [Land & Water shop](https://shop.landwater.com.au/products/bermad-ww-720-4t-sigma-en-es-large-metal-dynamic-pressure-reducing-control-valve-with-electronic-multi-level-setting); WD-720 size range DN80 to 300 per [datasheet on Scribd](https://www.scribd.com/document/777538530/WW720ES-Data-sheet-1)
- **Cla-Val 90-01/690-01**: full-port and reduced-port pilot PRVs — [Cla-Val](https://www.cla-val.com/waterworks/pressure-control-valves/pressure-reducing-valves/90-01-690-01). **Cla-Val 390-02** electronic-actuated PRV: a CRD-34 pilot takes a **4 to 20 mA remote set-point from an RTU** — [Cla-Val E-390-02](https://www.cla-val.com/wp-content/uploads/2021/03/E-390-02.pdf). **Cla-Val 49-01/649-01**: combined rate-of-flow and pressure-reducing valve — [Cla-Val datasheet](https://www.cla-val.com/wp-content/uploads/2020/05/49-01-649-01-Data-Sheet-US_Metric.pdf)
- Price reference: a **Honeywell DR300-100A DN100 pilot-operated PRV costs €3,488.99 excl. VAT** (list €5,704.97). Honeywell is not a typical waterworks brand, so use this as a scale reference only. — [Bola Systems](https://www.bolasystems.com/honeywell-dr300-100a-pressure-reducing-valve-dn100)

### Inferences
- **Pressure range at Kçiq:** the EM500-PP (16 bar, 150% overload) is enough for points up to about 12 to 13 bar static. Low points that may see surges above 16 bar are better served by a 0–25 bar industrial 4–20 mA transducer read by a Dragino PS-LB-NA or Milesight UC50x.
- **15-minute logging fits the duty cycle.** At 15-minute uplinks a device sends 4 short packets per hour, well within the EU868 1% limit of 36 s per hour per sub-band. Quoted battery lives are for 10-minute intervals, so a 15-minute interval should match or beat them.
- **The broken Notus telemetry cable can be bypassed.** A battery LoRaWAN node at the tank removes the cable entirely: a PS-LB-I3 for level at about €130, plus a pulse or analog node on any outlet meter.
- **Avoid NB-IoT-only devices for now.** Because NB-IoT/LTE-M in Kosovo is unconfirmed, devices such as Gutermann ZONESCAN AI and Cello NB-IoT variants are a coverage risk. Prefer LoRaWAN devices (SePem 351, Milesight, Dragino), or 2G/4G loggers (SOFREL DL4W, XiLog+) where a SIM is acceptable. IPKO's 3G sunset (31/12/2025) means 3G-only loggers should also be avoided.
- **Kafka/Spark/Cassandra is unjustified at pilot scale.** 100 devices at 15-minute intervals produce about 9,600 readings per day (about 3.5 million rows per year), which PostgreSQL/TimescaleDB or InfluxDB on one small server handles easily. That pipeline makes sense only at roughly tens of thousands of AMI meters across many DMAs, with several independent consumers of the stream (billing, SCADA, analytics) and sub-minute data. A KRU-wide AMI rollout could eventually reach that point; one rural DMA will not.
- **Recommended minimal stack:** LoRaWAN sensors → gateway (UG65 built-in LNS, or DLOS8N with ChirpStack) → MQTT (Mosquitto) → a small ingest script or Node-RED/Telegraf → TimescaleDB or InfluxDB → Grafana. That covers dashboards, MNF calculation (for example the 02:00 to 04:00 minimum) and threshold alarms by email or Telegram, or the existing KRU web panel can read the same database.
- **PRVs: start simple.** A fixed-outlet pilot PRV (Bermad 720, Cla-Val 90-01) is the first step. Time modulation (720-4T) or flow modulation (Cla-Val 49-01, controller add-ons) can be added once flow and pressure data show night-time over-pressure.

### Gaps
- **No EU-reseller price was found for the Milesight EM500-PP, UC50x or UG65.** Only US and AU prices were found.
- The Dragino PS-LB threaded price (about €55 to 60) is a search snippet that could not be verified.
- Prices for 0–25 bar industrial transducers were not researched.
- **No public prices exist for Technolog Cello, Primayer XiLog+/Enigma (new), SOFREL LogUp/DL4W, Ijinus, Sebalog, Ovarro, Bermad 720, Cla-Val, Singer, i2O or Technolog Regulo.** All are quote-only. i2O and Regulo pressure-management controllers were not found at all in this session.
- **No IPKO or Vala (Telekomi i Kosovës) IoT/NB-IoT tariff, and no confirmed NB-IoT coverage, was found.** The team should ask both operators directly.
- No primary ARKEP SRD regulation for 863–870 MHz was retrieved. Whether ARKEP follows ERC Rec 70-03 or EU 2006/771/EC rules unchanged is unverified.
- No noise-logger rental price or leak-detection contractor survey rate was found.
- TTN community network fair-use limits were not checked in this session.

---

## Key question 2: Minimum viable kit for one DMA pilot, what to buy and total cost

### Takeaway
A LoRaWAN pilot covering the inlet meter, reservoir level, 3 to 5 pressure points, one gateway and an open-source stack costs roughly **€2,000 to 3,500 in hardware (ESTIMATE built from the cited unit prices)**, plus fittings and installation. Acoustic loggers are the expensive item, at about €4,500 to 25,000 to buy 10 to 20 units. They should be deployed in a later phase, or hired through a survey contractor, after MNF data shows which sub-area is losing water.

### Cited findings (unit prices used in the kit)
- Pulse reader for the inlet meter: EM300-DI-868M at €99.49 — [Orbita Digital](https://www.orbitadigital.com/en/electricidad/smart-home-home-automation/iot-lorawan/51475-milesight-ms-em300-di-868m-lorawan-pulse-counter-up-to-15km-range-with-direct.html)
- Pressure sensor: EM500-PP at USD 330 (about €285 to 300 converted) — [MCCI](https://store.mcci.com/products/milesight-uc500-pp-series-pipe-pressure-sensor)
- Reservoir level: PS-LB-I3 at €128.57 to 129.80 — [shopIoT.eu](https://shopiot.eu/products/dragino-ps-i-lorawan-submersible-liquid-level-pressure-sensor); [InviBIT](https://invibitshop.com/products/dragino-ps-lb-i3-lorawan-pressure-liquid-level-sensor-with-3m-cable-eu868)
- Gateway: DLOS8N at €259.30 — [IoT-Shop.de](https://iot-shop.de/en/shop/dragino-dlos8n-outdoor-lorawan-gateway-5841). Alternative: UG65 at USD 468 to 565, with built-in LNS — [Choovio](https://www.choovio.com/product/dlos8n-outdoor-lorawan-gateway)
- Network server: The Things Stack Discovery is free for ≤10 devices and ≤10 gateways ([TTI](https://www.thethingsindustries.com/stack/plans/)), or ChirpStack MIT-licensed self-hosted ([GitHub](https://github.com/chirpstack/chirpstack))
- Noise loggers: about USD 500 to 1,500 each — [H2Leak](https://h2leak.com/best-leak-detection-methods-ranking). Three-logger Enigma Compact pre-owned: USD 3,499.95 — [Cartoli](https://www.cartoli.com/enigma-compact-three-logger-system-leak-detector.html). Spacing 60 to 140 m depending on material — [Hydrograph](https://hydrograph.co.nz/solutions/water-leak-monitoring-systems)
- Campaign approach: lift-and-shift NRW sets deployed for 2 to 4 weeks per zone, then moved to the next — [ThingsLog](https://thingslog.com/products/non-revenue-water-data-logger-set)
- PRV scale reference: DN100 pilot PRV at €3,489 excl. VAT — [Bola Systems](https://www.bolasystems.com/honeywell-dr300-100a-pressure-reducing-valve-dn100)

### Inferences: proposed pilot BOM (Phase 1, months 1 to 3)

| Item | Qty | Unit price | Subtotal | Basis |
|---|---|---|---|---|
| Milesight EM300-DI-868M pulse counter on the Jan-2026 inlet meter (or PS-LB-NA if the meter has only a 4–20 mA output) | 1 to 2 | €99 | €100 to 200 | cited |
| Milesight EM500-PP 0–16 bar (inlet, critical high point, low point, PRV downstream, mid-zone) | 3 to 5 | ~€290 | €870 to 1,450 | USD cited, EUR converted |
| Dragino PS-LB-I3 level probe in the existing tank | 1 | €130 | €130 | cited |
| Dragino DLOS8N-868 with 4G (EC25-E), or Milesight UG65 | 1 | €260 to 520 | €260 to 520 | cited; the 4G variant uplift is ESTIMATE |
| Gateway mast, 868 MHz antenna, surge protection, and solar plus battery if no mains at the high site | 1 | ESTIMATE €200 to 600 | €200 to 600 | ESTIMATE |
| Tapping saddles, ball valves, adapters, small chambers/boxes | 4 to 6 | ESTIMATE €50 to 150 | €200 to 900 | ESTIMATE |
| Data SIM for gateway backhaul (IPKO/Vala data plan) | 1 | ESTIMATE €5 to 15/month | €30 to 90 for 6 months | ESTIMATE |
| Server: ChirpStack, Mosquitto, TimescaleDB/InfluxDB and Grafana on an existing KRU PC or a small VPS | 1 | ESTIMATE €0 to 10/month | €0 to 60 | ESTIMATE |
| **Phase 1 total** | | | **about €1,800 to 3,900** | mixed: cited plus ESTIMATE |

- **Phase 2 (months 3 to 6), leak localisation:**
  - Buying 10 loggers at USD 500 to 1,500 costs about €4,500 to 13,500; 20 loggers cost about €9,000 to 27,000. The correlator adds USD 15,000 to 30,000 if one is bought (cited ranges, converted).
  - The cheaper paths are (a) hiring a leak-detection contractor for a lift-and-shift survey of the 2 to 3 sub-areas flagged by MNF, or (b) a ground microphone (AquaScope 3 basic kit at about USD 2,000) plus step testing with the zone valves.
  - At 60 to 140 m spacing, 56 km of network would need 400 to 900 loggers for full permanent coverage. That is clearly not pilot scope, so loggers must be rotated.
- **One PRV pilot:** a valve of about €2,000 to 4,000 for DN80/100 (scale from the Honeywell reference; ESTIMATE for Bermad/Cla-Val) plus chamber, bypass and civil works (ESTIMATE €2,000 to 5,000). Add a time-modulation pilot only after 4 to 8 weeks of pressure data.
- **Sensor siting:** put one pressure sensor at the inlet, one at the highest customer (the critical point for minimum service pressure), one at the lowest point (above 12 bar, where leakage is highest), and one or two at future PRV locations from the 19-zone design. This lets the pilot validate the design study's PRV placement before 17 PRVs are bought.
- **Gateway siting:** with a 510 to 673 m elevation range, one gateway at or near the reservoir (high ground) probably covers most of the DMA (rural LoRaWAN coverage is quoted up to 15 km). A site survey with one test node is advisable before buying more gateways.

### Gaps
- The output type of the Jan-2026 inlet meter (reed pulse, open collector, 4–20 mA or Modbus) is unknown. It decides between the EM300-DI, PS-LB-NA and a RS485-LB.
- No Kosovo import, VAT or customs figures were researched (Kosovo VAT is not included in the EU prices above).
- No contractor rates were found for leak surveys in Kosovo or the region.

---

## Key question 3: What do utilities in the Balkans and SE Europe use? (case studies)

### Takeaway
Kosovo already has a LoRaWAN precedent: KRU Gjakova's residential smart meters with a dedicated network, delivered by the local integrator Fourbyte. Serbia has a public LoRaWAN plus NB-IoT operator network (Telekom Srbija with Actility). Elsewhere in Europe, LoRaWAN pressure and noise loggers combined with DMA flow logging is an established pattern. Documented DMA-telemetry case studies for SE European utilities were thin in this search.

### Cited findings
- **KRU Gjakova (Kosovo):** described as "the first implementation in Kosova of residential Smart Water Meters". It combined smart meters, "a dedicated telecommunication network" (tagged #LoRaWAN) and a software platform for remote reading, anomaly and leak detection. The integrator is Fourbyte. — [Fourbyte LinkedIn post](https://www.linkedin.com/posts/fourbyte_smartwater-waterutilities-digitaltransformation-activity-7491072390328934400-_-7v)
- **Kosovo, Prishtina-area case study (MDPI Sustainability, 2023):** measurements used an insertion electromagnetic flow meter with a data logger for flow and pressure, plus two pressure data loggers. It recommends data loggers on existing pulse-output meters as "one of the simpler and faster options", and says "data loggers with a SIM card" are cost-efficient. It also mentions WU Prishtina's meter calibration lab. — [MDPI Sustainability 15(21):15554](https://www.mdpi.com/2071-1050/15/21/15554)
- Kosovo's Regional Water Companies had NRW of **58%**. The World Bank recommends performance-based approaches to NRW, and the association SKUKOS runs NRW capacity programmes through DLEAP. — [World Bank Kosovo Water Security Outlook](https://documents1.worldbank.org/curated/en/496071548849630510/Water-Security-Outlook-for-Kosovo.pdf)
- **IWRM-K Phase 2 (May 2024 to April 2029):** funded by SDC, implemented by Skat with the Environment Agency Austria, and covering "piloting smart solutions" for water challenges in Kosovo. It is a possible co-funding or partnership channel. — [Skat](https://skat.ch/projects/integrated-water-resources-management-in-kosovo-iwrm-k-program-phase-2)
- **Serbia:** Telekom Srbija rolled out NB-IoT alongside its public LoRaWAN network (Actility as vendor) for industry, energy providers, cities and municipalities (article dated January 2023). — [RCR Wireless via PA Wireless](https://pawireless.org/feed-rss/telekom-serbia-bundles-nb-iot-and-lorawan-in-unified-national-iot-network)
- A1 has commercial NB-IoT and LTE-M in Bulgaria, Croatia, Serbia and Slovenia (GSMA list, Nov 2025). — [GSMA](https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/mobile-iot-commercial-launches)
- France (Veolia, Chaumont and Metz): permanent LoRaWAN noise logging with the Sewerin SePem 351 — [Sewerin](https://www.sewerin.com/en-us/news-stories/stories/how-water-leak-detection-experts-work). Ireland (Irish Water): LoRa hydrant pressure sensors plus NB-IoT acoustic loggers in DMA pilots, within a national leakage programme targeting 47% leakage down to 38% — [JASPERS/EIB](https://jaspers.eib.org/activitiesNP/2021/4.Webinar%20on%20Digitalisation%20in%20the%20European%20Water%20Sector%20-%20October%202021/4.%20Smart%20Water%20Metering%20-%20K.%20Murray.pdf)
- Palermo (Italy): Tektelic cites a LoRaWAN water-management network serving 145,000 users. This is a vendor claim. — [Tektelic](https://tektelic.com/expertise/amr-or-ami-which-to-choose-for-smart-metering)

### Inferences
- **Peer learning:** KRU Gjakova and Fourbyte are the closest peer reference for LoRaWAN in Kosovo, both for ARKEP practice and for local integration support. Contacting them could save months on gateway siting, network-server choice and regulatory questions.
- **Leakage before AMI:** the Gjakova project is AMI (customer meters), not DMA leakage monitoring. For Kçiq, flow and pressure telemetry at the inlet and pressure zones gives MNF faster than metering all customers. AMI can follow on the same LoRaWAN network.
- **Network choice:** where national NB-IoT exists (Serbia, Croatia, Bulgaria), utilities can buy NB-IoT devices off the shelf. Kosovo's unconfirmed NB-IoT status pushes toward a private LoRaWAN network, the same choice Gjakova appears to have made.

### Gaps
- **No published DMA-telemetry case studies were found for utilities in Albania, North Macedonia, Bosnia and Herzegovina, Montenegro or Serbia** (for example Skopje, Tirana or Novi Sad), and none for KRU Mitrovica's own past loggers.
- The Gjakova project's scale (number of meters and gateways), cost, meter brand and network server were not disclosed in the retrieved post.
- The origin, model and protocol of the inactive "Notus" logger at Kçiq could not be identified, so whether it can be reused is unknown.
