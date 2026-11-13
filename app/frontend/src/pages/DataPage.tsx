import { useRef, useState, type DragEvent } from 'react'
import { api, type Dataset, type ImportKind, type ImportResult } from '../api'
import { Loading, PageHead } from '../components/ui'
import { fmt, useApp } from '../state'

type Col = [string, boolean, string, string]   // name, required, sq, en

const SPECS: Record<ImportKind, { sq: string; en: string; dsq: string; den: string; accept: string; template: boolean; append: boolean; cols: Col[] }> = {
  customers: {
    sq: 'Regjistri i konsumatorëve', en: 'Customer register', accept: '.csv,.txt', template: true, append: false,
    dsq: 'Eksporti i llogarive nga sistemi i faturimit. Çdo ngarkim e zëvendëson listën e mëparshme.',
    den: 'The account export from the billing system. Each upload replaces the previous list.',
    cols: [
      ['code', true, 'Kodi i konsumatorit, si në faturim', 'Customer code, as in billing'],
      ['village', false, 'Kçiq i Madh ose Kçiq i Vogël', 'Kçiq i Madh or Kçiq i Vogël'],
      ['lat, lon', false, 'Pika e ujëmatësit, WGS84 në gradë dhjetore. Pa to konsumatori shënohet "pa pikë GIS".', 'Meter point, WGS84 decimal degrees. Without them the customer is marked "no GIS point".'],
      ['meter_year', false, 'Viti i vendosjes së ujëmatësit', 'Year the meter was installed'],
      ['address', false, 'Adresa', 'Address'],
    ],
  },
  readings: {
    sq: 'Konsumi mujor i faturuar', en: 'Monthly billed volumes', accept: '.csv,.txt', template: true, append: true,
    dsq: 'Një rresht për konsumator për muaj. Paneli përdor 12 muajt e fundit; një muaj i ngarkuar sërish mbishkruhet.',
    den: 'One row per customer per month. The panel uses the last 12 months; a month uploaded again is overwritten.',
    cols: [
      ['code', true, 'Kodi i konsumatorit', 'Customer code'],
      ['period', true, 'Muaji: 2026-10, 10/2026 ose 01.10.2026', 'Month: 2026-10, 10/2026 or 01.10.2026'],
      ['m3', true, 'Sasia e faturuar në m³; pranohet presja dhjetore', 'Billed volume in m³; decimal commas are fine'],
    ],
  },
  telemetry: {
    sq: 'Loggerët dhe SCADA', en: 'Loggers and SCADA', accept: '.csv,.txt', template: true, append: true,
    dsq: 'Rrjedha e hyrjes dhe presionet. Formati i gjatë (një rresht për lexim) ose i gjerë (një kolonë për sensor). Për rrjedhën e natës duhen të paktën 3 ditë të plota.',
    den: 'Inlet flow and pressures. Long format (one row per sample) or wide (one column per sensor). Night flow needs at least 3 full days.',
    cols: [
      ['timestamp', true, '2026-11-12 02:00, 12.11.2026 02:00 ose ISO 8601', '2026-11-12 02:00, 12.11.2026 02:00 or ISO 8601'],
      ['sensor', true, 'DMA01-Q-HYRJA, DMA01-P-KRIT, DMA01-P-ULET, DMA01-P-AZP (ose HYRJA, KRIT, ULET, AZP)', 'DMA01-Q-HYRJA, DMA01-P-KRIT, DMA01-P-ULET, DMA01-P-AZP (or HYRJA, KRIT, ULET, AZP)'],
      ['value', true, 'Vlera e matur', 'Measured value'],
      ['unit', false, 'm3/h ose l/s për rrjedhën; bar, m ose kPa për presionin', 'm3/h or l/s for flow; bar, m or kPa for pressure'],
    ],
  },
  network: {
    sq: 'Rrjeti i tubave (GIS)', en: 'Pipe network (GIS)', accept: '.geojson,.json', template: false, append: false,
    dsq: 'GeoJSON me LineString në WGS84 (EPSG:4326), i eksportuar nga QGIS ose ArcGIS. Atributet si materiali, DN dhe viti shfaqen në hartë.',
    den: 'GeoJSON LineStrings in WGS84 (EPSG:4326), exported from QGIS or ArcGIS. Attributes such as material, DN and year show on the map.',
    cols: [['geometry', true, 'LineString ose MultiLineString', 'LineString or MultiLineString'], ['properties', false, 'P.sh. material, dn, year', 'E.g. material, dn, year']],
  },
}
const CLEARED: Record<string, [string, string]> = { billing: ['faturimi', 'billing'], telemetry: ['loggerët', 'loggers'], network: ['rrjeti i tubave', 'pipe network'] }
const DATASET: Record<ImportKind, Dataset> = { customers: 'billing', readings: 'billing', telemetry: 'telemetry', network: 'network' }

