import { Fragment } from 'react'
import { api } from '../api'
import { Loading, PageHead } from '../components/ui'
import { useApp, useData } from '../state'

export default function Sources() {
  const { t, kru } = useApp()
  const file = (m: { file?: string; at?: string } | null | undefined) => (m?.file ? ` (${m.file}, ${m.at?.slice(0, 10) ?? ''})` : '')
  const tel = kru?.telemetry.active
  const { data: p, error } = useData(api.plan)
  const data = [
    { what: t('Kufiri i zonës', 'Zone boundary'), src: t('Geoportali i Kosovës (AKK), zona kadastrale 71202012, WMS GetFeatureInfo, EPSG:7392 → WGS84', 'Kosovo Geoportal (AKK), cadastral zone 71202012, WMS GetFeatureInfo, EPSG:7392 → WGS84'), real: true },
    { what: t('Ndërtesat dhe rrugët', 'Buildings and roads'), src: t('OpenStreetMap përmes Overpass API, nëntor 2026', 'OpenStreetMap via the Overpass API, November 2026'), real: true },
    { what: t('Kuota e terrenit', 'Ground elevation'), src: 'EU-DEM / Copernicus GLO-30 (Open-Elevation, OpenTopoData)', real: true },
    { what: t('Popullsia dhe ekonomitë familjare', 'Population and households'), src: t('ASK, Regjistrimi i Popullsisë 2024, sipas fshatit', 'KAS, 2024 Population Census, by village'), real: true },
    { what: t('NRW, tarifat, lidhjet ilegale', 'NRW, tariffs, illegal connections'), src: t('KRU Mitrovica, Raporti Vjetor 2025; ARRU, tarifat 2026', 'KRU Mitrovica, Annual Report 2025; ARRU, 2026 tariffs'), real: true },
    kru?.billing.active
      ? { what: t('Konsumatorët dhe faturimi', 'Customers and billing'), src: t('Eksporti i faturimit të KRU-së', "KRU's billing export") + file(kru.billing.active), real: true }
      : { what: t('Konsumatorët dhe faturimi', 'Customers and billing'), src: t('Të simuluara. Zëvendësohen me eksportin e faturimit të KRU-së.', "Simulated. Replaced by KRU's billing export."), real: false },
    tel
      ? { what: t('Rrjedhat dhe presionet', 'Flows and pressures'), src: t('Loggerët / SCADA e KRU-së', "KRU's loggers / SCADA") + file(tel) + ((kru?.telemetry.flow_days ?? 0) < 3 ? t('; rrjedha e natës ende model', '; night flow still modelled') : ''), real: true }
      : { what: t('Rrjedhat dhe presionet', 'Flows and pressures'), src: t('Të simuluara. Zëvendësohen me loggerët ose SCADA-n e KRU-së.', "Simulated. Replaced by KRU's loggers or SCADA."), real: false },
    kru?.network.active
      ? { what: t('Rrjeti i tubave', 'Pipe network'), src: t('GIS-i i rrjetit të KRU-së', "KRU's network GIS") + file(kru.network.active), real: true }
      : { what: t('Rrjeti i tubave', 'Pipe network'), src: t('Gjatësia 30 km është supozim derisa KRU të ngarkojë GIS-in e rrjetit.', 'The 30 km length is an assumption until KRU uploads its network GIS.'), real: false },
  ]
  const methods = [
    [t('Bilanci i ujit', 'Water balance'), 'IWA / AWWA M36, Alegre et al. 2006'],
    ['ILI, UARL', 'Lambert et al. 1999; World Bank Liemberger & Wyatt 2018'],
    [t('Rrjedha minimale e natës', 'Minimum night flow'), 'UK Water Industry Report E, 1994; Farley & Trow 2003'],
    ['FAVAD, N1', 'May 1994; Thornton & Lambert 2005'],
    [t('Presioni dhe plasaritjet', 'Pressure and bursts'), 'Thornton & Lambert 2006, 1.4× rule'],
    [t('Kufijtë e presionit', 'Pressure limits'), 'ARRU Rule 02/2016, s.17 (1.5–7 bar), s.18 (24 h)'],
    ['LoRaWAN 868 MHz', 'ARKEP Reg. 012/B/24'],
  ]
  return (
    <div className="page">
      <PageHead title={t('Burimet dhe metodat', 'Sources and methods')}
        lead={t('Çfarë është e vërtetë, çfarë është e simuluar, dhe nga vjen secili numër.', 'What is real, what is simulated, and where each number comes from.')} />
      <section className="panel flush">
        <table className="data">
          <thead><tr><th>{t('Të dhënat', 'Data')}</th><th>{t('Burimi', 'Source')}</th><th>{t('Statusi', 'Status')}</th></tr></thead>
          <tbody>{data.map(d => <tr key={d.what}><td><b>{d.what}</b></td><td>{d.src}</td><td><span className={'tag ' + (d.real ? 'done' : 'open')}>{d.real ? t('E vërtetë', 'Real') : t('E simuluar', 'Simulated')}</span></td></tr>)}</tbody>
        </table>
      </section>
      <div className="grid g2 mt">
        <section className="panel">
          <h2>{t('Metodat', 'Methods')}</h2>
          <dl className="kv">{methods.map(([a, b]) => <Fragment key={a}><dt>{a}</dt><dd>{b}</dd></Fragment>)}</dl>
        </section>
        <section className="panel">
          <h2>{t('Referencat', 'References')}</h2>
          {!p ? <Loading error={error} /> : (
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14 }}>
              {p.references.map(r => <li key={r.url} style={{ marginBottom: 6 }}><a href={r.url} target="_blank" rel="noreferrer">{r.t}</a></li>)}
            </ul>
          )}
        </section>
      </div>
      <section className="panel mt">
        <h2>{t('Shkarkime për Google Earth Pro dhe QGIS', 'Downloads for Google Earth Pro and QGIS')}</h2>
        <p className="sub">{t('Kufiri, sensorët, ndërtesat sipas brezit dhe fshatit, rrugët dhe objektet publike.', 'Boundary, sensors, buildings by band and village, roads and public buildings.')}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn" href="/Kciq_DMA_pilot.kml" download>KML (Google Earth Pro)</a>
          <a className="btn" href="/kciq_layers.geojson" download>GeoJSON (QGIS)</a>
          <a className="btn" href="/api/docs" target="_blank" rel="noreferrer">{t('Dokumentimi i API-së', 'API documentation')}</a>
        </div>
      </section>
    </div>
  )
}
