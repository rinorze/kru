# Thematic mapping best practice for the DMA Kçiq water-loss / pressure-zone maps (Leaflet, Google Earth Pro KML, slide)

Scope: (a) zone choropleth of pressure or leakage risk for Z1–Z19, (b) classed point map of static pressure for 1,040 consumer points, (c) network map with pipe diameter (DN32–DN200) by line weight, plus legends, colours, map furniture, and the KML / QGIS / Leaflet implementation. Project facts used below (pressure range 3.05–12.63 bar, ARRU Rule 02/2016 s.17 = 1.5–7 bar at the connection, "492 buildings above 7 bar") come from the project's own `Kciq_Research_Report.md` and `app/backend/sim.py`; I could not find the ARRU rule text online in this session (see Gaps).

## Which classification is best for pressure (bar) when regulatory thresholds exist?

### Takeaway
Use manual (fixed, meaningful) breaks anchored on the regulatory and operational thresholds (1.5 / 3 / 5 / 7 bar, then 9 and 11 bar to split the over-limit tail), not quantile, equal-interval or Jenks. Fixed breaks keep the same classes on the zone map, the point map, the KML and the slide, and let the jury read "red = above the ARRU 7 bar limit" without decoding numbers.

### Cited Findings
- Recommended range is "3–7 data classes"; more classes keep detail but are harder to read and print. Look at the histogram for clusters or gaps before choosing. — [Axis Maps, Data classification](https://www.axismaps.com/guide/data-classification)
- Equal interval suits evenly spread data; skewed data or outliers can leave empty classes. — [Axis Maps](https://www.axismaps.com/guide/data-classification)
- Quantiles put an equal number of observations in each class and make attractive maps, but class ranges vary widely and similar values can be split while dissimilar ones are grouped. — [Axis Maps](https://www.axismaps.com/guide/data-classification)
- Natural breaks minimise within-class variance, but each dataset gets a unique solution, so maps in a series are hard to compare. — [Axis Maps](https://www.axismaps.com/guide/data-classification)
- Manual breaks are the choice when you need fixed breakpoints or the same classes across a map series. — [Axis Maps](https://www.axismaps.com/guide/data-classification)
- QGIS Graduated renderer offers Equal Count (Quantile), Equal Interval, Fixed Interval, Logarithmic, Natural Breaks (Jenks), Pretty Breaks, Standard Deviation; classes and labels can be edited by double-click and breaks moved on an interactive histogram ("Class breaks can be moved or added using the histogram widget"). — [QGIS User Manual, Vector properties](https://docs.qgis.org/latest/en/docs/user_manual/working_with_vector/vector_properties.html)
- QGIS Rule-based renderer uses expressions as rules and supports an ELSE rule for unmatched features (useful for a "no data" class). — [QGIS User Manual](https://docs.qgis.org/latest/en/docs/user_manual/working_with_vector/vector_properties.html)
- Leakage flow follows a power law Q = C·h^N1; N1 = 0.5 for rigid leaks (cast iron, steel) and 1.5 for fully flexible leaks (thin plastic), with most real leaks in between. — [Autodesk InfoWorks WS Pro, Leakage modelling](https://help.autodesk.com/cloudhelp/ENU/INFWP-UserGuide/files/GUID-C33F20D8-17A4-4D10-9883-FF8D91DF9D04.htm)
- Field N1 values range from about 0.5 to above 2; longitudinal cracks in PVC gave 1.38–1.85, round holes in PVC about 0.52; a PVC field test gave N1 = 1.76. Extrapolating beyond the calibration pressure range can cause significant errors. — [MDPI Water 14(13):2067](https://www.mdpi.com/2073-4441/14/13/2067/html); [ASCE J. Hydraulic Eng.](https://ascelibrary.com/doi/10.1061/%28ASCE%29HY.1943-7900.0001346)

### Inferences
- **Recommended pressure classes for DMA Kçiq (points and zones, identical in every output):**

| Class | Range (bar) | Meaning | Hex (light basemap) | KML aabbggrr (80% alpha) |
|---|---|---|---|---|
| 0 | < 1.5 | Below ARRU minimum | hollow marker, black outline `#000000` | `ff000000` outline only |
| 1 | 1.5 – 5.0 | Compliant, target band | `#4575B4` | `ccb47545` |
| 2 | 5.0 – 7.0 | Compliant, high | `#91BFDB` | `ccdbbf91` |
| 3 | 7.0 – 9.0 | Above ARRU 7 bar | `#FDAE61` | `cc61aefd` |
| 4 | 9.0 – 11.0 | Well above limit | `#F03B20` | `cc203bf0` |
| 5 | ≥ 11.0 | Severe (max 12.63) | `#BD0026` | `cc2600bd` |
| – | No data | Missing elevation or pressure | `#BDBDBD` | `ccbdbdbd` |

  The swatches are verified ColorBrewer values (RdYlBu-6 blues `#4575B4`, `#91BFDB`; RdYlBu-5 `#FDAE61`; YlOrRd-5 `#F03B20`, `#BD0026`; source: [ColorBrewer JSON](https://raw.githubusercontent.com/axismaps/colorbrewer/master/export/colorbrewer.json)). Combining them into a "blue = compliant / orange-red = over limit" diverging ramp with the split exactly at 7 bar is my design choice. The pale yellow midpoints of RdYlBu (`#FFFFBF`, `#FEE090`) are deliberately dropped because they vanish on light basemaps and satellite imagery.
- Keep class 0 (< 1.5 bar) in the legend with its count "0" even though the DMA minimum is 3.05 bar: it shows the jury the full regulatory corridor and stays valid when field data arrive. If the slide needs fewer classes, merge classes 4 and 5 ("≥ 9 bar").
- Why not 3 bar as a break: with a minimum of 3.05 bar, a 1.5–3 class would be empty; 1.5–5 as one "target" class is cleaner. If KRU's operational target is 3–5 bar, label class 1 "1.5–5 (target 3–5)".
- Use Jenks or quantile only for exploratory views inside the panel (e.g. a "relative within DMA" toggle), never for the main map: quantile on a dataset where ~half the buildings are above 7 bar would put the 7 bar limit in the middle of a class.
- Pressure–leakage message for the legend subtitle: since Q ∝ P^N1 and N1 sits roughly between 0.5 and 1.5, a point at 10 bar leaks about 1.4× (N1 = 0.5) to 2.8× (N1 = 1.5) as much as at 5 bar through the same opening. This is arithmetic from the cited power law, not a measured Kçiq value.

### Gaps
- I could not retrieve the ARRU Rule 02/2016 text online (search found ARRU's mandate but no pressure clause); the 1.5–7 bar values are taken from the project's own research report. Verify against the official text at arru-rks.org before printing it on the slide.
- No source found for a Kosovo- or KRU-specific operational target band (e.g. 3–5 bar).

## What composite "leakage risk" index do utilities use per zone, and how to map it?

### Takeaway
There is no single standard index. Published practice combines normalised, weighted layers (pressure, pipe age/material, burst history, connection density, night-flow drift) or uses probability × consequence ranking. For Kçiq, with no pipe age or burst data, a defensible index is pressure-weighted (FAVAD-style) leakage exposure per zone, mapped as a 4–5 class sequential choropleth with fixed breaks on a 0–1 or 0–100 scale.

### Cited Findings
- A GIS-based method partitions a network into zones with similar traits (pipe age, soil type) and produces a predicted leakage index per area, using average or maximum age of pipes/fittings/valves, network complexity, pressure and past leak/burst rate; utilities use it to prioritise field work. — [US patent 9,053,519 (USPTO)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9053519)
- A University of Johannesburg study scores each node's burst risk from DMA burst pressure plus pipe length, age and thickness, then ranks DMAs by total burst risk. — [Identifying Risky Zones in WDNs Using Node Burst Indices](https://pure.uj.ac.za/en/publications/identifying-risky-zones-in-water-distribution-networks-using-node/)
- SWDE/INRAE's renewal decision tool uses pipe leakage probability from material, length and a night-flow drift index, and raises priority where the DMA risks water shortage. — [IWA PI2023, Renaud et al. (HAL)](https://hal.inrae.fr/hal-04314106/file/IWA_PI2023_Session5_EddyRenaud.pdf)
- An Exeter study links pipe attributes (length, diameter, age, material, connections) to minimum night flow and failures and derives a per-pipe leakage-contribution score. — [Exeter ORE](https://ore.exeter.ac.uk/rest/bitstreams/200330/retrieve)
- Leakage power law Q = C·h^N1 with N1 0.5 (rigid) to 1.5 (flexible); InfoWorks recommends FAVAD (fixed + variable area) over a fixed N1 for flexible pipes. — [Autodesk InfoWorks WS Pro](https://help.autodesk.com/cloudhelp/ENU/INFWP-UserGuide/files/GUID-C33F20D8-17A4-4D10-9883-FF8D91DF9D04.htm)
- The ratio form L1/L0 = (P1/P0)^N1 is the standard way to estimate leakage change after pressure control. — [MDPI Water 14(13):2067](https://www.mdpi.com/2073-4441/14/13/2067/html); [Water SA](https://watersa.net/article/download/7885/9777/42393)
- A search-result summary of a utility-practice glossary notes GIS risk mapping is more descriptive than predictive and weightings can be subjective. — [Rezatec pipeline risk glossary](https://rezatec.freshdesk.com/support/solutions/articles/29000041572-pipeline-risk-glossary) (vendor source; content not read in full)

### Inferences
- **Proposed Kçiq zone index (transparent, computable from data on hand):**
  1. Pressure exposure PE = mean over the zone's consumer points of (P / 3 bar)^N1, N1 = 1.0 as a mid-range assumption (label it "assumed"); sensitivity at 0.5 and 1.5.
  2. Connection density CD = connections per km of mains (from the ~3,000 pipe segments clipped to the zone).
  3. Over-limit share OL = % of points above 7 bar.
  4. Mitigation M = share of connections with a household PRV (reduces risk).
  5. Score = 0.45·norm(PE) + 0.25·norm(CD) + 0.20·norm(OL) − 0.10·norm(M), rescaled to 0–100. Weights are my proposal; state them on the slide and show a sensitivity toggle in the panel.
  6. When KRU supplies pipe age/material and repair history, add them as extra terms (e.g. 0.2 each) rather than changing the method.
- An alternative well-known expected-leakage figure is the IWA/Lambert UARL formula (18·Lm + 0.8·Nc + 25·Lp)·P litres/day, which already weights mains length, connections and pressure; usable as a per-zone "expected minimum leakage". I could not verify the coefficients from a primary source in this session (see Gaps).
- **Mapping the index:** 19 zones are too few for quantiles to be meaningful (quintiles = 3–4 zones each, arbitrary breaks). Use fixed breaks on the 0–100 score: 0–25 Low, 25–50 Moderate, 50–75 High, 75–100 Very high, with sequential OrRd-4/5 (`#FEF0D9`, `#FDCC8A`, `#FC8D59`, `#E34A33`, `#B30000` for 5 classes; [ColorBrewer](https://raw.githubusercontent.com/axismaps/colorbrewer/master/export/colorbrewer.json)). Label zones Z1–Z19 inside the polygons and print the score in the popup.
- Normalise by area or connections, never map raw totals (demand m³/day, connection counts) as a choropleth; raw totals belong on graduated symbols at zone centroids.
- Show the whole-DMA NRW of 69.93% as a text box, not as a zone colour: it is measured once for the DMA and cannot be allocated to zones without zone meters. Mapping it per zone would imply precision the data lack.
- Supply type (gravity vs reservoir) is categorical: show it as a hatch or outline style on top of the choropleth (e.g. dashed outline = pumped/reservoir), not as another colour ramp.

### Gaps
- No primary IWA source fetched for UARL coefficients or for a recommended default N1 (common practitioner value of ~1.0–1.15 for mixed networks is not sourced here).
- No published standard weight set for a zone leakage risk index; all sources treat weights as local judgement.
- Pipe age, material and burst history for Kçiq are not in the data set listed, so the index is pressure-dominated.

## Colour schemes, legends, map furniture and typical mistakes

### Takeaway
Use ColorBrewer sequential ramps for one-directional quantities (risk score, demand), a diverging ramp split at a meaningful value (7 bar) for pressure, avoid red-green, and flip the ramp direction on dark basemaps for points and lines. Every legend needs a title with unit, classes in value order with counts, a "no data" swatch and a source line.

### Cited Findings
- ColorBrewer groups schemes as sequential, diverging and qualitative and offers "colorblind safe", "print friendly" and "photocopy safe" filters. — [ColorBrewer 2.0](https://colorbrewer2.org/)
- Verified ColorBrewer hex values: RdYlBu-5 `#D7191C #FDAE61 #FFFFBF #ABD9E9 #2C7BB6`; RdYlBu-6 `#D73027 #FC8D59 #FEE090 #E0F3F8 #91BFDB #4575B4`; YlOrRd-5 `#FFFFB2 #FECC5C #FD8D3C #F03B20 #BD0026`; OrRd-5 `#FEF0D9 #FDCC8A #FC8D59 #E34A33 #B30000`; Blues-5 `#EFF3FF #BDD7E7 #6BAED6 #3182BD #08519C`; YlGnBu-5 `#FFFFCC #A1DAB4 #41B6C4 #2C7FB8 #253494`; RdYlGn-5 `#D7191C #FDAE61 #FFFFBF #A6D96A #1A9641`. — [ColorBrewer JSON (axismaps/colorbrewer)](https://raw.githubusercontent.com/axismaps/colorbrewer/master/export/colorbrewer.json)
- On a light basemap pick a ramp starting light; on a dark basemap start dark. Viewers read dark as "more" on light maps and the reverse on dark maps. Reversing ramps works well for graduated/proportional symbols; be careful with filled polygons. — [Esri, Smart choices for basemaps and color ramps](https://www.esri.com/arcgis-blog/products/arcgis-online/mapping/smart-choices-for-basemaps-and-color-ramps-when-mapping-demographic-data); [Esri, Dark basemaps](https://www.esri.com/arcgis-blog/products/arcgis-online/mapping/dark-basemaps); [Esri, Light and dark color schemes](https://www.esri.com/arcgis-blog/products/arcgis-online/mapping/light-and-dark-color-schemes)
- Esri Map Viewer offers above-and-below (diverging) ramps with a dark centre on Dark Gray Canvas. — [Esri blog](https://www.esri.com/arcgis-blog/products/arcgis-online/mapping/smart-choices-for-basemaps-and-color-ramps-when-mapping-demographic-data)
- Leaflet's choropleth tutorial uses an 8-class sequential ramp (`#FFEDA0` … `#800026`), white dashed boundaries (weight 2, dashArray 3), fillOpacity 0.7, and a bottom-right legend control built from a grades array. — [Leaflet choropleth tutorial](https://leafletjs.com/examples/choropleth/)

### Inferences
- **Colour-blind safety:** RdYlGn is a red-green scheme; do not use it for "good/bad" pressure. RdYlBu, OrRd, YlOrRd and Blues avoid red-green confusion. Check the exact class count with ColorBrewer's colorblind filter, since the safe flag depends on the number of classes (the JSON export does not carry this flag).
- **Dark basemap version** (panel dark theme, projector): keep the pressure hues (they are mid-to-dark and saturated) but lift class 1 to `#2C7BB6`→ brighter `#6BAED6` (Blues-5) for contrast, and add a 1 px white (`#FFFFFF`, 60% opacity) halo on points. For polygons on dark tiles, lower fillOpacity to 0.5–0.6 and use a light outline. For pipes use light grey-blue (`#BDD7E7`) on dark, dark navy (`#08519C`) on light.
- **Satellite imagery (Google Earth):** pale classes disappear; use fill opacity 60–70% (KML alpha `99`–`b3`) and a 2 px white outline on zones.
- **Projector / phone legibility:** ≤ 5 colour classes on the slide, legend text ≥ 18 pt on slides and ≥ 14 px on phone; point radius 5–6 px on desktop, 4 px on mobile at zoom 16+. Never rely on hue alone for the 7 bar limit: also print "ARRU limit 7 bar" as a legend divider line.
- **Legend rules (all three outputs):**
  1. Title with variable and unit: "Static pressure at connection (bar)".
  2. Classes ordered from low to high (top = high on a vertical legend is acceptable if consistent everywhere), non-overlapping labels ("5.0 – < 7.0").
  3. Count per class: "7.0 – 9.0 bar (n = …)" from the actual 1,040 points (counts not computed here; generate them in code from the same break array).
  4. A separate "No data" grey swatch and, for pressure, the empty "< 1.5 bar (below ARRU minimum), n = 0" class.
  5. Threshold annotation: a line or label between classes 2 and 3 "ARRU max 7 bar".
  6. Source line: "Model, KRU Mitrovica / EU-DEM / ARRU Rule 02/2016; date". Mark modelled values as modelled (the project already labels model vs real).
  7. For graduated symbols (demand at zone centroids), use nested circles with 3 reference sizes, not a classed ramp.
- **Map furniture:** a scale bar is worth keeping (field crews estimate distance); a north arrow is unnecessary on north-up web maps and Google Earth (which has its own compass) but useful on the static slide; an inset/locator showing Kçiq within Mitrovica helps the jury, not the crews. In Leaflet, `L.control.scale({metric: true, imperial: false})` provides the bar ([Leaflet reference](https://leafletjs.com/reference.html#control-scale)).
- **Typical mistakes to avoid:** rainbow/Spectral ramp for pressure; red-green; quantiles that hide the 7 bar limit; mapping raw counts on a choropleth; different breaks in panel vs KML vs slide; legends without units; too many classes (> 6) on a projector; pale yellow classes on satellite imagery; showing a single DMA NRW % as if it were zone-level; KML colours typed as RRGGBB (they come out with red and blue swapped).

### Gaps
- No primary source fetched on north arrow / inset rules (Axis Maps map-elements page returned 404); the furniture advice above is practitioner judgement.
- Per-class counts were not computed (data not opened in this research task).

## Network map with pipe diameter by line weight

### Takeaway
Map DN as 4 ordered line-weight classes in a single hue, draw large mains on top, and keep pressure or risk colour on the points/zones rather than on pipes to avoid two competing colour codes.

### Cited Findings
- KML LineStyle takes a `<width>` (e.g. 1.5) and a colour; Style elements are shared by `styleUrl` on the Placemark. — [Google KML tutorial](https://developers.google.com/kml/documentation/kml_tut)
- QGIS graduated renderer can vary symbols by colour or by size (size domain and unit). — [QGIS User Manual](https://docs.qgis.org/latest/en/docs/user_manual/working_with_vector/vector_properties.html)

### Inferences
- Recommended classes (screen px; use the same in Leaflet `weight` and KML `<width>`):

| Class | DN | Role | Width (px) | QGIS width (mm, print) |
|---|---|---|---|---|
| 1 | DN32–DN50 | Service / small distribution | 1.0 | 0.26 |
| 2 | DN63–DN90 | Distribution | 1.8 | 0.5 |
| 3 | DN100–DN125 | Secondary main | 2.8 | 0.8 |
| 4 | DN150–DN200 | Trunk main | 4.5 | 1.3 |

  Colour `#08519C` on light basemaps (KML `ff9c5108`), `#BDD7E7` on dark/satellite (KML `ffe7d7bd`). In QGIS use a Graduated renderer with Method = Size on the DN field and manual breaks 50 / 90 / 125, or Rule-based with an ELSE rule for "DN unknown" (dashed grey).
- Draw order: small pipes first, mains last (QGIS symbol levels; Leaflet add layers in order; in KML put mains in a later Folder).
- Valves, hydrants, sensors and meters: categorical, use small distinct shapes in one neutral dark colour with a 1 px white halo; group them in a "Assets" folder that is off by default.

### Gaps
- No source for standard line-weight conventions by DN; widths above are a design proposal.

## Exact KML syntax for colour-coded polygons/points, legend ScreenOverlay, folders and LOD

### Takeaway
KML colours are `aabbggrr` (alpha, blue, green, red), so `#D73027` at 80% opacity is `cc2730d7`. Define one shared Style per class, use StyleMap for hover, put the legend PNG in a ScreenOverlay pinned bottom-left, use ListStyle `radioFolder` to switch between "Pressure" and "Risk" views, and use Region/Lod to show the 1,040 points only when zoomed in.

### Cited Findings
- Colour order is aabbggrr, channels 00–ff; alpha 00 transparent, ff opaque. IconStyle children: `color` (default ffffffff), `colorMode` (normal|random), `scale`, `heading`, `Icon/href`, `hotSpot` (fraction|pixels|insetPixels, origin lower-left). — [Google KML Reference](https://developers.google.com/kml/documentation/kmlreference)
- Polygon example style: `<Style id="transBluePoly"><LineStyle><width>1.5</width></LineStyle><PolyStyle><color>7dff0000</color></PolyStyle></Style>`; `styleUrl` is a child of `Placemark`, not of the geometry. — [Google KML tutorial](https://developers.google.com/kml/documentation/kml_tut)
- StyleMap: `<StyleMap id="exampleStyleMap">` with Pairs `<key>normal</key><styleUrl>#normalPlacemark</styleUrl>` and `<key>highlight</key><styleUrl>#highlightPlacemark</styleUrl>`; Placemark references `#exampleStyleMap`. — [Google KML tutorial](https://developers.google.com/kml/documentation/kml_tut)
- ScreenOverlay: `overlayXY` is the point on the image, `screenXY` the point on the screen it is pinned to; origin (0,0) is lower-left for both; corners use matching values (0,1) upper-left, (1,1) upper-right, (1,0) lower-right, (0,0) lower-left; units fraction or pixels and can be mixed. Starter example: `overlayXY x="0" y="0"` fraction, `screenXY x="25" y="95"` pixels, `size x="0" y="0"` pixels. Use PNG or GIF for transparency (JPG has none). — [Google Earth Outreach, Screen overlays](https://www.google.com/earth/outreach/tutorials/screenoverlays.html); [Google KML tutorial](https://developers.google.com/kml/documentation/kml_tut)
- Resizing a legend with `<size>` can distort it; resize the image in an editor instead. — [KML touring, screen overlays](https://sites.google.com/site/kmltouring/code-examples/screen-overlays) (as summarised in search results)
- ListStyle `listItemType` values: `check` (default), `checkOffOnly`, `checkHideChildren` (children hidden from the list), `radioFolder` (only one child visible at a time). — [KML 2.2 listItemType schema (web3d.org)](https://www.web3d.org/specifications/kml2.2/documentation/kml22gx_listItemType.html); [ArcGIS Runtime KmlListItemType](https://developers.arcgis.com/net/api-reference/api/netwin/Esri.ArcGISRuntime/Esri.ArcGISRuntime.Ogc.KmlListItemType.html)
- Region = LatLonAltBox + Lod; `minLodPixels`/`maxLodPixels` in projected screen pixels, `maxLodPixels` −1 = active to infinite size; examples use minLodPixels 128; fade extents 128/512 prevent popping; Regions are inherited through the Folder hierarchy and local ones take precedence; `viewRefreshMode onRegion` for NetworkLinks loads data only when the Region is active. — [Google KML Regions](https://developers.google.com/kml/documentation/regions)

### Inferences
- Hex → KML conversion: take `#RRGGBB`, write `AA` + `BB` + `GG` + `RR`. At 80% alpha (`cc`): `#4575B4`→`ccb47545`, `#91BFDB`→`ccdbbf91`, `#FDAE61`→`cc61aefd`, `#F03B20`→`cc203bf0`, `#BD0026`→`cc2600bd`. For zone fills use 60% (`99`) and a white 2 px outline (`ffffffff`).
- Point icon tinting: use a white icon (e.g. Google's `http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png` or a white circle PNG you ship in a KMZ) so IconStyle colour reproduces the class colour; a coloured icon will be tinted and look wrong (behaviour of IconStyle colour as described in the KML reference; verify visually).
- 1,040 points and ~3,000 pipe segments are within what Google Earth Pro renders; Regions are optional. Use one Region per zone Folder with `minLodPixels` 256 so consumer points appear only when a zone fills a reasonable part of the screen, and keep zone polygons always visible (no Region).

Example skeleton (tested values from the sources; class names are Kçiq-specific):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>DMA Kçiq – pressure and leakage risk</name>

  <!-- Pressure point classes (aabbggrr) -->
  <Style id="p3"><IconStyle><color>cc61aefd</color><scale>0.6</scale>
    <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
  </IconStyle><LabelStyle><scale>0</scale></LabelStyle></Style>
  <Style id="p3_hi"><IconStyle><color>ff61aefd</color><scale>1.0</scale>
    <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
  </IconStyle><LabelStyle><scale>1</scale></LabelStyle></Style>
  <StyleMap id="p3_map">
    <Pair><key>normal</key><styleUrl>#p3</styleUrl></Pair>
    <Pair><key>highlight</key><styleUrl>#p3_hi</styleUrl></Pair>
  </StyleMap>

  <!-- Zone fill, risk class "High" (OrRd #E34A33 at 60%) -->
  <Style id="zHigh">
    <LineStyle><color>ffffffff</color><width>2</width></LineStyle>
    <PolyStyle><color>99334ae3</color><fill>1</fill><outline>1</outline></PolyStyle>
  </Style>

  <!-- Pipe class DN150–200 -->
  <Style id="dn4"><LineStyle><color>ff9c5108</color><width>4.5</width></LineStyle></Style>

  <!-- Only one thematic view visible at a time -->
  <Style id="radio"><ListStyle><listItemType>radioFolder</listItemType></ListStyle></Style>

  <ScreenOverlay>
    <name>Legend – pressure (bar)</name>
    <Icon><href>legend_pressure.png</href></Icon>
    <overlayXY x="0" y="0" xunits="fraction" yunits="fraction"/>
    <screenXY x="10" y="40" xunits="pixels" yunits="pixels"/>
    <size x="0" y="0" xunits="pixels" yunits="pixels"/>
  </ScreenOverlay>

  <Folder>
    <name>Thematic view</name>
    <styleUrl>#radio</styleUrl>
    <Folder><name>Pressure at connections</name>
      <Folder><name>Z1</name>
        <Region>
          <LatLonAltBox><north>..</north><south>..</south><east>..</east><west>..</west></LatLonAltBox>
          <Lod><minLodPixels>256</minLodPixels><maxLodPixels>-1</maxLodPixels></Lod>
        </Region>
        <Placemark><name>8.4 bar</name><styleUrl>#p3_map</styleUrl>
          <Point><coordinates>lon,lat,0</coordinates></Point></Placemark>
      </Folder>
    </Folder>
    <Folder><name>Leakage risk by zone</name>
      <Placemark><name>Z7 – High (score 63)</name><styleUrl>#zHigh</styleUrl>
        <Polygon><outerBoundaryIs><LinearRing><coordinates>…</coordinates></LinearRing></outerBoundaryIs></Polygon>
      </Placemark>
    </Folder>
  </Folder>
</Document>
</kml>
```

- Package as KMZ (zip with `doc.kml` + `legend_pressure.png` + icon) so the relative `href` resolves offline on a utility laptop. Make the legend PNG ~ 260–320 px wide with a semi-opaque white background so it reads over imagery; generate a second legend PNG for the risk view, and put each ScreenOverlay inside its own view Folder so the radio switch swaps the legend too.
- `screenXY y="40"` pixels (instead of 0) keeps the legend above Google Earth Pro's status bar; adjust after a visual check.

### Gaps
- The full KML reference text for `ScreenOverlay` `<size>` semantics (−1 native, 0 keep aspect ratio) was not retrieved in this session; the Outreach tutorial's `size 0 0` keeps the image at its native size in its example. Verify in Google Earth Pro.
- No official guidance found on a practical placemark count limit for Google Earth Pro.

## QGIS and Leaflet equivalents

### Takeaway
QGIS: Graduated renderer with manual breaks (or Rule-based for the "no data" and "< 1.5 bar" classes), legend built in the Print Layout from the same classes. Leaflet: one break array shared by `getColor`, the style function and the legend control, following the official choropleth tutorial pattern.

### Cited Findings
- QGIS Graduated: choose field or expression, symbol, legend format and precision, Method Color (ramp) or Size; Classify, then edit values/labels by double-click; histogram tab for moving breaks. — [QGIS User Manual](https://docs.qgis.org/latest/en/docs/user_manual/working_with_vector/vector_properties.html)
- QGIS data-defined size legend (separated or collapsed, manual size classes) works for point layers with single, categorised or graduated symbology. — [QGIS User Manual](https://docs.qgis.org/latest/en/docs/user_manual/working_with_vector/vector_properties.html)
- Leaflet tutorial pattern: `getColor(d)` with descending `d > x ? colour :` thresholds; `style(feature)` returns `fillColor`, `weight: 2`, `opacity: 1`, `color: 'white'`, `dashArray: '3'`, `fillOpacity: 0.7`; legend = `L.control({position: 'bottomright'})` whose `onAdd` loops a `grades` array writing `<i style="background:…"></i>` swatches; CSS `.legend i {width:18px;height:18px;float:left;margin-right:8px;opacity:0.7}` and `.info {padding:6px 8px; background: rgba(255,255,255,0.8); box-shadow…; border-radius:5px}`; hover highlight via `layer.setStyle({weight:5, color:'#666', dashArray:'', fillOpacity:0.7})` and `bringToFront()`. — [Leaflet choropleth tutorial](https://leafletjs.com/examples/choropleth/)

### Inferences
- Leaflet adaptation for Kçiq pressure points (single source of truth for breaks, colours, counts):

```js
const PRESSURE_CLASSES = [
  { min: -Infinity, max: 1.5, label: '< 1.5 (below ARRU min)', color: '#FFFFFF', stroke: '#000000' },
  { min: 1.5, max: 5,  label: '1.5 – 5.0', color: '#4575B4' },
  { min: 5,   max: 7,  label: '5.0 – 7.0', color: '#91BFDB' },
  { min: 7,   max: 9,  label: '7.0 – 9.0 (above ARRU 7)', color: '#FDAE61' },
  { min: 9,   max: 11, label: '9.0 – 11.0', color: '#F03B20' },
  { min: 11,  max: Infinity, label: '≥ 11.0', color: '#BD0026' },
];
const classOf = p => p == null ? null : PRESSURE_CLASSES.find(c => p >= c.min && p < c.max);
// L.circleMarker(latlng, { radius: 5, fillColor: cls ? cls.color : '#BDBDBD',
//   color: '#FFFFFF', weight: 1, fillOpacity: 0.9 })
// Legend: loop PRESSURE_CLASSES, append count n = points.filter(p => classOf(p.bar) === c).length,
// then a 'No data' row, a divider "ARRU max 7 bar", and a source line.
```

- Use `L.circleMarker` (pixel radius, constant on zoom) rather than `L.circle` (metres) for consumer points; use `L.canvas()` renderer for 1,040 points and 3,000 polylines to keep phones responsive.
- On phones, make the legend collapsible (start collapsed under 600 px width) so it does not cover the DMA.
- QGIS print layout for the slide: Legend item with "Only show items inside linked map" off (to keep empty regulatory classes), filter legend by expression off, manual label text with counts (QGIS can show feature counts per class via the layer's "Show feature count" option), plus Scale bar, North arrow and an Overview map item for the inset. Export at 1920×1080 px or 300 dpi.
- Keep one config (JSON) of breaks and hex values and generate the Leaflet legend, the KML styles and the QGIS style (.qml) from it, so all three outputs stay identical.

### Gaps
- The QGIS manual section on Print Layout legend options ("Show feature count", "Only show items inside linked map") was not fetched; option names are from practitioner knowledge and should be checked in the installed QGIS version.
