# 24-hour DMA inflow profile and Minimum Night Flow (MNF) analysis: method note and worked estimate for DMA Kçiq (KRU Mitrovica)

Scope: (a) building and reading the 24 h inflow curve, (b) the MNF / BABE / FAVAD / UARL-ILI method, (c) an ESTIMATE for DMA Kçiq from the Feb–Sep 2026 totals, (d) logging requirements and pitfalls. Standard defaults (sourced) are kept apart from Kçiq numbers (computed here, labelled ESTIMATE). Units: l/s, m³/h, m³/d; pressure in metres head (1 bar ≈ 10.2 m).

---

## Q1. What are the standard legitimate night-use allowances and where do they come from?

### Takeaway
The international default is customer night use = population × Active Night Population (ANP, 6 %) × 10 l per toilet flush per hour (Farley 2001). South African WRC software uses the same structure with 3 % in its worked example. Large night users are added separately ("exceptional users"). UK regulatory practice has moved from fixed defaults to company-measured household night use (HHNU) and non-household night use (NHHNU) from logged samples. I could not confirm the commonly quoted "1.7 l/property/h" from a primary source.

### Cited Findings
- MNF method: leakage = (MNF − customer night use Q_CNU) × HDF. ANP is the share of customers using water between 00:00 and 04:00. Q_CNU depends on ANP and HDF depends on N1 — [Amoatey et al., Ghana MNF study (UGSpace)](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content)
- "Farley (2001) recommends an ANP of 6 %", later adopted by Fanner & Thornton (2005) and Tabesh et al. (2009) — [Amoatey et al. (UGSpace)](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content)
- Sensitivity: each 1 % change in ANP moved the leakage estimate by 7–11 % (relative error). Each N1 step moved it by up to 4 %. The authors say utilities should establish local ANP and N1 values — [Amoatey et al. (UGSpace)](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content)
- Rule-of-thumb from R. McKenzie: of 1,000 people, about 6 % flush in any one hour, at 10 l per flush, so about 600 l/h of expected toilet use. Background leakage is then added from the UK BABE defaults (about 20 l/km mains/h, among others) — [McKenzie, "The use and interpretation of Minimum Night Flows" (video, approx. 53:00)](https://www.youtube.com/watch?v=MlCbiaI8GBc)
- WRC BENCHLEAK worked example for "Expected Normal Night Use": population 6,525 × 3 % active during MNF × 10 l/flush + exceptional users (0 l/h) = 1,957 l/h. Exceptional (large) night users must be identified and quantified separately — [WRC TT184/02 BENCHLEAK User Guide](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf)
- The GIZ/VAG guidelines split legitimate night consumption into domestic night consumption Q_dom (mainly toilet flushing) and non-domestic Q_bulk (administrative, industrial, commercial or agricultural users). Q_bulk "may represent a large percentage of minimum night flow" — [GIZ/VAG, Guidelines for Water Loss Reduction (2011)](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)
- UK (Ofwat) practice: HHNU and NHHNU allowances must come from statistically valid surveys (monitors or smart meters). They are subtracted from MNF over the same time window (e.g. if the MNF hour is 03–04, the allowances must be for 03–04). Most companies use the UKWIR 1999 NHHNU method, which relates night use to annual billed volume. Non-household samples are logged for at least 2 weeks. Large non-households above roughly 24–48 m³/d are monitored continuously — [Ofwat PR24 Leakage PC definition (2025)](https://www.ofwat.gov.uk/wp-content/uploads/2025/03/Leakage-FD-PC-definition-1.pdf); [Ofwat PR24 definition (2023)](https://www.ofwat.gov.uk/wp-content/uploads/2023/05/Leakage-_-FD-PC-definition.pdf); [Ofwat PR19 reporting guidance](https://www.ofwat.gov.uk/wp-content/uploads/2018/03/Reporting-guidance-leakage.pdf)
- UKWIR found that continuous low flows (e.g. dripping float valves, internal leaks) are largely unmeasured or under-registered by customer meters. Night-use monitors need adjusting for this — [UKWIR catalogue, report 12/WM/08/48](https://ukwir.org/eng/topic-catalogue?object=41cad5e3-48c0-4f66-8546-ff1bdc6f9dfe)
- Under the IWA definition, minimum night consumption includes ordinary and exceptional customer night use and possibly post-meter (customer-side) leakage. Fixed literature values "can heavily mislead" leakage estimates — [WebSearch summary of Serafeim et al. 2021 (IRIS Unica)](https://iris.unica.it/retrieve/1187f0fb-159f-49b9-bd15-2089322ff312/serafeim_et_al_2021_accepted_IRIS.pdf)
- Water UK states the UK bottom-up formula as: Distribution losses = MNF − (Household night use + Non-household night use) × pressure correction — [Water UK, Leakage Routemap to 2050](https://www.water.org.uk/sites/default/files/wp/2022/03/Water-UK-A-leakage-Routemap-to-2050.pdf)
- McKenzie says that where leakage is high, legitimate night use is a small part of MNF, so errors in it barely change the result — [McKenzie video (approx. 1:00:40)](https://www.youtube.com/watch?v=MlCbiaI8GBc)

### Inferences
- For Kçiq (4,276 people, 775 active accounts), the two default routes give:
  - ANP route: 4,276 × 0.06 × 10 l/h = 2,566 l/h ≈ **0.71 l/s** (at 3 % ANP: 0.36 l/s).
  - Per-property route with the unverified 1.7 l/prop/h: 775 × 1.7 = 1,318 l/h ≈ 0.37 l/s.
  - Use 0.4–0.8 l/s as the domestic range. Add any non-household night users (school, mosque, bakery, farms or livestock watering, car wash) as measured or estimated point flows.
- Because expected Kçiq night leakage is about 12 l/s (Q6), a ±0.4 l/s error in night use changes daily leakage by only about ±3 %. In a high-loss DMA the defaults are good enough for a first estimate.

### Gaps
- I could not confirm the "1.7 l/property/h" UK household figure or a UK default non-household figure (e.g. "8 l/property/h") from a primary source in this session. The UK "Managing Leakage" Reports E/F (1994) are not freely online. Treat these as unverified until checked against Report E or UKWIR 14/WM/08/53 ("Improved Household Night Use Allowances").
- No Kosovo or Balkan measured ANP or night-use study was found.

---

## Q2. How is the Hour-Day Factor (HDF) computed under FAVAD, and what are typical values?

### Takeaway
HDF (also called the Night-Day Factor, NDF) converts the leakage rate at the MNF hour into a daily volume: Daily leakage = Night leakage rate × HDF, where HDF = Σ over 24 hours of (P_i / P_MNF)^N1. Gravity systems with daytime head loss have HDF ≤ 24 h/d. Typical values are 18–22 (South Africa), 15–30 with an average of 22 (UK), and 14 in an intermittent supply. N1 is about 0.5 for rigid-pipe holes or cracks, about 1.0 for mixed systems and about 1.5 for background leaks and flexible pipes.

### Cited Findings
- FAVAD relation: Q1/Q0 = (P1/P0)^N1 (Lambert 2001). HDF formula: HDF = Σ_{i=1..24} (P_i / P_MNF-hour)^N1, where P_i is the average pressure at an observed point in hour i and P_MNF-hour is the pressure during the minimum night hour — [Amoatey et al. (UGSpace)](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content)
- "Gravity-fed networks and low-pressure gravity systems usually have HDF less than or equal to 24 hours per day due to high frictional head losses" (Morrison et al. 2007). HDF is estimated in the UK at 15–30 (average 22) and in South Africa at 18–22 (García 2006; Cheung 2010; Lambert & Thornton 2012). Kayseri, Turkey: 22.5 (Özdemir 2021) — [Amoatey et al. (UGSpace)](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content)
- WRC worked example: with hourly AZP readings of 46–72 m and N1 = 2.0, HDF = Σ(P_x)^N1 / (P_MNF)^N1 = 96,308 / 5,213 = **18.5**. Large day-to-day scatter in HDF can point to wrong night-use estimates. N1 of 1.0–2.5 means leakage is sensitive to pressure, and 0.5–1.0 means it is relatively insensitive — [WRC TT184/02 BENCHLEAK](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf)
- Intermittent supply (Zarqa, Jordan): applying the MNF-hour leakage rate to all 24 h overestimates daily leakage because daytime pressures are lower. There the NDF was **14 h/d** — [Al-Washali et al., Water 11(1):48 (2019)](https://www.mdpi.com/2073-4441/11/1/48)
- N1 guidance (IWA WLTF): about 1.5 for background leaks and splits in flexible pipes, about 0.5 for detectable leaks from cracks or holes in rigid pipes, often about 1.0 for large mixed-material systems. N1 can be assessed by night pressure-step tests, or estimated empirically as **N1 = 1.5 − (1 − 0.65/ILI) × p/100**, where p is the % of rigid pipes (Thornton & Lambert 2005) — [Lambert & Fantozzi, Practical progress in modelling leakage and pressure 2005–2010 (LEAKSSuite)](https://www.leakssuitelibrary.com/wp-content/uploads/2021/05/LambertFantozziJun2010-updated15May2021.pdf)
- Field N1 values range from about 0.5 to 2.79, median 1.15 (Croatian review). In 107 South African PMZs N1 ranged from −0.34 to 2.20 — [WebSearch summaries of Dundović & Tadić (GFOS repository)](https://repozitorij.gfos.hr/islandora/object/gfos%3A2740/datastream/FILE0/view); [UCT thesis](https://open.uct.ac.za/bitstreams/52c274e5-4cc8-44c7-b304-335c4d891f70/download)
- Background leakage varies with pressure to about the 1.5 power. Burst leakage varies with power 0.5 to 1.5 or more depending on material and leak type. UARL itself assumes a linear relationship — [EFC Network ILI webinar (2019)](https://efcnetwork.org/wp-content/uploads/2018/12/ILI-Webinar-1-15-19-Final-Version.pdf)
- The HDF is applied to changes in pressure-dependent flow at the MNF hour to estimate daily savings, so exceptional users must be removed first — [WRC TT184/02](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf)

### Inferences
- How pressure moves over the day:
  - Gravity or direct-from-reservoir zone without a PRV: pressure is highest at night (low flow, low head loss) and lowest at the morning and evening peaks, so HDF < 24.
  - Fixed-outlet PRV: inlet pressure is flat, so HDF is close to 24 at the PRV. HDF drops below 24 further into the zone.
  - Flow-modulated PRV, which lowers pressure at night: HDF can exceed 24.
  - Pumped supply that pumps only by day: HDF can exceed 24.
- The worked HDF table in Q6 shows Kçiq-type numbers. A 5–15 m daytime pressure drop gives HDF ≈ 20–23.5 across N1 0.5–1.5.
- Empirical N1 for Kçiq at an estimated ILI ≈ 12: N1 = 1.5 − (1 − 0.054) × p/100. That gives N1 ≈ 1.5 if the network is all PE/PVC (p = 0), ≈ 1.03 at 50 % rigid (AC, steel, DI, cast iron) and ≈ 0.55 if all rigid. The pipe-material split from the design study should be used to choose N1.

### Gaps
- No primary access to Lambert (2001) or Morrison et al. (2007). The HDF ranges above are as cited in Amoatey et al.

---

## Q3. What are the MNF and real-loss benchmarks (UARL, ILI, l/conn/h, m³/km/h, BABE components), and how do they apply here?

### Takeaway
- Compute UARL (l/d) = (18·Lm + 0.8·Nc + 25·Lp)·P, then ILI = CARL/UARL, and classify with the World Bank Institute matrix for developing countries.
- BABE "unavoidable" background leakage at 50 m is 20 l/km mains/h + 1.25 l/connection/h.
- Bursts are leaks above about 0.25–0.5 m³/h. One service-pipe burst is about 1.6 m³/h and one mains burst about 12 m³/h at 50 m.
- Kçiq has only about 1,031 connections, below the 3,000-connection validity limit for the UARL formula, so its ILI is indicative only.

### Cited Findings
- UARL (litres/day) = (18 × Lm + 0.8 × Nc + 25 × Lp) × P, where:
  - Lm = mains length (km)
  - Nc = service connections, main to property line
  - Lp = total length (km) of underground private pipe from property line to meter
  - P = average pressure (m).
  
  Equivalent forms: UARL (m³/yr) = (6.57·Lm + 0.292·Nc + 9.132·Lp)·P — [LEAKSSuite: UARL and ILI](https://www.leakssuitelibrary.com/uarl-and-ili); [Lambert & McKenzie, IWA Cyprus 2002](http://www.studiomarcofantozzi.it/IWACyprusNov2002Lambert&McKenziepaper.pdf)
- Per-connection form: UARL (l/conn/d) = (18/DC + 0.8 + 25·Lp/Nc) × P, where DC = connections per km of mains — [Lambert & McKenzie 2002](http://www.studiomarcofantozzi.it/IWACyprusNov2002Lambert&McKenziepaper.pdf)
- Validity limits:
  - GIZ: Nc > 3,000, average pressure > 25 m, no limit on connection density — [GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)
  - Liemberger & McKenzie: originally ≥5,000 connections, ≥20 conn/km and ≥25 m, later lowered to 3,000 connections with the density limit removed — [Liemberger & McKenzie, Leakage 2005](https://rash.apanela.com/tf/leakage/Accuracy%20Limitations%20of%20the%20ILI%20-%20Is%20it%20an%20Appropriate%20Indicator%20for%20Developing%20Countries.pdf)
- ILI = CARL / UARL (dimensionless) — [GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)
- WBI / Liemberger (2005) physical loss matrix, developing countries, in l/conn/d when pressurised, at average pressure 10 / 20 / 30 / 40 / 50 m:

  | Category | ILI | 10 m | 20 m | 30 m | 40 m | 50 m |
  |---|---|---|---|---|---|---|
  | A | 1–4 | <50 | <100 | <150 | <200 | <250 |
  | B | 4–8 | 50–100 | 100–200 | 150–300 | 200–400 | 250–500 |
  | C | 8–16 | 100–200 | 200–400 | 300–600 | 400–800 | 500–1000 |
  | D | >16 | >200 | >400 | >600 | >800 | >1000 |

  Developed-country bands are half these widths (A ILI 1–2, … D > 8). Category D is described as "highly inefficient; leakage reduction programs imperative" — [World Bank, Kingdom, Liemberger & Marin (2006), The Challenge of Reducing NRW](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf); [Liemberger & McKenzie 2005](https://rash.apanela.com/tf/leakage/Accuracy%20Limitations%20of%20the%20ILI%20-%20Is%20it%20an%20Appropriate%20Indicator%20for%20Developing%20Countries.pdf); [SS-Pub AEER 2018](http://www.ss-pub.org/wp-content/uploads/2018/05/AEER2018021702.pdf)
- For intermittent supply, normalise to continuous supply: 200 l/conn/d at 12 h/d supply should be treated as 400 l/conn/d — [World Bank 2006](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf)
- IWA (2006) recommendation: use l/connection/day, but use m³/km mains/day where connection density is very low (the guidance note mentions a threshold of 20 per km mains) — [WLR&A Guidance Notes on Apparent Losses and Water Loss Reduction Planning (2016)](https://www.pseau.org/outils/ouvrages/wlranda_free_guidance_notes_on_apparent_losses_water_loss_reduction_planning_2016.pdf)
- Small-system caveat: on small networks the UARL denominator is unreliable and ILI swings widely, so also report l/conn/d — [Divako explainer (secondary)](https://www.divako.io/resources/infrastructure-leakage-index-explained)
- BABE defaults used in the SA WRC software (at 50 m):
  - unavoidable connection losses 1.25 l/conn/h
  - unavoidable mains losses 20 l/km/h
  - mains burst 12.0 m³/h
  - connection-pipe burst 1.6 m³/h
  - average run time 0.5 d for mains bursts and 10 d for connection bursts (SA defaults)
  
  — [McKenzie, Bhagwan & Lambert, WRC leakage software paper](http://www.geocities.ws/kikory2004/10_mckenzie.pdf)
- Burst vs background thresholds disagree between sources:
  - bursts > 250 l/h at 50 m (GIZ, [GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf))
  - > 0.25 m³/h ([WRC TT184/02](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf))
  - > 0.5 m³/h ([Al-Washali et al. 2019](https://www.mdpi.com/2073-4441/11/1/48))
  - leaks below about 400–500 l/h are typically not detectable acoustically ([Preston, International application of BABE](http://www.geocities.ws/kikory2004/27_Preston_BABE.pdf))
- BABE background leakage = mains + connection + property components, scaled in practice by an Infrastructure Condition Factor (ICF). In Zarqa, raising ICF to 5 still left more than 60 % of leakage unexplained ("hidden") — [WRC TT184/02](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf); [Al-Washali et al. 2019](https://www.mdpi.com/2073-4441/11/1/48)
- MNF/average-inflow ratio as a quick indicator: McKenzie quotes an intermittent-supply case with "astronomical" leakage where the MNF ratio was about 0.83 — [McKenzie video (approx. 41:50)](https://www.youtube.com/watch?v=MlCbiaI8GBc)
- Example benchmark from a real DMA programme (Lemesos/Limassol, Cyprus): leakage fell from 138 to 92 l/conn/d and ILI from 2.66 to 1.96 (2002–2007) through MNF-driven ALC and pressure management — [Charalambous, Effect of intermittent supply (LEAKSSuite)](https://www.leakssuitelibrary.com/wp-content/uploads/2019/08/Bambos-EU-Ref-Doc-Case-Study-update.pdf). Chania (Crete) night-flow analysis gave 549–662 l/conn/d — [Preston BABE paper](http://www.geocities.ws/kikory2004/27_Preston_BABE.pdf)

### Inferences
- **Converting the WBI daily bands to a night-leakage screen (derived, not a published standard).** Night leakage rate ≈ daily leakage / HDF (≈ 22).
  - At about 40–50 m in a developing country, Category A (< 200–250 l/conn/d) corresponds to roughly < 9–11 l/conn/h at night.
  - Category D (> 800–1,000 l/conn/d) corresponds to > 36–45 l/conn/h.
  - Unavoidable night leakage at 45 m for a Kçiq-type density (≈ 18 conn/km) is about 3–3.5 l/conn/h, or about 0.06 m³/km/h.
  - Rule of thumb: an MNF minus night use above about 10 l/conn/h, or above about 0.2 m³/km/h in a rural low-density zone, indicates substantial recoverable leakage. Above about 35–45 l/conn/h means a bad network or a large burst population.
- Because Kçiq has fewer than 20 conn/km (1,031/56 ≈ 18.4), report m³/km/d alongside l/conn/d. Its ILI is indicative only (Nc < 3,000).

### Gaps
- No published rural-specific MNF benchmark in l/conn/h or m³/km/h was found. The screening thresholds above are derived from WBI bands and the UARL. The UK BABE "property" background component (customer-side pipe, l/property/h) was not confirmed from a primary source.

---

## Q4. How do roof tanks and household storage (common in Kosovo and the Balkans), intermittent supply and summer irrigation distort MNF?

### Takeaway
Customer tanks (roof or ground) refill at night when pressure is highest, so they add a legitimate but non-standard night inflow that raises MNF. One model shows MNF up by as much as 400 % if all consumers have tanks. With intermittent supply, MNF analysis is only valid once the zone is "saturated" (all tanks full), which in Zarqa took 63 h of continuous supply. Leaking float valves and overflowing tanks add continuous customer-side flow, and customer meters under-register it.

### Cited Findings
- Building storage tanks change diurnal flow. If all consumers have tanks, the maximum demand coefficient can drop by up to 28 % while minimum night flow rises by up to 400 %. Night MNF rose about 74–400 % depending on pressure as tanks fill at night — [Applied Water Science (2025), "The effect of building storage tanks on diurnal flow variation"](https://link.springer.com/article/10.1007/s13201-025-02490-6)
- Intermittent supply (Zarqa): "One-day MNF analysis cannot be used … because water keeps flowing during night time to fill customers' tanks". The DMA must be supplied continuously until saturated and readings repeat. Saturation began after 63 h. MNF can occur at night or by day depending on tank levels. Legitimate night consumption becomes the most sensitive parameter — [Al-Washali et al., Water 11(1):48 (2019)](https://www.mdpi.com/2073-4441/11/1/48)
- McKenzie: when a zone reopens after intermittent supply there is a refilling spike, which can damage mechanical meters. In one case the client kept water on for 48 h to obtain a valid MNF — [McKenzie video (approx. 41:00)](https://www.youtube.com/watch?v=MlCbiaI8GBc)
- Continuous low flows (e.g. dribbling float valves) are the largest source of unmeasured or under-registered customer flow — [UKWIR 12/WM/08/48](https://ukwir.org/eng/topic-catalogue?object=41cad5e3-48c0-4f66-8546-ff1bdc6f9dfe)
- Leaks inside buildings with roof tanks can be quantified by a tank-based test (about ±30 %, down to 1 l/h with small tanks and 20 l/h with large tanks) — [Urban Water Journal, "Determination of leakage inside buildings with a roof tank"](https://www.tandfonline.com/doi/abs/10.1080/1573062X.2012.660959)
- Irregular night use such as irrigation and in-house leaks is not captured by the standard allowance — [WebSearch summary of MDPI Water 13(5):643](https://0-www-mdpi-com.brum.beds.ac.uk/2073-4441/13/5/643)

### Inferences
- **Signature in the curve:**
  - Tank refill shows as a high flow just after midnight that decays to a plateau by about 03:00–04:00. With intermittent supply it shows as a large ramp after supply restarts.
  - Leakage shows as a flat plateau that rises slightly through the night as pressure increases.
  - Use the minimum rolling hour from about 02:00 to 04:00, or later if the decay has not ended. The curve should flatten for at least 1 h before you read MNF.
- **Tests to separate tank refill from leakage:**
  - Log a sample of customer meters at the same 15-min interval.
  - Close a block of customer stopcocks or meter valves in one street during a night test and watch the DMA inflow drop.
  - Repeat the measurement on 7–14 consecutive nights. Tank refill varies with daytime use, while leakage is stable night to night.
- **Summer irrigation (Kçiq context).** Kçiq losses fell from 76 % to 61 % in July–August while billing rose. This is what a percentage indicator does when consumption rises against a roughly constant absolute leakage, and it does not by itself show that leakage fell. Before reading anything into it, check monthly SIV in m³/d and leakage in l/conn/d and m³/km/d.
- Garden and orchard watering, and livestock troughs filling at night, raise MNF in rural summers. Do the baseline MNF campaign outside July–August, or log customers to quantify night irrigation.
- The 250 accounts billed 0 m³ need checking in the field (vacant, stopped meters or bypasses). Stopped meters at occupied houses mean real night use that is not billed, which is apparent loss rather than leakage.

### Gaps
- No Kosovo-specific survey of roof- or ground-tank prevalence was found. KRU field staff should estimate the share of houses with tanks, pumps or booster sets in Kçiq.

---

## Q5. MNF method, step by step (IWA / UK "Managing Leakage" / BABE), and how to build and read the 24 h curve

### Takeaway
Measure DMA net inflow and pressure (inlet, average zone point AZP, critical point) at 15-min resolution for at least 7–14 days. Take the minimum rolling hour between about 02:00 and 04:00 and subtract legitimate night use to get night leakage. Split it into background (BABE) and bursts. Multiply by HDF to get daily leakage. Reconcile with the top-down water balance and compute ILI.

### Cited Findings
- MNF usually occurs between 02:00 and 04:00 in urban areas. It should be the one-hour minimum of all recorded inflows and outflows of the DMA. At that time leakage is the largest share of net inflow — [GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)
- The MNF method suits continuously operated systems only — [GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)
- BABE splits leakage into reported bursts (high flow, short run time), unreported bursts (run time depends on ALC policy) and background leakage (small, inaudible, continuous). Net Night Flow = MNF − assessed legitimate consumption per connection − known significant night users — [Lambert & Fantozzi (LEAKSSuite)](https://www.leakssuitelibrary.com/wp-content/uploads/2021/05/LambertFantozziJun2010-updated15May2021.pdf); [Preston BABE paper](http://www.geocities.ws/kikory2004/27_Preston_BABE.pdf)
- Average Zone Point (AZP): derived from the average ground elevation of properties (or hydrants) in the zone, then a property or hydrant at that elevation is chosen. AZP pressure is used in BABE and HDF calculations — [WRC TT184/02](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf)
- UK reporting: rolling 7-day 20th percentile of the minimum rolling hour each night, from 15-minute flow sampling — [UKWIR 99/WM/08/21](https://ukwir.org/eng/topic-catalogue?object=41cad5e3-48c0-4f66-8546-ff1bdc6f9dfe)
- Ofwat (2026) is consulting on moving from an MNF focus to a 24-hour mass-balance approach as smart-meter data grows — [Water Magazine, Sept 2026](https://www.watermagazine.co.uk/2026/09/01/ofwat-seeks-views-on-major-changes-to-leakage-reporting-as-smart-meter-data-grows/)

### Formulas (as used in this note)

1. Net Night Flow (leakage at MNF hour): **L_MNF = MNF − Q_LNU**, where Q_LNU = Q_dom + Q_nondom + Q_exceptional.
   - Q_dom = Pop × ANP × V_flush (default 6 %, 10 l/flush per hour), or N_prop × q_prop.
2. **HDF = Σ_{i=1..24} (P_i,AZP / P_AZP,MNF)^N1** (h/d).
3. **Daily real losses (bottom-up): RL_d = L_MNF × HDF.**
4. **Background leakage (BABE) at AZP pressure P:** B_MNF = ICF × (20 l/km/h × Lm + 1.25 l/conn/h × Nc) × (P_MNF/50)^1.5.
5. **Burst leakage at night:** Bu_MNF = L_MNF − B_MNF. Equivalent service-pipe bursts ESPB = Bu_MNF / (1.6 m³/h × (P/50)^N1).
6. **Top-down check:** RL_d = SIV − billed − unbilled authorised − apparent losses.
7. **UARL** (l/d) = (18·Lm + 0.8·Nc + 25·Lp)·P_avg. **ILI = RL_d / UARL_d.**
8. **N1 from a night step test:** N1 = ln(L1/L0) / ln(P1/P0), with L the night leakage after removing Q_LNU. **Empirical:** N1 = 1.5 − (1 − 0.65/ILI) × p/100.

### Inferences (procedure)
1. **Zone integrity:** confirm boundary valves are closed (zero-pressure test or boundary-valve audit), so DMA input equals net inflow. Subtract any exports.
2. **Instrumentation:** check the inlet meter (accuracy at night low flows; size the meter so that about 12 l/s sits in its accurate range). Fit pressure loggers at the inlet, AZP and critical point.
3. **Log** for 7–14 continuous days (Q7). Plot 15-min flow and pressure together. Mark the daily MNF hour and look at the flat part of the curve.
4. **Read the 24 h curve:**
   - The minimum night "floor" is leakage plus night use.
   - The area above the floor is mostly consumption.
   - A high floor relative to the average (MNF/average > about 0.5) means leakage dominates.
   - A floor that steps up overnight is a new burst.
   - A slowly decaying floor is tank refill.
   - A floor that tracks pressure is pressure-sensitive leakage.
5. **Subtract legitimate night use** (Q1): domestic default plus measured exceptional users. Log any large users.
6. **Compute HDF** from measured AZP pressures, with N1 chosen from pipe materials or a night step test.
7. **Split** into BABE background and bursts. Convert bursts to ESPB to size the ALC campaign.
8. **Reconcile** bottom-up RL_d with the top-down water balance over the same period. Differences point to apparent losses, meter error or wrong allowances.
9. **Track** daily MNF afterwards. Set an intervention trigger, e.g. MNF rising above the post-repair baseline by an amount equal to 1–2 ESPB.

### Gaps
- The UK "Managing Leakage" Reports E (Interpreting measured night flows) and F (Using night flow data) could not be accessed directly. Details of their step lists come here via BABE and WRC derivatives.

---

## Q6. Worked ESTIMATE for DMA Kçiq (from the Feb–Sep 2026 totals; no logger data)

> **ESTIMATE — not a measurement.** It is built from the totals given by KRU, the design hourly profile, and the standard defaults above. The assumed pressure model is explained below. A real MNF logging campaign is needed to confirm it.

### Takeaway
The water balance (1,599 m³/d in, 481 m³/d billed) implies real losses of roughly 900–1,120 m³/d, or about 10.4–12.9 l/s on average. So the 24 h inflow should be a high, nearly flat leakage base of about 11–13 l/s with a consumption hump on top. Expected MNF (01–04 h) is **≈ 12–14.5 l/s (≈ 44–52 m³/h)**, about 70–80 % of average inflow. That is ≈ 45 l/conn/h, ≈ 0.85 m³/km/h, ILI ≈ 11–14 and WBI developing-country Category C bordering D. A measured MNF in this range confirms that losses are physical leakage. A much lower MNF points to meter or apparent-loss problems instead.

### Cited Findings (inputs and defaults used)
- Defaults used:
  - ANP 6 % × 10 l/flush ([Amoatey et al.](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content))
  - HDF formula and typical 18–24 ([Amoatey et al.](https://ugspace.ug.edu.gh/server/api/core/bitstreams/eb150727-7fdd-4c7e-857d-66ae431b6c7b/content); [WRC TT184/02](https://www.wrc.org.za/wp-content/uploads/mdocs/TT184-02.pdf))
  - N1 0.5/1.0/1.5 ([Lambert & Fantozzi](https://www.leakssuitelibrary.com/wp-content/uploads/2021/05/LambertFantozziJun2010-updated15May2021.pdf))
  - UARL coefficients ([LEAKSSuite](https://www.leakssuitelibrary.com/uarl-and-ili))
  - BABE 20 l/km/h, 1.25 l/conn/h, 1.6 and 12 m³/h bursts at 50 m ([McKenzie et al. WRC paper](http://www.geocities.ws/kikory2004/10_mckenzie.pdf))
  - WBI matrix ([World Bank 2006](https://documents1.worldbank.org/curated/en/385761468330326484/pdf/394050Reducing1e0water0WSS81PUBLIC1.pdf))
- Kçiq inputs (from KRU, not externally sourced): SIV 386,956 m³ / 242 d = 1,599 m³/d = 66.6 m³/h = 18.5 l/s. Billed 116,345 m³ = 481 m³/d. NRW ≈ 1,118 m³/d (69.9 %). Accounts ≈ 1,031 (775 active, 250 billed 0 m³). Population 4,276. Mains ≈ 56 km. AZP ≈ 4–5 bar (≈ 45 m), with sub-zones at 10–12.6 bar.
- Design profile check: Σ hourly l/s = 166.2, giving a mean of 6.93 l/s = 598 m³/d (matches 599). Its 02–03 h minimum is 2.3 l/s = 33 % of mean. That is far above standard domestic night use (≈ 0.4–0.7 l/s for 4,276 people), so the design curve probably carries a night allowance or tank refill. In the estimate below I replaced the design night (01–04 h) with 0.70 l/s of legitimate night use and rescaled the other hours to keep the daily total.

### Inferences (calculation)

**Step 1 – Water balance scenarios (consumption C includes billed, unbilled authorised and apparent losses):**

| Scenario | Consumption C (m³/d) | Real losses RL (m³/d) | RL avg (l/s) |
|---|---|---|---|
| S1 "billed = all use" | 481 | 1,118 | 12.9 |
| S2 central (C = design demand 599, i.e. billed + ~25 % apparent/unbilled) | 599 | 1,000 | 11.6 |
| S3 high apparent losses | 700 | 899 | 10.4 |

**Step 2 – Assumed pressure model (ASSUMPTION).** AZP = 50 m − 10 m × (Q_t/Q_peak)², a gravity-type head loss that gives about 46 m at night and 40 m at the peak. Leakage in hour i is L_MNF × (P_i/P_MNF)^N1. Solved iteratively in a scratch Python script.

**Step 3 – HDF sensitivity (S2):**

| Daytime AZP drop | N1 = 0.5 | N1 = 1.0 | N1 = 1.5 |
|---|---|---|---|
| 0 m (PRV-flat) | HDF 24.0, MNF 12.3 l/s | 24.0, 12.3 | 24.0, 12.3 |
| 5 m | 23.5, 12.5 | 23.0, 12.8 | 22.6, 13.0 |
| 10 m | 23.0, 12.8 | 22.1, 13.3 | 21.3, 13.7 |
| 15 m | 22.4, 13.1 | 21.2, 13.8 | 20.2, 14.4 |

**Step 4 – Expected 24 h inflow curve, S2 central (N1 = 1.0, 10 m drop, HDF 22.1), in l/s:**

| Hour | Consumption | Leakage | Total inflow | AZP (m) |
|---|---|---|---|---|
| 00 | 3.1 | 12.2 | 15.4 | 45.0 |
| 01–04 | 0.7 | 12.6 | **13.3 (MNF)** | 46.3 |
| 05 | 4.1 | 12.1 | 16.2 | 44.5 |
| 06 | 7.5 | 11.5 | 19.0 | 42.4 |
| 07 | 10.7 | 10.9 | 21.6 | 40.2 |
| 08 | 11.0 | 10.9 | **21.8 (peak)** | 40.0 |
| 09 | 9.9 | 11.1 | 21.0 | 40.8 |
| 10 | 9.0 | 11.2 | 20.2 | 41.4 |
| 11 | 8.6 | 11.3 | 19.9 | 41.7 |
| 12 | 9.0 | 11.2 | 20.2 | 41.4 |
| 13 | 8.6 | 11.3 | 19.9 | 41.7 |
| 14 | 7.5 | 11.5 | 19.0 | 42.4 |
| 15 | 7.2 | 11.6 | 18.8 | 42.6 |
| 16 | 7.5 | 11.5 | 19.0 | 42.4 |
| 17 | 8.6 | 11.3 | 19.9 | 41.7 |
| 18 | 9.9 | 11.1 | 21.0 | 40.8 |
| 19 | 11.0 | 10.9 | 21.8 | 40.0 |
| 20 | 10.7 | 10.9 | 21.6 | 40.2 |
| 21 | 9.0 | 11.2 | 20.2 | 41.4 |
| 22 | 6.5 | 11.7 | 18.2 | 43.1 |
| 23 | 4.3 | 12.1 | 16.3 | 44.4 |

Check: mean 18.5 l/s, Σ = 1,599 m³/d. Peak/MNF ratio is only about 1.6, compared with about 4.6 for the design demand curve alone: a "flat" inflow curve is the signature of a leakage-dominated DMA.

Other scenarios (N1 = 1.0, 10 m drop):
- S1: HDF 22.4, L_MNF 13.9 l/s, **MNF 14.6 l/s**, peak 21.1 l/s.
- S3: HDF 21.9, L_MNF 11.4 l/s, **MNF 12.1 l/s**, peak 22.5 l/s.

**Step 5 – Expected MNF and indicators (S2 central; range S3–S1):**
- MNF ≈ 13.3 l/s = 47.8 m³/h (range 12.1–14.6 l/s, 43.6–52.5 m³/h). MNF/average inflow ≈ 0.72 (0.65–0.79).
- Night leakage L_MNF ≈ 12.6 l/s = 45.3 m³/h, which is **≈ 44 l/conn/h** (1,031 conn) and **≈ 0.81 m³/km/h**.
- Daily leakage = L_MNF × HDF = 45.3 × 22.1 ≈ **1,000 m³/d** (S1 1,118; S3 899). That is ≈ 970 l/conn/d (870–1,085) and ≈ 17.9 m³/km/d (16.0–20.0).
- **UARL at P = 45 m:**
  - With Lp = 0 (meters at property line): (18×56 + 0.8×1,031 + 25×0) × 45 = (1,008 + 825) × 45 = 82,480 l/d ≈ **82.5 m³/d**.
  - With 10 m of private pipe per connection (Lp = 10.3 km): (1,008 + 825 + 258) × 45 ≈ 94.1 m³/d.
- **ILI ≈ 1,000 / 82.5 ≈ 12.1** (range 9.6–13.6 across scenarios and Lp). This is WBI developing-country **Category C (8–16)**, close to the C/D boundary on the l/conn/d scale (at about 45 m, C ≈ 450–900 and D > 900 l/conn/d by interpolation).
  - Caveat: Nc ≈ 1,031 < 3,000, so ILI is indicative only.
  - Caveat: if the high-pressure sub-zones (100–128 m) carry many connections, the true average pressure is higher, UARL rises and ILI falls. Leakage in those sub-zones is then (120/45)^N1 = 2.7× (N1 = 1) to 4.4× (N1 = 1.5) higher per leak, which makes them the first candidates for PRVs.
- **BABE split at night (AZP ≈ 46 m):**
  - Unavoidable background = (20×56 + 1.25×1,031) l/h × (46.3/50)^1.5 ≈ 2,409 × 0.89 ≈ 2.15 m³/h ≈ 0.6 l/s.
  - With an ICF of 2–3 (assumed average-condition network): background ≈ 4.3–6.4 m³/h.
  - Remaining ≈ 39–43 m³/h is bursts or unreported leaks: ≈ **25–28 ESPB** (1.6 m³/h each at 50 m), or ≈ 3.3–3.6 equivalent mains bursts (12 m³/h).
  - Most of the loss should therefore be detectable and repairable by ALC and step testing. Background-only leakage cannot explain it.
- **Empirical N1** (ILI ≈ 12): 1.5 if all PE/PVC, ≈ 1.0 at 50 % rigid pipe.

**Step 6 – What a measured MNF would confirm:**
- **MNF ≈ 12–15 l/s with a flat plateau:** confirms that most NRW (≈ 900–1,100 m³/d) is physical leakage. Priorities are ALC, step testing, repairs and pressure management in the 10–12.6 bar sub-zones. Expected recoverable leakage is several hundred m³/d.
- **MNF ≈ 5–9 l/s:** daily physical leakage is only about 400–750 m³/d. The rest of NRW is apparent loss (stopped or under-registering meters among the 250 zero-billed accounts, illegal connections, unbilled use) or the inlet meter over-registers. Verify the inlet meter and run a meter and customer audit.
- **MNF > 15 l/s or > 0.8 × average inflow:** night-filling tanks or irrigation are inflating MNF, or night pressure is much higher than assumed (HDF > 24 if pressure is managed at night). It may also be an unrecorded export or open boundary valve. Check zone integrity and log pressure.
- **Night-to-night jumps of ≥ 0.4–0.5 l/s (≈ 1.5–1.6 m³/h):** individual service-pipe bursts appearing. Use them as alarm triggers.

### Gaps
- No pressure logs, so HDF and N1 are assumptions. Pipe-material shares, real Lp and the connection count within the hydraulic boundary are not confirmed. There are no monthly SIV values for Jul–Aug. Whether supply is continuous 24/7 in all parts of Kçiq is not stated, and the estimate assumes continuous supply.

---

## Q7. What logging interval and duration are needed, and what are the common pitfalls?

### Takeaway
Log DMA inflow at 15-min intervals or finer, synchronised with pressure (inlet, AZP, critical point), for at least 7 consecutive days and preferably 14, outside the irrigation season. Use the minimum rolling hour, smoothed by a rolling 7-day 20th percentile. With intermittent supply, first keep the zone continuously supplied until tanks are saturated (≥ 48–72 h).

### Cited Findings
- UKWIR: leakage estimates based on 15-minute flow sampling. Reported leakage should use a rolling 7-day 20th percentile of the minimum rolling hour each night — [UKWIR 99/WM/08/21](https://ukwir.org/eng/topic-catalogue?object=41cad5e3-48c0-4f66-8546-ff1bdc6f9dfe)
- Ofwat requires a fixed MNF period, with night-use allowances aligned to the same hour. Non-household sample logging runs for at least 2 weeks — [Ofwat PR24 definition](https://www.ofwat.gov.uk/wp-content/uploads/2025/03/Leakage-FD-PC-definition-1.pdf). One UK company moved its MNF window to 02–03 h based on metering data — [Veolia WRMP24 Annex 5](https://www.veolia.co.uk/sites/g/files/dvc1681/files/document/2022/12/06.VWPL%20Draft%20WRMP24%20Annex%205.Leakage.pdf)
- GIZ Figure 6.3 illustrates a 7-day record of flow and pressure with MNF, burst and background components — [GIZ/VAG 2011](https://www.icafrica.org/fileadmin/documents/Knowledge/GIZ/Guidelines-water-loss-reduction.pdf)
- Intermittent supply: continuous supply until saturation (63 h in Zarqa) before MNF is valid — [Al-Washali et al. 2019](https://www.mdpi.com/2073-4441/11/1/48); 48 h used by McKenzie — [McKenzie video](https://www.youtube.com/watch?v=MlCbiaI8GBc)
- In the Lemesos DMAs, each district meter has a solar-powered programmable logger with daily data transfer, and the DMAs are kept small so that a new leak is a visible share of MNF — [Charalambous (LEAKSSuite)](https://www.leakssuitelibrary.com/wp-content/uploads/2019/08/Bambos-EU-Ref-Doc-Case-Study-update.pdf)

### Inferences (pitfalls checklist for Kçiq)
1. **Telemetry offline:** use a battery data logger on the inlet meter pulse output, or a clamp-on ultrasonic meter, plus 2–3 pressure loggers. Fifteen-minute data is the minimum, and 1–5 min helps to see refill spikes and step tests.
2. **Inlet meter low-flow accuracy:** check the meter at about 12 l/s. An oversized meter can under-read at night.
3. **Open boundary valves or exports:** do a zero-pressure test and a valve audit. An unmetered cross-connection makes MNF meaningless.
4. **Roof and ground tanks:** read MNF only after the decay has ended (rolling hour). Compare several nights. Sample customer meters at night.
5. **Intermittent or rationed supply:** ensure 24/7 supply for ≥ 48–72 h before and during logging.
6. **Summer irrigation and livestock:** avoid July–August for the baseline, or quantify it. Losses as a % fell from 76 % to 61 % in Jul–Aug as billing rose, so use m³/d, l/conn/d and m³/km/d rather than %.
7. **Exceptional night users:** list and log them (bakeries, schools, mosques, farms, any small industry).
8. **Pressure not logged:** without AZP pressure there is no HDF or N1 and no pressure-management case. Log pressure in the 10–12.6 bar sub-zones separately.
9. **Single-night reading:** never use one night. Use ≥ 7 nights and a 20th-percentile filter.
10. **Daylight saving and clock drift:** synchronise logger clocks to align flow and pressure.
11. **After the baseline:** run a night step test (sequential valve closures, about 02:00–04:00) to localise burst-heavy sections, and a night pressure step test at the inlet to measure N1.

### Gaps
- No standard specifically prescribing "14 days" was found. The 7-day rolling basis is UKWIR's, and 14 days is a practical recommendation (covers two weekends and night-to-night variability).
