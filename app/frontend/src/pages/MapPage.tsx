import { useMemo, useState } from 'react'
import { api } from '../api'
import ZoneMap, { type Marker } from '../components/ZoneMap'
import CustomerDrawer from '../components/CustomerDrawer'
import { PageHead, Seg } from '../components/ui'
import { BAND_HEX, VILLAGE_HEX, fmt, pressureHex, useApp, useData } from '../state'

type Mode = 'band' | 'village' | 'p0' | 'p1'

export default function MapPage() {
  const { t, buildings, sensors } = useApp()
  const [mode, setMode] = useState<Mode>('band')
  const [layers, setLayers] = useState({ buildings: true, anomalies: true, suspects: true, workorders: true, sensors: true, pois: true })
  const [code, setCode] = useState<string | null>(null)
  const pr = useData(() => api.pressure({ prv_on: true, prv_set_bar: 3, prv_bands: 'A', capex: 15000 }))
  const an = useData(api.anomalies)
  const mm = useData(api.mismatches)
  const wo = useData(api.workorders)

  const pmap = useMemo(() => new Map(pr.data?.points.map(([i, p0, p1]) => [i, { p0, p1 }]) ?? []), [pr.data])

  const markers: Marker[] = []
  if (layers.buildings) {
    for (const b of buildings) {
      const p = pmap.get(b.i)
      const color = mode === 'band' ? BAND_HEX[b.band] : mode === 'village' ? VILLAGE_HEX[b.village] : pressureHex(mode === 'p0' ? p?.p0 ?? 0 : p?.p1 ?? 0)
      markers.push({ key: b.id, lat: b.lat, lon: b.lon, color, r: b.area >= 60 ? 3.5 : 2.2,
        label: `${b.id}, ${b.village}, ${fmt(b.elev)} m${p ? `, ${fmt(p.p0, 1)} → ${fmt(p.p1, 1)} bar` : ''}` })
    }
  }
  if (layers.suspects && mm.data) for (const s of mm.data.suspects) markers.push({ key: 's' + s.id, lat: s.lat, lon: s.lon, color: '#5B2AA6', r: 7, ring: true,
    label: t(`${s.id}: banesë ${s.area} m² pa konsumator`, `${s.id}: ${s.area} m² dwelling with no customer`) })
  if (layers.anomalies && an.data) for (const a of an.data.rows) markers.push({ key: 'a' + a.code, lat: a.lat, lon: a.lon, color: '#B42318', r: 7, ring: true,
    label: `${a.code}: ${t(an.data.rules[a.rule].sq, an.data.rules[a.rule].en)}`, onClick: () => setCode(a.code) })
  if (layers.workorders && wo.data) for (const w of wo.data) if (w.lat !== null && w.lon !== null && w.status !== 'done')
    markers.push({ key: 'w' + w.id, lat: w.lat, lon: w.lon, color: '#FFFFFF', r: 10, ring: true, label: `#${w.id} ${w.title}` })

  const legend: Record<Mode, { c: string; l: string }[]> = {
    band: [{ c: BAND_HEX.A, l: t('A: 510–545 m, presion i lartë', 'A: 510–545 m, high pressure') }, { c: BAND_HEX.B, l: t('B: 545–592 m', 'B: 545–592 m') }, { c: BAND_HEX.C, l: t('C: mbi 595 m, me pompë', 'C: above 595 m, pumped') }],
    village: Object.entries(VILLAGE_HEX).map(([l, c]) => ({ c, l })),
    p0: [{ c: '#B5304A', l: '> 7 bar' }, { c: '#E06C3C', l: '6–7 bar' }, { c: '#1D6FA5', l: '2,5–6 bar' }, { c: '#7DB0C9', l: '1,5–2,5 bar' }, { c: '#C9A227', l: '< 1,5 bar' }],
    p1: [{ c: '#B5304A', l: '> 7 bar' }, { c: '#E06C3C', l: '6–7 bar' }, { c: '#1D6FA5', l: '2,5–6 bar' }, { c: '#7DB0C9', l: '1,5–2,5 bar' }, { c: '#C9A227', l: '< 1,5 bar' }],
  }
  const toggle = (k: keyof typeof layers) => setLayers(l => ({ ...l, [k]: !l[k] }))

  return (
    <div className="page">
      <PageHead title={t('Harta GIS e zonës', 'Zone GIS map')}
        lead={t('Kufiri zyrtar kadastral 71202012 nga Geoportali i Kosovës, 788 ndërtesa nga OpenStreetMap me kuotë nga EU-DEM, dhe tre sensorët e propozuar të presionit.',
          'The official cadastral boundary 71202012 from the Kosovo Geoportal, 788 OpenStreetMap buildings with EU-DEM elevation, and the three proposed pressure sensors.')}
        actions={<a className="btn" href="/kciq_layers.geojson" download>{t('Shkarko GeoJSON', 'Download GeoJSON')}</a>} />
      <div className="map-tools">
        <Seg label={t('Ngjyrosja', 'Colouring')} value={mode} onChange={setMode} options={[
          { v: 'band', label: t('Brezi i lartësisë', 'Height band') }, { v: 'village', label: t('Fshati', 'Village') },
          { v: 'p0', label: t('Presioni tani', 'Pressure now') }, { v: 'p1', label: t('Pas PRV 3 bar', 'After PRV 3 bar') }]} />
        {([['buildings', t('Ndërtesat', 'Buildings')], ['anomalies', t('Anomalitë', 'Anomalies')], ['suspects', t('Pa kontratë', 'No contract')],
          ['workorders', t('Urdhrat e hapur', 'Open orders')], ['sensors', t('Sensorët', 'Sensors')], ['pois', t('Objektet publike', 'Public buildings')]] as const).map(([k, l]) => (
          <label key={k} className="check" style={{ margin: 0 }}><input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} />{l}</label>
        ))}
      </div>
      <div className="legend" style={{ marginBottom: 10 }}>
        {legend[mode].map(x => <span key={x.l} className="chip"><span className="dot" style={{ background: x.c }} />{x.l}</span>)}
        <span className="chip"><span className="dot" style={{ background: '#B42318', boxShadow: '0 0 0 2px #102A3A' }} />{t('Anomali (kliko)', 'Anomaly (click)')}</span>
        <span className="chip"><span className="dot" style={{ background: '#5B2AA6', boxShadow: '0 0 0 2px #102A3A' }} />{t('Banesë pa kontratë', 'Dwelling with no contract')}</span>
      </div>
      <ZoneMap size="tall" markers={markers} sensors={sensors} showSensors={layers.sensors} showPois={layers.pois} />
      <p className="note">{t('Satelit dhe topografi nga menyja lart djathtas. Vijat me ndërprerje janë zonat kadastrale fqinje. Rrjeti i tubave nuk është publik: KRU duhet ta japë nga GIS-i i vet.',
        'Satellite and topography are in the menu at the top right. Dashed lines are the neighbouring cadastral zones. The pipe network is not public: KRU must supply it from its own GIS.')}</p>
      <CustomerDrawer code={code} onClose={() => setCode(null)} />
    </div>
  )
}
