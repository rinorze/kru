"""Action plan, budget tiers, targets and references shown on the Plan page.

Budget lines: 'sourced' = public list/reseller price converted to EUR; 'estimate' = our own figure.
Totals exclude VAT, customs and shipping to Kosovo. Get distributor quotes before committing.
"""

PLAN = {
    "phases": [
        {"m0": 0, "m1": 1, "sq": "Kufiri dhe izolimi i zonës", "en": "Zone boundary and isolation",
         "who": "KRU – rrjeti / GIS",
         "d_sq": "Konfirmo kufirin në GIS, mbyll valvulat kufitare, test me presion zero.",
         "d_en": "Confirm the boundary in GIS, close boundary valves, zero-pressure test."},
        {"m0": 0.5, "m1": 1.5, "sq": "Matësi i hyrjes dhe sensorët", "en": "Inlet meter and sensors",
         "who": "KRU – mirëmbajtja, furnitori",
         "d_sq": "Matës elektromagnetik në hyrje, 3 loggerë presioni, gateway LoRaWAN.",
         "d_en": "Electromagnetic inlet meter, 3 pressure loggers, LoRaWAN gateway."},
        {"m0": 1.5, "m1": 2.5, "sq": "Matja bazë dhe bilanci i parë", "en": "Baseline and first water balance",
         "who": "KRU – humbjet e ujit",
         "d_sq": "Dy javë të dhëna, bilanci IWA, prurja e natës, përputhja faturim–GIS.",
         "d_en": "Two weeks of data, IWA balance, night flow, billing–GIS matching."},
        {"m0": 2, "m1": 4, "sq": "Verifikimi në terren dhe riparimet", "en": "Field checks and repairs",
         "who": "KRU – ekipet e terrenit, komercialja",
         "d_sq": "Test me hapa, detektim akustik, riparim rrjedhjesh, lidhje ilegale, ujëmatës të prishur.",
         "d_en": "Step test, acoustic detection, leak repair, illegal connections, broken meters."},
        {"m0": 3.5, "m1": 5, "sq": "Menaxhimi i presionit", "en": "Pressure management",
         "who": "KRU – rrjeti, furnitori",
         "d_sq": "Valvulë reduktuese për brezin e ulët, rregullim sipas pikës kritike.",
         "d_en": "Pressure-reducing valve for the low band, tuned to the critical point."},
        {"m0": 5, "m1": 6, "sq": "Verifikimi i rezultateve dhe zgjerimi", "en": "Verify results and scale up",
         "who": "KRU – menaxhmenti, ARRU",
         "d_sq": "Krahaso me bazën, raporto treguesit, plani për zonën e radhës.",
         "d_en": "Compare with the baseline, report indicators, plan the next zone."},
    ],
    "budget": {
        "note_sq": "Çmimet 'burim' janë çmime publike të konvertuara në €; 'vlerësim' janë shifrat tona. Pa TVSH, doganë dhe transport.",
        "note_en": "'Sourced' prices are public prices converted to EUR; 'estimate' are our own figures. Excludes VAT, customs and shipping.",
        "tiers": [
            {"key": "min", "sq": "Minimal", "en": "Minimal", "total": 11500,
             "d_sq": "Matja: matësi i hyrjes, 3 loggerë presioni, 1 gateway.",
             "d_en": "Measurement only: inlet meter, 3 pressure loggers, 1 gateway."},
            {"key": "std", "sq": "Standard", "en": "Standard", "total": 29700,
             "d_sq": "Rekomandohet. Plus 8 loggerë, 2 gateway, pajisje për gjetjen e rrjedhjeve dhe PRV për brezin A.",
             "d_en": "Recommended. Adds 8 loggers, 2 gateways, leak-finding kit and the PRV for band A."},
            {"key": "adv", "sq": "I avancuar", "en": "Advanced", "total": 58200,
             "d_sq": "Plus kontroller smart për PRV-në dhe 40 ujëmatës smart te konsumatorët e mëdhenj.",
             "d_en": "Adds a smart PRV controller and 40 smart meters on large users."},
        ],
        "lines": [
            {"sq": "Matës hyrjeje elektromagnetik DN100 (Siemens MAG 8000)", "en": "Battery electromagnetic inlet meter DN100 (Siemens MAG 8000)", "min": 3800, "std": 3800, "adv": 3800, "basis": "sourced"},
            {"sq": "Transmetues impulsesh LoRa për matësin", "en": "Pulse-to-LoRa transmitter for the meter", "min": 250, "std": 250, "adv": 250, "basis": "estimate"},
            {"sq": "Loggerë presioni LoRaWAN, 238 € (3 / 8 / 10)", "en": "LoRaWAN pressure loggers at €238 (3 / 8 / 10)", "min": 714, "std": 1904, "adv": 2380, "basis": "sourced"},
            {"sq": "Gateway LoRaWAN i jashtëm, 451 € (1 / 2 / 2)", "en": "Outdoor LoRaWAN gateway at €451 (1 / 2 / 2)", "min": 451, "std": 902, "adv": 902, "basis": "sourced"},
            {"sq": "SIM, shtyllë dhe panel diellor", "en": "SIMs, mast and solar mounts", "min": 310, "std": 620, "adv": 620, "basis": "estimate"},
            {"sq": "Pusetë e matësit dhe punë ndërtimore", "en": "Meter chamber and civil works", "min": 2500, "std": 2500, "adv": 2500, "basis": "estimate"},
            {"sq": "Pika lidhjeje për presion, 150 €", "en": "Pressure tapping points at €150", "min": 450, "std": 1200, "adv": 1200, "basis": "estimate"},
            {"sq": "10 loggerë zhurme akustikë", "en": "10 acoustic noise loggers", "min": 0, "std": 7000, "adv": 7000, "basis": "sourced"},
            {"sq": "Mikrofon toke", "en": "Ground microphone", "min": 0, "std": 3600, "adv": 3600, "basis": "sourced"},
            {"sq": "Valvulë reduktuese DN100 me pilot", "en": "Pilot-operated PRV DN100", "min": 0, "std": 4500, "adv": 4500, "basis": "estimate"},
            {"sq": "Kontroller smart për valvulën", "en": "Smart PRV controller", "min": 0, "std": 0, "adv": 3500, "basis": "estimate"},
            {"sq": "Pusetë e valvulës, bypass, filtër", "en": "PRV chamber, bypass, strainer", "min": 0, "std": 6000, "adv": 6000, "basis": "estimate"},
            {"sq": "40 ujëmatës smart ultrasonikë, 165 €", "en": "40 ultrasonic smart meters at €165", "min": 0, "std": 0, "adv": 6600, "basis": "sourced"},
            {"sq": "Montimi i 40 ujëmatësve", "en": "Installing 40 meters", "min": 0, "std": 0, "adv": 1600, "basis": "estimate"},
            {"sq": "Server, 6 muaj", "en": "Hosting, 6 months", "min": 60, "std": 60, "adv": 60, "basis": "estimate"},
            {"sq": "Montim dhe trajnim", "en": "Installation labour and training", "min": 1500, "std": 4000, "adv": 4000, "basis": "estimate"},
            {"sq": "Rezervë (15% / 15% / 20%)", "en": "Contingency (15% / 15% / 20%)", "min": 1505, "std": 3875, "adv": 9702, "basis": "estimate"},
        ],
    },
    "comms": {
        "sq": "Rekomandim: rrjet privat LoRaWAN në 868 MHz. Rregullorja e ARKEP-it 012/B/24 e lejon pa licencë individuale (25 mW). NB-IoT në Kosovë nuk u konfirmua nga asnjë burim; pyetni Vala dhe IPKO.",
        "en": "Recommendation: a private LoRaWAN network on 868 MHz. ARKEP Regulation 012/B/24 allows it without an individual licence (25 mW). NB-IoT in Kosovo was not confirmed by any source; ask Vala and IPKO.",
    },
    "references": [],  # filled from research; see research.py
}

# contingency and tier totals are computed from the lines, so they always add up
_RATE = {"min": 0.15, "std": 0.15, "adv": 0.20}
_lines = PLAN["budget"]["lines"]
_cont = next(l for l in _lines if l["en"].startswith("Contingency"))
for _k, _r in _RATE.items():
    _cont[_k] = round(sum(l[_k] for l in _lines if l is not _cont) * _r)
for _t in PLAN["budget"]["tiers"]:
    _t["total"] = sum(l[_t["key"]] for l in _lines)

try:  # optional research add-ons kept in a separate file so they can be updated without touching the plan
    import research
    PLAN["references"] = research.REFERENCES
    PLAN["cases"] = research.CASES
except Exception:  # pragma: no cover
    PLAN["cases"] = []