export default function DataPage() {
  const { t, kru: data } = useApp()
  if (!data) return <div className="page"><Loading /></div>
  const b = data.billing.active, tl = data.telemetry.active, nw = data.network.active
  const state = (on: unknown, sq: string, en: string) => <span className={'tag ' + (on ? 'done' : 'open')}>{on ? t('Matur: ' + sq, 'Measured: ' + en) : t('Model', 'Modelled')}</span>

  return (
    <div className="page">
      <PageHead title={t('Të dhënat e KRU-së', 'KRU data')}
        lead={t('Ngarkoni eksportet nga faturimi, loggerët ose SCADA dhe GIS-i. Sapo një skedar pranohet, faqet përkatëse llogariten mbi të dhënat reale; çdo pjesë pa të dhëna mbetet model dhe shënohet si e tillë.',
          'Upload the exports from billing, the loggers or SCADA, and GIS. As soon as a file is accepted the pages that use it recalculate on real data; anything without data stays modelled and is labelled so.')} />

      <div className="strip">
        <div><small>{t('Faturimi', 'Billing')}</small>{state(b, `${fmt(b?.customers)} konsumatorë`, `${fmt(b?.customers)} customers`)}
          <span className="delta note">{b ? `${b.first_period} – ${b.last_period}` : t('Konsumatorët, anomalitë, bilanci', 'Customers, anomalies, balance')}</span></div>
        <div><small>{t('Rrjedha dhe presioni', 'Flow and pressure')}</small>{state(tl, `${tl?.days ?? 0} ditë`, `${tl?.days ?? 0} days`)}
          <span className="delta note">{tl ? `${tl.from.slice(0, 16).replace('T', ' ')} – ${tl.to.slice(0, 16).replace('T', ' ')}` : t('Rrjedha e natës, matësit live', 'Night flow, live gauges')}</span></div>
        <div><small>{t('Rrjeti i tubave', 'Pipe network')}</small>{state(nw, `${fmt(nw?.km, 1)} km`, `${fmt(nw?.km, 1)} km`)}
          <span className="delta note">{nw ? `${fmt(nw.pipes)} ${t('segmente', 'segments')}` : t('Gjatësia e rrjetit, harta', 'Mains length, map')}</span></div>
      </div>

      <div className="grid g2 mt">
        {(Object.keys(SPECS) as ImportKind[]).map(k => <ImportCard key={k} kind={k} />)}
      </div>

      <section className="panel mt">
        <h2>{t('Historiku i ngarkimeve', 'Upload history')}</h2>
        {data.log.length === 0 ? <p className="note">{t('Ende asnjë ngarkim. Paneli punon tërësisht mbi modelin.', 'No uploads yet. The panel runs entirely on the model.')}</p> : (
          <div className="scroll-x"><table className="data">
            <thead><tr><th>{t('Koha', 'Time')}</th><th>{t('Lloji', 'Kind')}</th><th>{t('Skedari', 'File')}</th><th className="r">{t('Pranuar', 'Accepted')}</th><th className="r">{t('Refuzuar', 'Rejected')}</th></tr></thead>
            <tbody>{data.log.map(l => (
              <tr key={l.id}><td className="num">{l.at.replace('T', ' ')}</td>
                <td>{l.kind.startsWith('clear-') ? t('Kthyer te modeli: ', 'Back to the model: ') + t(...(CLEARED[l.kind.slice(6)] ?? [l.kind, l.kind])) : t(SPECS[l.kind as ImportKind]?.sq ?? l.kind, SPECS[l.kind as ImportKind]?.en ?? l.kind)}</td>
                <td>{l.filename || '–'}</td><td className="r num">{fmt(l.accepted)}</td><td className="r num">{fmt(l.rejected)}</td></tr>))}</tbody>
          </table></div>
        )}
      </section>
    </div>
  )
}

