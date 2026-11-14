import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ZoneMap, { type Marker } from '../components/ZoneMap'
import { PageHead, Stat } from '../components/ui'
import { DEVICES, DIFFS, DMA, FORMULAS, SUBZONES, WEAKNESSES } from '../dma'
import { fmt, useApp } from '../state'

function FitDevices() {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.fitBounds(L.latLngBounds(DEVICES.map(d => [d.lat, d.lon] as [number, number])), { padding: [60, 60] }), 0)
    return () => clearTimeout(id)
  }, [map])
  return null
}

const DEV_HEX: Record<string, string> = { 'MP-0': '#0EA5C6', 'MP-1': '#0EA5C6', 'MP-2': '#0EA5C6', 'LS-1': '#1468B0', 'UMZ-NZ5': '#0E9F6E' }

export default function SubzonesPage() {
  const { t } = useApp()
  const markers: Marker[] = DEVICES.map(d => ({ key: d.code, lat: d.lat, lon: d.lon, color: DEV_HEX[d.code], r: 9, ring: true,
    label: `${d.code} · ${d.where}`, popup: <><b>{d.code}</b><br />{d.where}<br />{d.type}</> }))
  const total = SUBZONES.reduce((s, z) => ({ houses: s.houses + z.houses, m3d: s.m3d + z.m3d }), { houses: 0, m3d: 0 })
  const press = SUBZONES.map(z => ({ id: z.id, p35: z.p35, prv: z.prv, low: z.low }))

  return (
    <div className="page">
      <PageHead title={t('Nënzonat dhe matja', 'Sub-zones and metering')}
        lead={t('Një DMA, 5 nënzona të matura dhe 18 zona presioni 3–5 bar. Ujëmatës në kaskadë: konsumi i çdo nënzone del me zbritje, me vetëm 4 matës të rinj.',
          'One DMA, 5 metered sub-zones and 18 pressure zones at 3–5 bar. Meters in cascade: each sub-zone’s use comes out by subtraction, with only 4 new meters.')} />

      <div className="strip">
        <Stat label={t('Shtëpi të lidhura (GIS)', 'Connected houses (GIS)')} value={fmt(DMA.houses)} />
        <Stat label={t('Nënzona të matura', 'Metered sub-zones')} value={DMA.subzones} />
        <Stat label={t('Zona presioni me PRV', 'Pressure zones with PRV')} value={DMA.pressureZones} />
        <Stat label={t('Shtëpi direkt në 3–5 bar', 'Houses directly at 3–5 bar')} value={DMA.direct35Pct} unit="%" tone="good" />
      </div>

      <section className="panel mt">
        <h2>{t('Harta e rrjetit: DMA Kçiq me 5 nënzona', 'Network map: DMA Kçiq with 5 sub-zones')}</h2>
        <figure className="pdf-fig"><img src="/harta_nenzonat.jpg" alt={t('Harta e 5 nënzonave të DMA Kçiq', 'Map of the 5 sub-zones of DMA Kçiq')} loading="lazy" /></figure>
        <p className="note">{t('Burimi: GIS-i i KRU-së (780 gypa, 615 lidhje DN25, 8 UMZ, 6 PRV, 39 valvula, 48 riparime) dhe SRTM 30 m. GIS-i ka rreth 0,7 km boshllëqe – verifikim në terren para zbatimit.',
          "Source: KRU's GIS (780 pipes, 615 DN25 connections, 8 UMZ, 6 PRV, 39 valves, 48 repairs) and SRTM 30 m. The GIS has about 0.7 km of gaps – field check before construction.")}</p>
      </section>

      <section className="panel mt">
        <h2>{t('Struktura: DMA → 5 nënzona → 18 zona presioni', 'Structure: DMA → 5 sub-zones → 18 pressure zones')}</h2>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>{t('Nënzona', 'Sub-zone')}</th><th className="num">{t('Shtëpi', 'Houses')}</th><th>{t('Zonat e presionit', 'Pressure zones')}</th><th>{t('Matësi në hyrje', 'Inlet meter')}</th><th className="num">m³/{t('ditë', 'day')}</th></tr></thead>
          <tbody>{SUBZONES.map(z => <tr key={z.id}>
            <td><span className="nz-dot" style={{ background: z.color }} /><b>{z.id}</b> {z.name}</td><td className="num">{z.houses}</td>
            <td>{z.zones}</td><td>{z.meter}</td><td className="num">{fmt(z.m3d, 1)}</td></tr>)}</tbody>
          <tfoot><tr><td><b>DMA Kçiq</b></td><td className="num">{total.houses}</td><td>18 {t('zona', 'zones')}</td><td>MP-2 + UMZ 'për Kçiq'</td><td className="num">{fmt(total.m3d)}</td></tr></tfoot>
        </table></div>
        <p className="note">{t('Brenda nënzonave, zonat e presionit kanë vetëm PRV + sensor presioni – pa matës të veçantë. Kjo e mban numrin e matësve të rinj në 4.',
          'Inside the sub-zones, pressure zones have only a PRV and a pressure sensor, no separate meter. That keeps the number of new meters at 4.')}</p>
      </section>

      <div className="grid g-side mt">
        <section className="panel">
          <h2>{t('Skema e matjes: konsumi me zbritje', 'Metering scheme: use by subtraction')}</h2>
          <ul className="formulas">{FORMULAS.map(([a, b]) => <li key={a}><b>{a}</b> = <span>{b}</span></li>)}</ul>
          <h2 className="mt">{t('Si dalin humbjet (NRW)', 'How losses (NRW) come out')}</h2>
          <p className="sub">{t('Uji i matur në hyrje të nënzonës − shuma e ujëmatësve të shtëpive të saj, për të njëjtin muaj. Çdo natë 02:00–04:00 matet rrjedha minimale (MNF) – rritja tregon rrjedhje të reja.',
            "Water measured at the sub-zone inlet − the sum of its house meters, for the same month. Every night 02:00–04:00 the minimum flow (MNF) is measured – a rise shows new leaks.")}</p>
          <ul className="formulas">{DIFFS.map(([a, b]) => <li key={a}><b>{a}</b> → <span>{b}</span></li>)}</ul>
        </section>
        <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <ZoneMap size="tall" markers={markers} showPois={false} showSensors={false} fit={false}><FitDevices /></ZoneMap>
        </section>
      </div>

      <section className="panel mt">
        <h2>{t('Ujëmatësit e prodhimit dhe pajisjet e reja', 'Production meters and new devices')}</h2>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>{t('Kodi', 'Code')}</th><th>{t('Ku vendoset', 'Location')}</th><th>{t('Lloji', 'Type')}</th><th className="num">{t('Koordinatat', 'Coordinates')}</th></tr></thead>
          <tbody>{DEVICES.map(d => <tr key={d.code}><td><b>{d.code}</b></td><td>{d.where}</td><td>{d.type}</td><td className="num">{d.lat.toFixed(5)}, {d.lon.toFixed(5)}</td></tr>)}</tbody>
        </table></div>
        <p className="note">{t('LS-1 i thotë pompës «jam plot» para se uji të dalë nga tejmbushja: nivel i ulët → pompa ndez, nivel i lartë → pompa fik, alarm për operatorin.',
          'LS-1 tells the pump “I’m full” before water spills from the overflow: low level → pump on, high level → pump off, alarm for the operator.')}</p>
      </section>

      <div className="grid g-side mt">
        <section className="panel">
          <h2>{t('Presioni pas projektit, sipas nënzonës', 'Pressure after the project, by sub-zone')}</h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={press} layout="vertical" margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E6ECEB" horizontal={false} />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="id" fontSize={12} width={46} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="p35" stackId="a" name={t('3–5 bar', '3–5 bar')} fill="#0E9F6E" isAnimationActive={false} />
                <Bar dataKey="prv" stackId="a" name={t('PRV shtëpie (> 5 bar)', 'House PRV (> 5 bar)')} fill="#E8A33D" isAnimationActive={false} />
                <Bar dataKey="low" stackId="a" name={t('Nën 3 bar', 'Below 3 bar')} fill="#D7301F" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="note">{t(`${DMA.direct35} shtëpi direkt në 3–5 bar, ${DMA.housePrv} me PRV shtëpie (4 bar), ${DMA.below3} nën 3 bar – zgjidhje lokale.`,
            `${DMA.direct35} houses directly at 3–5 bar, ${DMA.housePrv} with a house PRV (4 bar), ${DMA.below3} below 3 bar – local fix.`)}</p>
        </section>
        <section className="panel">
          <h2>{t('Dobësitë e gjetura në GIS', 'Weaknesses found in the GIS')}</h2>
          <ul className="steps">{WEAKNESSES.map(w => <li key={w}>{w}</li>)}</ul>
          <h2 className="mt">{t('Rrjeti ekzistues mjafton', 'The existing network is enough')}</h2>
          <p className="sub">{t(`${fmt(DMA.mainsKm, 1)} km gypa shpërndarës mbajnë kërkesën e vitit 2045 (v ≤ 1,3 m/s). Problemi nuk është kapaciteti, por presioni dhe matja.`,
            `${fmt(DMA.mainsKm, 1)} km of distribution mains carry the 2045 demand (v ≤ 1.3 m/s). The problem is not capacity but pressure and metering.`)}</p>
        </section>
      </div>
    </div>
  )
}
