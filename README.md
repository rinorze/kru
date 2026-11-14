# DMA Kçiq: water-loss panel for KRU Mitrovica

A web panel for the pilot District Metered Area (DMA01) that covers **Kçiq i Madh** and **Kçiq i Vogël** in the service area of KRU "Mitrovica" Sh.A. It was built for the KRU Mitrovica non-revenue water (NRW) hackathon, 13–14 November 2026.

The panel brings the parts of an NRW programme into one tool:

- **Water balance:** a standard IWA balance with the Infrastructure Leakage Index (ILI).
- **Night flow:** minimum night flow (MNF) alarms.
- **Pressure:** pressure management with what-if scenarios for a pressure-reducing valve (PRV).
- **Billing checks:** billing anomaly detection, and billing↔GIS reconciliation that finds dwellings with no customer account.
- **Field work:** work orders and on-site meter readings.
- **Customers:** a registration form that issues a signed digital contract.
- **KRU data:** importers for KRU's billing export, logger or SCADA files and pipe GIS. Uploaded data replaces the model on every page that uses it.

The interface is in Albanian and English.

**Shqip, shkurt:**
- Paneli i zonës pilot DMA01 për Kçiq i Madh dhe Kçiq i Vogël.
- Përmban:
  - bilancin e ujit sipas IWA;
  - alarmet e rrjedhës minimale të natës;
  - menaxhimin e presionit me PRV;
  - anomalitë e faturimit;
  - përputhjen faturim↔GIS;
  - hartën GIS me detaje për çdo ndërtesë;
  - urdhrat e punës;
  - leximin në terren;
  - regjistrimin e konsumatorëve të rinj me kontratë digjitale të nënshkruar, e cila ruhet përgjithmonë;
  - ngarkimin e të dhënave reale të KRU-së (faturimi, loggerët/SCADA, GIS-i i rrjetit) te faqja "Të dhënat e KRU-së".

## What is real and what is modelled

The panel labels every figure with where it comes from. The bar under the top gauges lists which datasets come from KRU's files and which are still modelled; it turns green once nothing is modelled.

| Data | Status | Source |
|---|---|---|
| Cadastral boundary 71202012 and neighbouring zones | Real | Kosovo Geoportal |
| 788 buildings, footprints, roads, public buildings | Real | OpenStreetMap |
| Ground elevation of every building | Real | EU-DEM |
| Population and households (4,276 people, 779 households) | Real | Kosovo census 2024 |
| Household tariff (0.53 €/m³) | Real | ARRU 2026 |
| Customer registrations, digital contracts, work orders, field readings | Real, entered by users | This application's database |
| Customers and monthly billed volumes | **Modelled until uploaded** | KRU billing export, via the KRU data page |
| Inlet flow and pressures | **Modelled until uploaded** | KRU loggers or SCADA, via the KRU data page |
| Pipe network and mains length | **Assumed (30 km) until uploaded** | KRU network GIS (GeoJSON), via the KRU data page |

Without KRU's files the panel runs on a seeded simulation calibrated to the Mitrovica unit's published NRW, and says so on every page. Each dataset switches over on its own as soon as its file is accepted, and goes back to the model if it is cleared. The remaining parameters sit on the Assumptions page; values taken from KRU's files are tagged *Measured by KRU*.

## Features

| Page | What it does |
|---|---|
| Overview | Live inlet and pressure gauges, the alarms that need action, and the zone at a glance |
| GIS map | Every building, coloured by height band, village or pressure. Click a building, or search `B-120` or `K-10001`, to see its elevation, its pressure now and with the PRV, its customers and their billed use, anomaly flags, contracts, nearby work orders and the nearest sensor |
| Water balance | IWA balance table, ILI and its World Bank band, real losses per connection |
| Night flow | Up to 14 days of hourly inlet flow and MNF per night; the alarm fires after two nights above the threshold. On modelled data a leak simulator shows how the alarm reacts |
| Pressure and PRV | Pressure profile along the zone, PRV set-point scenarios, savings and payback |
| Anomalies, Customers, Billing ↔ GIS | Meter anomalies (zero reading, sharp drop, below neighbours, sharp rise) and dwellings that take water with no account |
| Register with KRU | Application form with on-screen signature (finger, stylus or mouse). It issues a contract number and a customer code |
| Digital contracts | Register of signed contracts; each contract can be printed or saved as a PDF |
| Work orders, Field reading | A board for crews and a phone screen for meter readers, with checks made on the spot |
| KRU data | Upload billing, logger and GIS files; per-line error report; CSV templates; upload history; switch any dataset back to the model |
| Plan and budget, Assumptions, Sources | 12-month pilot plan, three budget tiers, every assumption and every source |

