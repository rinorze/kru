import { useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHead, Stat } from '../components/ui'
import { fmt, useApp } from '../state'

// KRU design demand per hour (l/s), DMA_Kciq_rruget_reale.kml, table "3. Oret e prodhimit" (sums to 599 m³/day)
const DESIGN = [3.0, 2.5, 2.3, 2.3, 2.6, 3.9, 7.2, 10.2, 10.5, 9.5, 8.6, 8.2, 8.6, 8.2, 7.2, 6.9, 7.2, 8.2, 9.5, 10.5, 10.2, 8.6, 6.2, 4.1]
// KRU slides, 27.01–30.09.2026: 386,956 m³ in, 116,345 m³ billed over 242 days [MEASURED]
const DAYS = 242
const INPUT_M3D = 386956 / DAYS
const BILLED_M3D = 116345 / DAYS

export default function Day24() {
  const { t } = useApp()
  const [apparent, setApparent] = useState(100) // m³/day, meter under-registration + unbilled use [ESTIMATED]
  const [n1, setN1] = useState(1.0) // FAVAD leakage exponent [ESTIMATED]

  const m = useMemo(() => {
    const dmax = Math.max(...DESIGN)
    const designDay = DESIGN.reduce((s, q) => s + q, 0) * 3.6
    // design night demand (2.3 l/s) is about 3x standard domestic night use, so 01–04 h use 0.7 l/s (Farley 2001) and the rest is rescaled
    const NIGHT = 0.7
    const night = (h: number) => h >= 1 && h <= 4
    const dayShape = DESIGN.reduce((s, q, h) => s + (night(h) ? 0 : q), 0) * 3.6
    const use = DESIGN.map((q, h) => night(h) ? NIGHT : q * (BILLED_M3D - 4 * NIGHT * 3.6) / dayShape) // l/s, sums to billed volume
    const app = DESIGN.map(q => q * apparent / designDay)
    // pressure is highest at night when head loss is lowest (about 15% less at the peak), leakage follows P^N1
    const pf = DESIGN.map(q => Math.pow(1 - 0.15 * (q / dmax) ** 2, n1))
    const realDay = INPUT_M3D - BILLED_M3D - apparent
    const k = realDay / (pf.reduce((s, x) => s + x, 0) * 3.6)
    const leak = pf.map(x => x * k)
    const rows = DESIGN.map((_, h) => ({ h: String(h).padStart(2, '0') + ':00', use: use[h], app: app[h], leak: leak[h], inflow: use[h] + app[h] + leak[h] }))
    const mnf = (rows[2].inflow + rows[3].inflow) / 2
    const legit = (use[2] + use[3]) / 2
    const peak = rows.reduce((a, b) => (b.inflow > a.inflow ? b : a))
    return { rows, realDay, mnf, legit, peak, leakNight: mnf - legit - (app[2] + app[3]) / 2 }
  }, [apparent, n1])

  const pct = (x: number) => fmt(100 * x / INPUT_M3D, 1) + '%'
  return (
    <div className="page">
      <PageHead title={t('Uji në 24 orë', 'Water over 24 hours')}
        lead={t('Sa ujë hyn në Kçiq çdo orë, sa konsumohet dhe sa humbet. Natën konsumi bie pothuajse në zero, por hyrja jo: ajo diferencë është rrjedhja.',
          'How much water enters Kçiq every hour, how much is used and how much is lost. At night use falls almost to zero but the inflow does not: that gap is leakage.')} />

      <div className="strip">
        <Stat label={t('Hyrja në ditë [MATUR]', 'Daily input [MEASURED]')} value={fmt(INPUT_M3D)} unit="m³" delta={t(`${fmt(INPUT_M3D / 86.4, 1)} l/s mesatarisht`, `${fmt(INPUT_M3D / 86.4, 1)} l/s on average`)} />
        <Stat label={t('Faturuar në ditë [MATUR]', 'Billed per day [MEASURED]')} value={fmt(BILLED_M3D)} unit="m³" delta={pct(BILLED_M3D)} tone="good" />
        <Stat label={t('Humbje fizike [VLERËSUAR]', 'Physical loss [ESTIMATED]')} value={fmt(m.realDay)} unit="m³" delta={pct(m.realDay)} tone="bad" />
        <Stat label={t('Rrjedha min. e natës 02–04', 'Min. night flow 02–04')} value={fmt(m.mnf, 1)} unit="l/s" delta={t(`konsum legjitim vetëm ${fmt(m.legit, 1)} l/s`, `legitimate use only ${fmt(m.legit, 1)} l/s`)} tone="bad" />
      </div>

      <section className="panel mt">
        <h2>{t('Profili ditor: hyrja = konsumi + humbjet', 'Daily profile: inflow = use + losses')}</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart data={m.rows} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
              <CartesianGrid stroke="#E6ECEB" vertical={false} />
              <XAxis dataKey="h" fontSize={11} interval={1} />
              <YAxis fontSize={11} unit=" l/s" width={58} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v, n) => [fmt(Number(v), 1) + ' l/s', String(n)]} />
              <ReferenceArea x1="02:00" x2="04:00" fill="#0C2D44" fillOpacity={0.08} label={{ value: 'MNF', fontSize: 11, position: 'insideTop' }} />
              <Area type="monotone" dataKey="leak" stackId="a" name={t('Rrjedhje (humbje fizike)', 'Leakage (physical loss)')} stroke="#B42318" fill="#F03B20" fillOpacity={0.55} isAnimationActive={false} />
              <Area type="monotone" dataKey="app" stackId="a" name={t('Humbje komerciale', 'Commercial loss')} stroke="#9A6200" fill="#FDAE61" fillOpacity={0.7} isAnimationActive={false} />
              <Area type="monotone" dataKey="use" stackId="a" name={t('Konsum i faturuar', 'Billed use')} stroke="#1468B0" fill="#5AB0E8" fillOpacity={0.7} isAnimationActive={false} />
              <Line type="monotone" dataKey="inflow" name={t('Hyrja në zonë', 'Zone inflow')} stroke="#0C2D44" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="legend">
          <span><i className="sw" style={{ background: '#5AB0E8' }} />{t('Konsum i faturuar', 'Billed use')}</span>
          <span><i className="sw" style={{ background: '#FDAE61' }} />{t('Humbje komerciale', 'Commercial loss')}</span>
          <span><i className="sw" style={{ background: '#F03B20' }} />{t('Rrjedhje', 'Leakage')}</span>
          <span><i className="sw line" />{t('Hyrja në zonë', 'Zone inflow')}</span>
        </div>
        <p className="note">{t(`Hyrja dhe faturimi ditor janë mesatare të matura (27.01–30.09.2026, ${DAYS} ditë). Forma orare vjen nga profili i projektit të KRU-së, ndaj kurba është [VLERËSUAR] derisa logger-i i hyrjes të regjistrojë çdo 15 minuta.`,
          `Daily input and billing are measured averages (27.01–30.09.2026, ${DAYS} days). The hourly shape comes from KRU's design profile, so the curve is [ESTIMATED] until the inlet logger records every 15 minutes.`)}</p>
      </section>

      <div className="grid g-side mt">
        <section className="panel">
          <h2>{t('Çdo orë', 'Hour by hour')}</h2>
          <div className="table-wrap"><table className="table compact">
            <thead><tr><th>{t('Ora', 'Hour')}</th><th className="num">{t('Hyrja m³', 'Inflow m³')}</th><th className="num">{t('Konsum m³', 'Use m³')}</th><th className="num">{t('Humbje m³', 'Loss m³')}</th><th className="num">{t('Humbje %', 'Loss %')}</th></tr></thead>
            <tbody>{m.rows.map(r => {
              const lost = (r.leak + r.app) * 3.6
              return <tr key={r.h} className={r.h === '02:00' || r.h === '03:00' ? 'hl' : ''}><td>{r.h}</td><td className="num">{fmt(r.inflow * 3.6, 1)}</td><td className="num">{fmt(r.use * 3.6, 1)}</td><td className="num">{fmt(lost, 1)}</td><td className="num">{fmt(100 * lost / (r.inflow * 3.6))}%</td></tr>
            })}</tbody>
            <tfoot><tr><td>24 h</td><td className="num">{fmt(INPUT_M3D)}</td><td className="num">{fmt(BILLED_M3D)}</td><td className="num">{fmt(INPUT_M3D - BILLED_M3D)}</td><td className="num">{pct(INPUT_M3D - BILLED_M3D)}</td></tr></tfoot>
          </table></div>
        </section>
        <section className="panel">
          <h2>{t('Si lexohet', 'How to read it')}</h2>
          <ul className="steps">
            <li>{t(`Në 02:00–04:00 hyjnë rreth ${fmt(m.mnf, 1)} l/s, por njerëzit përdorin vetëm ${fmt(m.legit, 1)} l/s. Rreth ${fmt(m.leakNight, 1)} l/s janë rrjedhje.`, `At 02:00–04:00 about ${fmt(m.mnf, 1)} l/s flows in but people use only ${fmt(m.legit, 1)} l/s. About ${fmt(m.leakNight, 1)} l/s is leakage.`)}</li>
            <li>{t(`Pika është në ${m.peak.h} me ${fmt(m.peak.inflow, 1)} l/s.`, `The peak is at ${m.peak.h} with ${fmt(m.peak.inflow, 1)} l/s.`)}</li>
            <li>{t('Rrjedhja është më e madhe natën, kur presioni rritet. Ulja e presionit natën me PRV (faza 2) e ul drejtpërdrejt.', 'Leakage is highest at night, when pressure rises. Lowering night pressure with PRVs (phase 2) cuts it directly.')}</li>
          </ul>
          <label className="field">{t('Humbje komerciale [VLERËSUAR]', 'Commercial loss [ESTIMATED]')}<span className="val">{fmt(apparent)} m³/{t('ditë', 'day')}</span>
            <input type="range" min={0} max={250} step={10} value={apparent} onChange={e => setApparent(+e.target.value)} /></label>
          <label className="field">{t('Eksponenti FAVAD N1', 'FAVAD exponent N1')}<span className="val">{fmt(n1, 1)}</span>
            <input type="range" min={0.5} max={1.5} step={0.1} value={n1} onChange={e => setN1(+e.target.value)} /></label>
          <p className="note">{t('Matësat e vjetër (485) dhe llogaritë 0 m³ japin rreth 75–150 m³/ditë. Pjesa tjetër është fizike.', 'Old meters (485) and 0 m³ accounts give about 75–150 m³/day. The rest is physical.')}</p>
        </section>
      </div>
    </div>
  )
}
