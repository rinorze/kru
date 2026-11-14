import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { Polygon, Tooltip, useMap } from 'react-leaflet'
import ZoneMap, { type Marker } from '../components/ZoneMap'
import { PageHead, Seg } from '../components/ui'
import { fmt, useApp } from '../state'

interface Z { id: string; street: string; village: string; connections: number; elev_min: number; elev_max: number; supply: string
  hgl: number; p_min: number; p_max: number; in_3_5: number; house_prv: number; demand_m3d: number; polygon: [number, number][] }
interface ZData { source: string; zones: Z[]; consumers: [string, number, number, number, number][] }

// fixed breaks tied to the ARRU corridor (1.5–7 bar), so the 7 bar limit is always a class edge
export const P_CLASSES = [
  { lo: 0, hi: 5, hex: '#4575B4', sq: '1.5–5 bar · objektiv', en: '1.5–5 bar · target' },
  { lo: 5, hi: 7, hex: '#91BFDB', sq: '5–7 bar · brenda kufirit', en: '5–7 bar · within limit' },
  { lo: 7, hi: 9, hex: '#FDAE61', sq: '7–9 bar · mbi 7 bar', en: '7–9 bar · above 7 bar' },
  { lo: 9, hi: 11, hex: '#F03B20', sq: '9–11 bar · shumë i lartë', en: '9–11 bar · very high' },
  { lo: 11, hi: 99, hex: '#BD0026', sq: '≥ 11 bar · rrezik plasjeje', en: '≥ 11 bar · burst risk' },
]
const pClass = (p: number) => P_CLASSES.find(c => p < c.hi) ?? P_CLASSES[P_CLASSES.length - 1]

// leakage risk 0–100: pressure exposure (FAVAD, N1 = 1), connection count, share above 7 bar, minus household PRVs
function risk(z: Z, n7: number) {
  const pAvg = (z.p_min + z.p_max) / 2
  const raw = 0.45 * Math.min(pAvg / 10, 1) + 0.25 * Math.min(z.connections / 120, 1) + 0.3 * (n7 / Math.max(z.connections, 1))
  return Math.round(100 * raw * (1 - 0.5 * z.house_prv / Math.max(z.connections, 1)))
}
const R_CLASSES = [
  { hi: 20, hex: '#FEF0D9', sq: '0–20 i ulët', en: '0–20 low' },
  { hi: 40, hex: '#FDCC8A', sq: '20–40', en: '20–40' },
  { hi: 60, hex: '#FC8D59', sq: '40–60', en: '40–60' },
  { hi: 80, hex: '#E34A33', sq: '60–80', en: '60–80' },
  { hi: 101, hex: '#B30000', sq: '80–100 i lartë', en: '80–100 high' },
]
const rClass = (r: number) => R_CLASSES.find(c => r < c.hi) ?? R_CLASSES[R_CLASSES.length - 1]

// opens on the 19 zones instead of the whole cadastral area (runs after the map's own fit)
function FitZones({ zones }: { zones: Z[] }) {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.fitBounds(L.latLngBounds(zones.flatMap(z => z.polygon)), { padding: [24, 24] }), 0)
    return () => clearTimeout(id)
  }, [zones, map])
  return null
}