function ImportCard({ kind }: { kind: ImportKind }) {
  const { t, bump, toast, kru: data } = useApp()
  const spec = SPECS[kind]
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<ImportResult | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [replace, setReplace] = useState(false)
  const [over, setOver] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true); setErr(null); setRes(null)
    try {
      const r = await api.importData(kind, file, replace)
      setRes(r); bump()
      toast(t(`${fmt(r.accepted)} rreshta u pranuan`, `${fmt(r.accepted)} rows accepted`))
    } catch (e) { setErr((e as Error).message) } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files[0]) }
  const clear = async () => {
    const ds = DATASET[kind]
    const what = ds === 'billing' ? t('regjistri i konsumatorëve dhe konsumi mujor', 'the customer register and the monthly volumes') : t(...CLEARED[ds])
    if (!window.confirm(t(`Të fshihen të dhënat e ngarkuara (${what})? Kjo pjesë e panelit kthehet te modeli.`, `Delete the uploaded data (${what})? This part of the panel goes back to the model.`))) return
    try { await api.clearData(ds); setRes(null); bump(); toast(t('Të dhënat u fshinë', 'Data deleted')) } catch (e) { toast((e as Error).message) }
  }
  const rows = (kind === 'customers' ? data?.billing.customer_rows : kind === 'readings' ? data?.billing.reading_rows
    : kind === 'telemetry' ? Object.values(data?.telemetry.sensors ?? {}).reduce((a, s) => a + s.rows, 0) : data?.network.active?.pipes) ?? 0

  return (
    <section className={'panel import' + (over ? ' over' : '')} onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={drop}>
      <div className="side-head">
        <div><h2>{t(spec.sq, spec.en)}</h2><p className="note" style={{ margin: 0 }}>{fmt(rows)} {t('rreshta të ruajtur', 'rows stored')}</p></div>
        {spec.template && <a className="btn small" href={`/api/data/template/${kind}.csv`} download>{t('Shablloni CSV', 'CSV template')}</a>}
      </div>
      <p className="sub mt">{t(spec.dsq, spec.den)}</p>
      <table className="data compact cols">
        <tbody>{spec.cols.map(([n, req, sq, en]) => <tr key={n}><td><code>{n}</code>{req && <span className="req" title={t('e detyrueshme', 'required')}> *</span>}</td><td>{t(sq, en)}</td></tr>)}</tbody>
      </table>
      {kind !== 'network' && <p className="note">{t('Ndarës: presje, pikëpresje ose tab. Pranohen edhe emrat shqip të kolonave (kodi, periudha, konsumi, koha, vlera…).', 'Separator: comma, semicolon or tab. Albanian column names work too (kodi, periudha, konsumi, koha, vlera…).')}</p>}
      {kind === 'telemetry' && data?.telemetry.sensors && Object.keys(data.telemetry.sensors).length > 0 && (
        <ul className="plain">{Object.entries(data.telemetry.sensors).map(([id, s]) => (
          <li key={id}><b>{id}</b><span className="num">{fmt(s.rows)}</span><span className="note">{s.from.slice(0, 16).replace('T', ' ')} – {s.to.slice(0, 16).replace('T', ' ')}</span></li>))}</ul>
      )}

      <div className="upload-row">
        <input ref={input} type="file" accept={spec.accept} hidden onChange={e => upload(e.target.files?.[0])} />
        <button className="btn primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? t('Duke ngarkuar…', 'Uploading…') : t('Zgjidh skedarin', 'Choose a file')}</button>
        <span className="note">{t('ose tërhiqeni këtu', 'or drop it here')}</span>
        {spec.append && <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />{t('Zëvendëso të gjitha', 'Replace everything')}</label>}
        {rows > 0 && <button className="btn small" onClick={clear}>{t('Kthehu te modeli', 'Back to the model')}</button>}
      </div>

      {err && <div className="callout alarm mt" role="alert"><b>{t('Skedari nuk u ngarkua', 'File not uploaded')}</b>{err}</div>}
      {res && (
        <div className={'callout mt ' + (res.accepted === 0 ? 'alarm' : res.rejected ? 'warn' : 'ok')} role="status">
          <b>{res.accepted === 0 ? t('Asnjë rresht nuk u pranua', 'No rows were accepted')
            : t(`${fmt(res.accepted)} rreshta u pranuan${res.rejected ? `, ${fmt(res.rejected)} u refuzuan` : ''}`, `${fmt(res.accepted)} rows accepted${res.rejected ? `, ${fmt(res.rejected)} rejected` : ''}`)}</b>
          {kind === 'customers' && res.accepted > 0 && !res.status.billing.active && t('Tani ngarkoni konsumin mujor që paneli të kalojë në faturimin real.', 'Now upload the monthly volumes so the panel switches to real billing.')}
          {kind === 'telemetry' && res.accepted > 0 && res.status.telemetry.flow_days < 3 && t(' Matësit live përdorin këto vlera; rrjedha e natës mbetet model derisa të ketë 3 ditë të plota rrjedhje hyrëse.', ' The live gauges use these values; night flow stays modelled until there are 3 full days of inlet flow.')}
          {res.errors.length > 0 && (
            <div className="scroll-x mt"><table className="data compact">
              <thead><tr><th className="r">{t('Rreshti', 'Line')}</th><th>{t('Arsyeja', 'Reason')}</th></tr></thead>
              <tbody>{res.errors.map((e, k) => <tr key={k}><td className="r num">{e.line}</td><td>{t(e.sq, e.en)}</td></tr>)}</tbody>
            </table>{res.rejected > res.errors.length && <p className="note">{t(`Shfaqen ${res.errors.length} të parët.`, `Showing the first ${res.errors.length}.`)}</p>}</div>
          )}
        </div>
      )}
    </section>
  )
}