### Digital contracts

Contracts are written to an **append-only** SQLite table:

- **No edits or deletions.** Database triggers refuse every `UPDATE` and `DELETE`.
- **Hash chain.** Each contract stores the SHA-256 of its own content and the hash of the contract before it. Changing any stored contract therefore breaks the chain, and the contract page shows the result of that check.
- **Privacy.** Contract numbers are sequential, so the full contract (personal number and signature) opens only with a private access key. That key goes to the signer and nobody else. Without it the page shows a public view with those fields hidden.

### Loading KRU's data

Open **Të dhënat e KRU-së / KRU data** and upload each file, or send it to the API: `POST /api/data/import/{customers|readings|telemetry|network}` with the file as the request body. Every upload returns the number of rows accepted and rejected, and the line number and reason for each rejected row.

| File | Columns | Notes |
|---|---|---|
| Customer register (CSV) | `code`, `village`, `lat`, `lon`, `meter_year`, `address` | Replaces the previous register. Only `code` is required. Customers without coordinates are listed as *no GIS point* |
| Monthly billed volumes (CSV) | `code`, `period`, `m3` | Periods as `2026-10`, `10/2026` or `01.10.2026`. A month uploaded again overwrites the earlier value |
| Loggers or SCADA (CSV) | `timestamp`, `sensor`, `value`, `unit` | Long format, or wide with one column per sensor. Flow in m³/h or l/s; pressure in bar, m or kPa. Night flow needs at least 3 full days of inlet flow |
| Pipe network (GeoJSON) | LineString or MultiLineString geometry, any properties | WGS84 (EPSG:4326). Sets the mains length and draws the pipes on the map |

The parsers accept semicolon, comma, tab or pipe separators, decimal commas, UTF-8 or Windows-1252 files, and Albanian column names (`kodi`, `fshati`, `periudha`, `konsumi`, `koha`, `vlera`, …). Header-only templates are at `/api/data/template/{kind}.csv`.

Logger night pressure (02:00–04:00) also calibrates the hydraulic grade used for the pressure map and the PRV scenarios.

## Architecture

```
app/
  backend/    FastAPI + SQLite. sim.py is the zone model, imports.py the file parsers, main.py the API, plan.py the pilot plan
  frontend/   React 19 + Vite + TypeScript. Leaflet maps, Recharts charts, plain CSS design tokens
docs/         screenshots (before/after the UI work)
Kciq_Research_Report.md   research behind the model and the pilot plan
```

FastAPI serves the built frontend, so one process runs the whole application. Live sensor values are streamed every 2 s over server-sent events (`/api/stream`), the same pattern as KRU's monitoring API.

## Run it

You need Python 3.11 or newer and Node 20 or newer.

```bash
pip install -r app/backend/requirements.txt
npm --prefix app/frontend install
npm --prefix app/frontend run build
python -m uvicorn main:app --app-dir app/backend --port 8000
```

Open http://localhost:8000. The interactive API documentation is at http://localhost:8000/api/docs.

To work on the frontend with hot reload, keep the API running on port 8000 and start Vite on http://localhost:5173. Vite forwards `/api` to the API.

```bash
npm --prefix app/frontend run dev
```

Set `KCIQ_DB` to put the database somewhere other than `app/backend/kciq.db`.

## Tests

```bash
cd app/backend && python -m pytest -q
```

The 16 API tests cover the following:

- **Model:** the water balance identity, PRV savings, and the minimum-pressure constraint.
- **Records:** the anomaly and mismatch detection, the work-order lifecycle, and field-reading checks.
- **Map and contracts:** building details; contract creation, validation and the duplicate guard; the access key; and the append-only triggers.
- **Security:** the frontend route never serves files outside the built app.
- **Imports:** a billing export with Albanian headers, decimal commas and bad lines; long and wide logger exports in l/s and metres; a pipe network with a projected feature; and that clearing each dataset restores the model exactly.

The tests run on a temporary database, so they never write contracts into the real one.

## Before production

The application is a working prototype. To run it for KRU's customers:

1. **Real data.** Upload KRU's billing export, logger or SCADA files and pipe GIS on the KRU data page. For a live feed, schedule the same `POST /api/data/import/...` calls from the SCADA or billing server.
2. **Accounts.** Add staff sign-in and roles. The data import, contract register and work orders are open to anyone who can reach the server.
3. **Hosting.** Serve over HTTPS and back up `kciq.db`, or move to PostgreSQL.
4. **Legal review.** KRU and ARRU must approve the contract wording; the panel marks it as a model. The handling of personal data needs review under Law No. 06/L-082.
5. **Billing link.** Send new contracts to the billing system, so each new customer code becomes a billed account.
