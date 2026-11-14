import { Link } from 'react-router-dom'
import { PageHead, Stat } from '../components/ui'
import { DMA, NZ5_CHECKS, NZ5_ZONES, STEPS } from '../dma'
import { fmt, useApp } from '../state'

export default function PilotNz5() {
  const { t } = useApp()
  return (
    <div className="page">
      <PageHead title={t('Piloti: nënzona NZ-5 «Zona e ulët – Jug»', 'Pilot: sub-zone NZ-5 “Low zone – South”')}
        lead={t('Nënzona më e madhe, 214 shtëpi, bëhet DMA e plotë e para: kufi i mbyllur, hyrje e matur, 4 PRV dhe MNF bazë. Pastaj modeli shtrihet në NZ-1 deri NZ-4.',
          'The largest sub-zone, 214 houses, becomes the first full DMA: sealed boundary, metered inlet, 4 PRVs and a baseline MNF. Then the model extends to NZ-1 to NZ-4.')} />

      <div className="strip">
        <Stat label={t('Lidhje', 'Connections')} value="214" delta={t('rekomandimi 100–3000', 'recommended 100–3000')} />
        <Stat label={t('Gypa', 'Mains')} value="15,5" unit="km" delta={t('84 nyje', '84 nodes')} />
        <Stat label={t('PRV të reja', 'New PRVs')} value="4" delta={t('4 zona presioni', '4 pressure zones')} />
        <Stat label={t('Sensorë presioni', 'Pressure sensors')} value="12" delta={t('hyrja, AZP, pika kritike', 'inlet, AZP, critical point')} />
      </div>

      <section className="panel mt">
        <h2>{t('Modeli i nënzonës reale NZ-5', 'Model of the real sub-zone NZ-5')}</h2>
        <figure className="pdf-fig"><img src="/harta_nz5.jpg" alt={t('Harta e nënzonës NZ-5 me 4 zonat e presionit', 'Map of sub-zone NZ-5 with its 4 pressure zones')} loading="lazy" /></figure>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>{t('Zona e presionit', 'Pressure zone')}</th><th className="num">{t('Shtëpi', 'Houses')}</th><th className="num">{t('Lartësia', 'Elevation')}</th><th className="num">HGL</th></tr></thead>
          <tbody>{NZ5_ZONES.map(z => <tr key={z.id}><td><b>{z.id}</b></td><td className="num">{z.houses}</td><td className="num">{z.elev}</td><td className="num">{z.hgl} m</td></tr>)}</tbody>
        </table></div>
      </section>

      <div className="grid g-side mt">
        <section className="panel">
          <h2>{t('NZ-5 i plotëson kushtet e një DMA-je', 'NZ-5 meets the conditions of a DMA')}</h2>
          <ul className="checklist">{NZ5_CHECKS.map(([a, b]) => <li key={a}><span className="ok">✓</span><div><b>{a}</b><p>{b}</p></div></li>)}</ul>
          <div className="callout warn"><b>{t('Për t’u zgjidhur', 'Still to solve')}</b>{t('3 shtëpi nën 3 bar në DMA-13 – lidhje me zonën më të lartë ose pompë shtëpie.', '3 houses below 3 bar in DMA-13 – connect to the higher zone or a house pump.')}</div>
        </section>
        <section className="panel">
          <h2>{t('Rekomandime dhe hapat e radhës', 'Recommendations and next steps')}</h2>
          <ol className="numbered">{STEPS.map(([a, b]) => <li key={a}><b>{a}</b><p>{b}</p></li>)}</ol>
        </section>
      </div>

      <section className="panel mt">
        <h2>{t('Bilanci ditor i projektit', 'Design daily balance')}</h2>
        <div className="strip">
          <Stat label={t(`Konsumi i ${DMA.houses} shtëpive`, `Use of ${DMA.houses} houses`)} value={fmt(DMA.demandM3d)} unit="m³/ditë" />
          <Stat label={t('Prodhimi me NRW 40%', 'Production at 40% NRW')} value={fmt(DMA.production40)} unit="m³/ditë" />
          <Stat label={t('Pompim me 1 pompë KSB (38 l/s)', 'Pumping with 1 KSB pump (38 l/s)')} value={fmt(DMA.pumpHours, 1)} unit={t('orë/ditë', 'h/day')} delta={t('natën', 'at night')} />
          <Stat label={t(`Rezerva e RES_Kçiq (${DMA.reservoir.m3} m³)`, `Reserve of RES_Kçiq (${DMA.reservoir.m3} m³)`)} value={DMA.reserveHours} unit={t('orë', 'h')} />
        </div>
        <p className="note">{t('Vlerat e projektit (120 l/banor/ditë, 4,8 banorë/familje, koef. i orës max 2,0). Krahasoji me hyrjen e matur në faqen ',
          'Design values (120 l/person/day, 4.8 persons/household, peak-hour factor 2.0). Compare with the measured inflow on the page ')}<Link to="/24-oret">{t('Uji në 24 orë', 'Water over 24 h')}</Link>.</p>
      </section>
    </div>
  )
}
