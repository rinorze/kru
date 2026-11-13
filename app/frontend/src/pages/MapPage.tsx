import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GeoJSON } from 'react-leaflet'
import type { Layer } from 'leaflet'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { api, type BuildingDetail } from '../api'
import ZoneMap, { FlyTo, type Marker } from '../components/ZoneMap'
import CustomerDrawer from '../components/CustomerDrawer'
import { PageHead, Seg } from '../components/ui'
import { BAND_HEX, VILLAGE_HEX, fmt, pressureHex, useApp, useData } from '../state'

type Mode = 'band' | 'village' | 'p0' | 'p1'
const PIPE = '#0E5A8A'

/** Tooltip for a pipe from KRU's GIS. Built as DOM text so attribute values from the file are never read as HTML. */
function pipeTip(f: GeoJSON.Feature, layer: Layer) {
  const el = document.createElement('div')
  for (const [k, v] of Object.entries(f.properties ?? {})) {
    if (v === null || v === '') continue
    const row = document.createElement('div')
    row.textContent = `${k}: ${k === 'length_m' ? fmt(Number(v)) + ' m' : String(v)}`
    el.appendChild(row)
  }
  if (el.childElementCount) layer.bindTooltip(el, { sticky: true })
}
const RULE_SQ: Record<string, [string, string]> = {
  zero: ['Lexim zero', 'Zero reading'], drop: ['Rënie e fortë', 'Sharp drop'], peer: ['Nën fqinjët', 'Below neighbours'], spike: ['Rritje e fortë', 'Sharp rise'],
}