export default function ZonesPage() {
  const { t } = useApp()
  const [d, setD] = useState<ZData | null>(null)
  const [view, setView] = useState<'pressure' | 'risk'>('pressure')
  const [pts, setPts] = useState(true)
  useEffect(() => { fetch('/zones.json').then(r => r.json()).then(setD).catch(() => undefined) }, [])

  const rows = useMemo(() => {
    if (!d) return []
    return d.zones.map(z => {
      const cs = d.consumers.filter(c => c[0] === z.id)
      const n7 = cs.filter(c => c[4] > 7).length
      return { ...z, n7, n9: cs.filter(c => c[4] > 9).length, risk: risk(z, n7) }
    }).sort((a, b) => b.risk - a.risk)
  }, [d])

  if (!d) return <div className="page"><p className="sub">{t('Duke ngarkuar zonat…', 'Loading zones…')}</p></div>
  const markers: Marker[] = pts ? d.consumers.map(c => ({ key: c[0] + c[1] + c[2], lat: c[1], lon: c[2], r: 2.6, color: pClass(c[4]).hex,
    label: `${c[0]} · ${fmt(c[3])} m · ${fmt(c[4], 1)} bar` })) : []
  const counts = P_CLASSES.map(c => d.consumers.filter(x => x[4] >= c.lo && x[4] < c.hi).length)
  const legend = view === 'pressure' ? P_CLASSES.map((c, k) => ({ hex: c.hex, label: t(c.sq, c.en), n: counts[k] }))
    : R_CLASSES.map(c => ({ hex: c.hex, label: t(c.sq, c.en), n: rows.filter(r => rClass(r.risk) === c).length }))
  const total = rows.reduce((s, r) => s + r.connections, 0)

  return (
    <div className="page">
      <PageHead title={t('Harta tematike e zonave të presionit', 'Thematic map of the pressure zones')}
        lead={<>{t('Presioni statik i çdo pike konsumatori, nga modeli i rrugëve reale (KML, 19 zona, 1 040 pika). Zonat e kuqe janë ku duhet të shkojnë PRV-të e para. Struktura finale e projektit, 5 nënzona dhe 18 zona presioni, është te ', "Static pressure at every consumer point, from the real-roads model (KML, 19 zones, 1,040 points). Red zones are where the first PRVs go. The project's final structure, 5 sub-zones and 18 pressure zones, is on ")}<Link to="/nenzonat">{t('Nënzonat dhe matja', 'Sub-zones and metering')}</Link>.</>}
        actions={<a className="btn" href="/Kciq_zonat_tematike.kmz" download>{t('Shkarko për Google Earth', 'Download for Google Earth')}</a>} />

      <div className="map-tools">
        <Seg label={t('Ngjyra sipas', 'Colour by')} value={view} onChange={setView}
          options={[{ v: 'pressure', label: t('Presioni maks.', 'Max pressure') }, { v: 'risk', label: t('Rreziku', 'Risk index') }]} />
        <label className="check"><input type="checkbox" checked={pts} onChange={e => setPts(e.target.checked)} /> {t(`Konsumatorët (${d.consumers.length})`, `Consumers (${d.consumers.length})`)}</label>
      </div>

      <section className="panel thematic">
        <ZoneMap size="tall" markers={markers} showPois={false} fit={false}>
          <FitZones zones={d.zones} />
          {rows.map(z => {
            const fill = view === 'pressure' ? pClass(z.p_max).hex : rClass(z.risk).hex
            return <Polygon key={z.id} positions={z.polygon} pathOptions={{ color: '#fff', weight: 1.5, fillColor: fill, fillOpacity: pts ? 0.35 : 0.65 }}>
              <Tooltip sticky><b>{z.id}</b> · {z.street}<br />{fmt(z.connections)} {t('lidhje', 'connections')} · {fmt(z.p_min, 1)}–{fmt(z.p_max, 1)} bar<br />{t('Rreziku', 'Risk')} {z.risk}/100</Tooltip>
            </Polygon>
          })}
        </ZoneMap>
        <div className="th-legend" aria-label={t('Legjenda', 'Legend')}>
          <b>{view === 'pressure' ? t('Presioni statik (bar)', 'Static pressure (bar)') : t('Indeksi i rrezikut (0–100)', 'Risk index (0–100)')}</b>
          <ul>{legend.map(l => <li key={l.label}><i style={{ background: l.hex }} />{l.label}<span className="num">{l.n}{view === 'pressure' ? '' : ' z'}</span></li>)}</ul>
          <small>{view === 'pressure' ? t('Numri = pika konsumatori. Kufiri ARRU: 7 bar.', 'Count = consumer points. ARRU limit: 7 bar.')
            : t('Pesha: presioni 45%, lidhjet 25%, pikat mbi 7 bar 30%, minus PRV shtëpiake.', 'Weights: pressure 45%, connections 25%, points above 7 bar 30%, minus household PRVs.')}</small>
          <small>{t('Burimi: KRU, DMA_Kciq_rruget_reale.kml (OSM + SRTM 30 m). [VLERËSUAR]', 'Source: KRU, DMA_Kciq_rruget_reale.kml (OSM + SRTM 30 m). [ESTIMATED]')}</small>
        </div>
      </section>

      <section className="panel mt">
        <h2>{t('Renditja e zonave për testin hap pas hapi', 'Zone ranking for step testing')}</h2>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>#</th><th>{t('Zona', 'Zone')}</th><th>{t('Fshati', 'Village')}</th><th className="num">{t('Lidhje', 'Conn.')}</th><th className="num">{t('Presioni (bar)', 'Pressure (bar)')}</th><th className="num">&gt; 7 bar</th><th className="num">&gt; 9 bar</th><th className="num">PRV</th><th className="num">m³/{t('ditë', 'day')}</th><th className="num">{t('Rreziku', 'Risk')}</th></tr></thead>
          <tbody>{rows.map((z, k) => <tr key={z.id}>
            <td className="num">{k + 1}</td><td><b>{z.id}</b> <span className="muted">{z.street}</span></td><td>{z.village}</td>
            <td className="num">{fmt(z.connections)}</td><td className="num">{fmt(z.p_min, 1)}–{fmt(z.p_max, 1)}</td>
            <td className="num">{z.n7}</td><td className="num">{z.n9}</td><td className="num">{z.house_prv}</td><td className="num">{fmt(z.demand_m3d)}</td>
            <td className="num"><span className="risk-chip" style={{ background: rClass(z.risk).hex, color: z.risk >= 60 ? '#fff' : '#3a2a00' }}>{z.risk}</span></td>
          </tr>)}</tbody>
          <tfoot><tr><td /><td colSpan={2}>{t('Gjithsej', 'Total')}</td><td className="num">{fmt(total)}</td><td colSpan={6} /></tr></tfoot>
        </table></div>
        <p className="note">{t('Presionet janë nga modeli hidraulik i KRU-së me HGL të supozuar 575 m në hyrje M-0 [VLERËSUAR]; matësit e presionit në pilot do t’i zëvendësojnë me vlera të matura.',
          "Pressures come from KRU's hydraulic model with an assumed inlet HGL of 575 m at M-0 [ESTIMATED]; the pilot's pressure loggers will replace them with measured values.")}</p>
      </section>
    </div>
  )
}