export default function MapPage() {
  const { t, buildings, sensors, version, toast } = useApp()
  const [mode, setMode] = useState<Mode>('band')
  const [layers, setLayers] = useState({ network: true, buildings: true, anomalies: true, suspects: true, contracts: true, workorders: true, sensors: true, pois: true })
  const [sel, setSel] = useState<number | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const pr = useData(() => api.pressure({ prv_on: true, prv_set_bar: 3, prv_bands: 'A', capex: 15000 }))
  const an = useData(api.anomalies)
  const mm = useData(api.mismatches)
  const wo = useData(api.workorders)
  const ct = useData(api.contracts)
  const net = useData(api.network)
  const pipes = net.data && net.data.features.length > 0 ? net.data : null
  const side = useRef<HTMLElement>(null)

  const pmap = useMemo(() => new Map(pr.data?.points.map(([i, p0, p1]) => [i, { p0, p1 }]) ?? []), [pr.data])
  const selB = sel !== null ? buildings[sel] : null

  const pick = (i: number | undefined) => {
    if (i === undefined) return
    setSel(i)
    if (window.matchMedia('(max-width: 860px)').matches) window.setTimeout(() => side.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const markers: Marker[] = []
  if (layers.buildings) {
    for (const b of buildings) {
      const p = pmap.get(b.i)
      const color = mode === 'band' ? BAND_HEX[b.band] : mode === 'village' ? VILLAGE_HEX[b.village] : pressureHex(mode === 'p0' ? p?.p0 ?? 0 : p?.p1 ?? 0)
      markers.push({ key: b.id, lat: b.lat, lon: b.lon, color, r: b.area >= 60 ? 3.5 : 2.2, onClick: () => pick(b.i),
        label: `B-${b.i}, ${b.village}, ${fmt(b.elev)} m${p ? `, ${fmt(p.p0, 1)} → ${fmt(p.p1, 1)} bar` : ''}` })
    }
  }
  if (layers.suspects && mm.data) for (const s of mm.data.suspects) markers.push({ key: 's' + s.id, lat: s.lat, lon: s.lon, color: '#5B2AA6', r: 7, ring: true,
    label: t(`${s.id}: banesë ${s.area} m² pa konsumator`, `${s.id}: ${s.area} m² dwelling with no customer`), onClick: () => pick(Number(s.id.slice(2))) })
  if (layers.anomalies && an.data) for (const a of an.data.rows) if (a.lat !== null && a.lon !== null) markers.push({ key: 'a' + a.code, lat: a.lat, lon: a.lon, color: '#B42318', r: 7, ring: true,
    label: `${a.code}: ${t(an.data.rules[a.rule].sq, an.data.rules[a.rule].en)}`, onClick: () => (a.bi !== null ? pick(a.bi) : setCode(a.code)) })
  if (layers.contracts && ct.data) for (const k of ct.data) {
    const b = k.building ? buildings[Number(k.building.slice(2))] : undefined
    if (b) markers.push({ key: 'c' + k.number, lat: b.lat, lon: b.lon, color: '#1E7F4F', r: 7, ring: true, label: `${k.number}, ${k.customer_code}`, onClick: () => pick(b.i) })
  }
  if (layers.workorders && wo.data) for (const w of wo.data) if (w.lat !== null && w.lon !== null && w.status !== 'done')
    markers.push({ key: 'w' + w.id, lat: w.lat, lon: w.lon, color: '#FFFFFF', r: 10, ring: true, label: `#${w.id} ${w.title}` })

  const pLegend = [{ c: '#B5304A', l: '> 7 bar' }, { c: '#E06C3C', l: '6–7 bar' }, { c: '#1D6FA5', l: '2,5–6 bar' }, { c: '#7DB0C9', l: '1,5–2,5 bar' }, { c: '#C9A227', l: '< 1,5 bar' }]
  const legend: Record<Mode, { c: string; l: string }[]> = {
    band: [{ c: BAND_HEX.A, l: t('A: 510–545 m, presion i lartë', 'A: 510–545 m, high pressure') }, { c: BAND_HEX.B, l: t('B: 545–592 m', 'B: 545–592 m') }, { c: BAND_HEX.C, l: t('C: mbi 595 m, me pompë', 'C: above 595 m, pumped') }],
    village: Object.entries(VILLAGE_HEX).map(([l, c]) => ({ c, l })),
    p0: pLegend, p1: pLegend,
  }
  const toggle = (k: keyof typeof layers) => setLayers(l => ({ ...l, [k]: !l[k] }))

  const search = async (e: FormEvent) => {
    e.preventDefault()
    const s = q.trim().toUpperCase()
    const bm = s.match(/^B-?(\d+)$/)
    if (bm) {
      const i = Number(bm[1])
      if (buildings[i]) return pick(i)
    } else if (/^K-\d+$/.test(s)) {
      try {
        const c = await api.customer(s)
        if (c.bi !== null) return pick(c.bi)
        setCode(c.code)  // a meter with no GIS point: show its card instead
        return
      } catch { /* fall through to the message */ }
      const k = ct.data?.find(x => x.customer_code === s)
      if (k?.building) return pick(Number(k.building.slice(2)))
    }
    toast(t(`Nuk u gjet: ${q}. Shkruani p.sh. B-120 ose K-10001.`, `Not found: ${q}. Type e.g. B-120 or K-10001.`))
  }

  return (
    <div className="page">
      <PageHead title={t('Harta GIS e zonës', 'Zone GIS map')}
        lead={t('Kliko çdo ndërtesë për të parë kuotën, presionin, konsumatorët, anomalitë dhe kontratat. Kufiri kadastral 71202012 vjen nga Geoportali i Kosovës, 788 ndërtesat nga OpenStreetMap me kuotë nga EU-DEM.',
          'Click any building to see its elevation, pressure, customers, anomalies and contracts. Cadastral boundary 71202012 from the Kosovo Geoportal, 788 OpenStreetMap buildings with EU-DEM elevation.')}
        actions={<a className="btn" href="/kciq_layers.geojson" download>{t('Shkarko GeoJSON', 'Download GeoJSON')}</a>} />
      <div className="map-tools">
        <form className="map-search" onSubmit={search} role="search">
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Ndërtesa ose konsumatori, p.sh. B-120, K-10001', 'Building or customer, e.g. B-120, K-10001')}
            aria-label={t('Kërko ndërtesë ose konsumator', 'Search for a building or customer')} />
          <button className="btn" type="submit">{t('Gjej', 'Find')}</button>
        </form>
        <Seg label={t('Ngjyrosja', 'Colouring')} value={mode} onChange={setMode} options={[
          { v: 'band', label: t('Brezi', 'Band') }, { v: 'village', label: t('Fshati', 'Village') },
          { v: 'p0', label: t('Presioni tani', 'Pressure now') }, { v: 'p1', label: t('Pas PRV', 'After PRV') }]} />
      </div>
      <div className="map-tools layers">
        {([...(pipes ? [['network', t('Rrjeti i tubave', 'Pipe network')] as const] : []), ['buildings', t('Ndërtesat', 'Buildings')], ['anomalies', t('Anomalitë', 'Anomalies')], ['suspects', t('Pa kontratë', 'No contract')],
          ['contracts', t('Kontrata të reja', 'New contracts')], ['workorders', t('Urdhrat e hapur', 'Open orders')], ['sensors', t('Sensorët', 'Sensors')],
          ['pois', t('Objektet publike', 'Public buildings')]] as const).map(([k, l]) => (
          <label key={k} className="check" style={{ margin: 0 }}><input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} />{l}</label>
        ))}
      </div>
      <div className="legend" style={{ marginBottom: 10 }}>
        {legend[mode].map(x => <span key={x.l} className="chip"><span className="dot" style={{ background: x.c }} />{x.l}</span>)}
        <span className="chip"><span className="dot ringed" style={{ background: '#B42318' }} />{t('Anomali', 'Anomaly')}</span>
        <span className="chip"><span className="dot ringed" style={{ background: '#5B2AA6' }} />{t('Banesë pa kontratë', 'Dwelling with no contract')}</span>
        <span className="chip"><span className="dot ringed" style={{ background: '#1E7F4F' }} />{t('Kontratë e re', 'New contract')}</span>
        {pipes && <span className="chip"><span className="line-key" style={{ background: PIPE }} />{t('Tub, nga GIS-i i KRU-së', "Pipe, from KRU's GIS")}</span>}
      </div>
      <div className="map-layout">
        <ZoneMap size="tall" markers={markers} sensors={sensors} showSensors={layers.sensors} showPois={layers.pois} selected={selB}>
          {pipes && layers.network && <GeoJSON key={`net-${version}`} data={pipes} style={{ color: PIPE, weight: 2.5, opacity: 0.85 }} onEachFeature={pipeTip} />}
          {selB && <FlyTo lat={selB.lat} lon={selB.lon} zoom={18} />}
        </ZoneMap>
        <aside className="panel map-side" ref={side} aria-live="polite">
          {sel !== null
            ? <BuildingPanel key={`${sel}-${version}`} refId={`B-${sel}`} onClose={() => setSel(null)} onCustomer={setCode} />
            : <ZoneSummary counts={{ anomalies: an.data?.rows.length, suspects: mm.data?.suspects.length, contracts: ct.data?.length, orders: wo.data?.filter(w => w.status !== 'done').length }} />}
        </aside>
      </div>
      <p className="note">{t('Satelit dhe topografi nga menyja lart djathtas. Vijat me ndërprerje janë zonat kadastrale fqinje. ', 'Satellite and topography are in the menu at the top right. Dashed lines are the neighbouring cadastral zones. ')}
        {pipes ? t(`Rrjeti i tubave vjen nga GIS-i i KRU-së: ${fmt(pipes.features.length)} segmente.`, `The pipe network comes from KRU's GIS: ${fmt(pipes.features.length)} segments.`)
          : <>{t('Rrjeti i tubave nuk është publik: KRU mund ta ngarkojë si GeoJSON te ', 'The pipe network is not public: KRU can upload it as GeoJSON under ')}<Link to="/te-dhenat">{t('Të dhënat e KRU-së', 'KRU data')}</Link>.</>}</p>
      <CustomerDrawer code={code} onClose={() => setCode(null)} />
    </div>
  )
}

function ZoneSummary({ counts }: { counts: Record<'anomalies' | 'suspects' | 'contracts' | 'orders', number | undefined> }) {
  const { t, zone, live, sensors } = useApp()
  if (!zone) return <p className="note">…</p>
  return (
    <>
      <h2>{t('Zona DMA01', 'Zone DMA01')}</h2>
      <p className="sub">{t('Kliko një ndërtesë në hartë ose kërko me kod për detajet e saj.', 'Click a building on the map, or search by code, to see its details.')}</p>
      <table className="data compact">
        <thead><tr><th></th>{Object.keys(zone.villages).map(v => <th key={v} className="r">{v}</th>)}</tr></thead>
        <tbody>
          {([['population', t('Banorë', 'People')], ['households', t('Ekonomi familjare', 'Households')], ['buildings', t('Ndërtesa', 'Buildings')], ['customers', t('Konsumatorë', 'Customers')]] as const).map(([k, l]) => (
            <tr key={k}><td>{l}</td>{Object.values(zone.villages).map((v, n) => <td key={n} className="r num">{fmt(v[k])}</td>)}</tr>
          ))}
          <tr><td>{t('Kuota', 'Elevation')}</td>{Object.values(zone.villages).map((v, n) => <td key={n} className="r num">{fmt(v.elev_min)}–{fmt(v.elev_max)} m</td>)}</tr>
        </tbody>
      </table>
      <h3 className="mt">{t('Brezat e lartësisë', 'Height bands')}</h3>
      <div className="band-row">
        {(['A', 'B', 'C'] as const).map(k => (
          <div key={k}><span className="dot" style={{ background: BAND_HEX[k] }} /> <b>{k}</b> <span className="num">{fmt(zone.bands[k].buildings)}</span> <small>{fmt(zone.bands[k].zmin)}–{fmt(zone.bands[k].zmax)} m</small></div>
        ))}
      </div>
      <h3 className="mt">{t('Në hartë', 'On the map')}</h3>
      <dl className="kv">
        <dt>{t('Anomali faturimi', 'Billing anomalies')}</dt><dd className="num">{counts.anomalies ?? '–'}</dd>
        <dt>{t('Banesa pa kontratë', 'Dwellings with no contract')}</dt><dd className="num">{counts.suspects ?? '–'}</dd>
        <dt>{t('Kontrata të reja', 'New contracts')}</dt><dd className="num">{counts.contracts ?? '–'}</dd>
        <dt>{t('Urdhra pune të hapur', 'Open work orders')}</dt><dd className="num">{counts.orders ?? '–'}</dd>
      </dl>
      <h3 className="mt">{t('Sensorët tani', 'Sensors now')}</h3>
      <dl className="kv">
        {sensors.map(s => <div key={s.id} style={{ display: 'contents' }}><dt>{t(s.sq, s.en)}</dt>
          <dd className="num">{live?.values[s.id] !== undefined ? `${fmt(live.values[s.id], s.kind === 'flow' ? 1 : 2)} ${s.unit}` : '–'}</dd></div>)}
      </dl>
      {live && <p className="note">{t('Përditësuar', 'Updated')} {live.ts.slice(11)}, {live.source === 'measured' ? t('vlera të matura', 'measured values') : t('vlera të simuluara', 'simulated values')}</p>}
    </>
  )
}

function BuildingPanel({ refId, onClose, onCustomer }: { refId: string; onClose: () => void; onCustomer: (c: string) => void }) {
  const { t, toast, bump, kru } = useApp()
  const nav = useNavigate()
  const [b, setB] = useState<BuildingDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    api.building(refId).then(d => { if (alive) setB(d) }).catch(e => { if (alive) setErr(e.message) })
    return () => { alive = false }
  }, [refId])

  if (err) return <p className="err">{err}</p>
  if (!b) return <div className="skeleton-stack"><span /><span /><span /></div>

  const bandName = { A: t('A, presion i lartë', 'A, high pressure'), B: 'B', C: t('C, me pompë', 'C, pumped') }[b.band]
  const register = () => nav(`/regjistrohu?ndertesa=${b.ref}`)
  const order = async () => {
    try {
      await api.createWorkorder({ kind: b.suspect ? 'suspect' : 'other', ref: b.ref, lat: b.lat, lon: b.lon,
        title: b.suspect ? t(`Verifiko banesën ${b.ref} pa kontratë`, `Check dwelling ${b.ref} with no contract`) : t(`Kontroll në ndërtesën ${b.ref}`, `Inspection at building ${b.ref}`) })
      toast(t('Urdhri i punës u krijua', 'Work order created')); bump()
    } catch (e) { toast((e as Error).message) }
  }
  const use = b.months.map((m, k) => ({ m: m.slice(5), v: b.use[k] }))

  return (
    <>
      <div className="side-head">
        <div><h2>{b.ref}</h2><p className="sub" style={{ margin: 0 }}>{b.village}, {t('brezi', 'band')} {bandName}</p></div>
        <button className="btn small" onClick={onClose} aria-label={t('Mbyll detajet', 'Close details')}>✕</button>
      </div>

      <dl className="kv mt">
        <dt>{t('Kuota e terrenit', 'Ground elevation')}</dt><dd className="num">{fmt(b.elev)} m</dd>
        <dt>{t('Sipërfaqja e ndërtesës', 'Building footprint')}</dt><dd className="num">{fmt(b.area)} m²</dd>
        <dt>{t('Niveli hidraulik', 'Hydraulic grade')}</dt><dd className="num">{fmt(b.hgl_m)} m</dd>
        <dt>{t('Koordinatat', 'Coordinates')}</dt><dd className="num">{b.lat.toFixed(5)}, {b.lon.toFixed(5)}</dd>
      </dl>

      <div className="pbox mt">
        <div><small>{t('Presioni tani', 'Pressure now')}</small><b className="num" style={{ color: pressureHex(b.p_now) }}>{fmt(b.p_now, 1)}<i>bar</i></b></div>
        <div aria-hidden>→</div>
        <div><small>{t('Me PRV në 3 bar', 'With PRV at 3 bar')}</small><b className="num" style={{ color: pressureHex(b.p_prv) }}>{fmt(b.p_prv, 1)}<i>bar</i></b></div>
      </div>
      {b.arru === 'over' && <p className="note" style={{ color: 'var(--alarm)' }}>{t('Mbi kufirin 7 bar të Rregullës ARRU 02/2016, neni 17.', 'Above the 7 bar limit of ARRU Rule 02/2016, s.17.')}</p>}
      {b.arru === 'under' && <p className="note" style={{ color: 'var(--warn)' }}>{t('Nën minimumin 1,5 bar të ARRU.', 'Below the ARRU minimum of 1.5 bar.')}</p>}
      <p className="note">{kru?.telemetry.active ? t('Presion statik nga kuota, me nivelin hidraulik të kalibruar nga presioni i natës te loggerët e KRU-së.', "Static pressure from elevation, with the hydraulic grade calibrated from night pressure at KRU's loggers.") : t('Presion statik i modeluar nga kuota; vlerë e vlerësuar.', 'Static pressure modelled from elevation; an estimate.')}</p>

      <h3 className="mt">{t('Konsumatorët', 'Customers')} <span className="note">({b.customers.length})</span></h3>
      {b.customers.length > 0 ? (
        <ul className="plain">
          {b.customers.map(c => (
            <li key={c.code}>
              <button className="linkish" onClick={() => onCustomer(c.code)}>{c.code}</button>
              <span className="num">{fmt(c.avg, 1)} m³/{t('muaj', 'mo')}</span>
              <span className="note">{t('ujëmatës', 'meter')} {c.meter_year}</span>
              {c.rule && <span className={'tag ' + c.rule}>{t(...RULE_SQ[c.rule])}</span>}
              {!c.gis && <span className="tag">{t('pa pikë GIS', 'no GIS point')}</span>}
            </li>
          ))}
        </ul>
      ) : b.contracts.length > 0 ? (
        <div className="callout ok"><b>{t('Regjistruar me kontratë digjitale', 'Registered with a digital contract')}</b>
          {t('Llogaria hapet në faturim pasi ekipi vendos ujëmatësin.', 'The billing account opens once the crew installs the meter.')}</div>
      ) : b.suspect ? (
        <div className="callout warn"><b>{t('Banesë pa kontratë', 'Dwelling with no contract')}</b>
          {t(`${fmt(b.area)} m², konsumatori më i afërt ${fmt(b.suspect.nearest_m)} m larg. Ka gjasa që merr ujë pa faturë.`, `${fmt(b.area)} m², nearest customer ${fmt(b.suspect.nearest_m)} m away. It probably takes water without a bill.`)}</div>
      ) : <p className="note">{t('Asnjë llogari. Ndërtesë e vogël (nën 60 m²), ndoshta ndihmëse.', 'No account. A small building (under 60 m²), probably an outbuilding.')}</p>}

      {b.customers.length > 0 && (
        <div style={{ height: 110 }} className="mt">
          <ResponsiveContainer>
            <BarChart data={use} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="m" fontSize={11} tickLine={false} axisLine={false} interval={1} />
              <Tooltip formatter={(v) => [fmt(Number(v), 1) + ' m³', t('Faturuar', 'Billed')]} />
              <Bar dataKey="v" fill="#1D6FA5" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <p className="note" style={{ margin: 0 }}>{kru?.billing.active ? t('Konsumi i faturuar, 12 muajt e fundit', 'Billed use, last 12 months') : t('Konsumi i faturuar, 12 muajt e fundit (simuluar)', 'Billed use, last 12 months (simulated)')}</p>
        </div>
      )}

      {b.contracts.length > 0 && (<>
        <h3 className="mt">{t('Kontrata digjitale', 'Digital contracts')}</h3>
        <ul className="plain">{b.contracts.map(k => <li key={k.number}><Link to={`/kontrata/${k.number}`}>{k.number}</Link><span>{k.name}</span><span className="note">{k.created.slice(0, 10)}</span></li>)}</ul>
      </>)}

      {b.orders.length > 0 && (<>
        <h3 className="mt">{t('Urdhra pune afër', 'Work orders nearby')}</h3>
        <ul className="plain">{b.orders.map(o => <li key={o.id}><Link to="/urdhrat">#{o.id}</Link><span>{o.title}</span><span className={'tag ' + o.status}>{o.status}</span></li>)}</ul>
      </>)}

      {b.sensors[0] && <p className="note mt">{t('Sensori më i afërt', 'Nearest sensor')}: {b.sensors[0].id.replace('DMA01-', '')}, {fmt(b.sensors[0].distance_m)} m</p>}

      <div className="side-actions">
        <button className="btn primary" onClick={register}>{t('Regjistro konsumator këtu', 'Register a customer here')}</button>
        <button className="btn" onClick={order}>{t('Krijo urdhër pune', 'Create work order')}</button>
        <a className="btn" href={`https://www.google.com/maps?q=${b.lat},${b.lon}`} target="_blank" rel="noreferrer">{t('Navigo', 'Directions')}</a>
      </div>
    </>
  )
}
