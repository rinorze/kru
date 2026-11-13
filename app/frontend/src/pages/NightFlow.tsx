import { useEffect, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { api } from '../api'
import { Loading, PageHead, Stat } from '../components/ui'
import { eur, fmt, useApp, useData } from '../state'

export default function NightFlow() {
  const { t, bump, toast } = useApp()
  const { data: f, error } = useData(api.flows)
  const [leak, setLeak] = useState(3.2)
  const [day, setDay] = useState<number | null>(9)

  useEffect(() => { api.scenario().then(s => { setLeak(s.leak_m3h); setDay(s.leak_start_day) }).catch(() => undefined) }, [])

  const apply = async (l: number, d: number | null) => {
    await api.putScenario({ leak_m3h: l, leak_start_day: d })
    bump()
  }

  if (!f) return <div className="page"><Loading error={error} /></div>
  const hourly = f.hourly.map((q, k) => ({ k, q, label: `${f.days[Math.floor(k / 24)].slice(5)} ${String(k % 24).padStart(2, '0')}:00` }))
  // red only for nights inside an alarm: above the threshold together with the night before or after
  const over = f.mnf.map(m => m > f.threshold)
  const nights = f.mnf.map((m, k) => ({ d: f.days[k].slice(5), m, alarm: over[k] && (over[k - 1] || over[k + 1]) }))

  const createWo = async () => {
    try {
      await api.createWorkorder({ kind: 'leak', ref: 'MNF-' + (f.alarm?.since ?? ''), title: t(`Kërko rrjedhje: rrjedha e natës +${fmt(f.alarm?.extra_m3h ?? 0, 1)} m³/h që nga ${f.alarm?.since}`, `Find leak: night flow +${fmt(f.alarm?.extra_m3h ?? 0, 1)} m³/h since ${f.alarm?.since}`), note: t('Test hap pas hapi me mbyllje valvulash, pastaj korrelator akustik.', 'Step test by closing valves, then an acoustic correlator.') })
      toast(t('Urdhri i punës u krijua', 'Work order created')); bump()
    } catch (e) { toast((e as Error).message) }
  }

  return (
    <div className="page">
      <PageHead title={t('Rrjedha minimale e natës', 'Minimum night flow')}
        lead={t('Mes orës 02:00 dhe 04:00 pothuajse askush nuk përdor ujë, kështu që shumica e rrjedhës së natës është rrjedhje dhe një rritje e qëndrueshme zakonisht do të thotë rrjedhje e re. Metoda vlen vetëm kur furnizimi është 24 orë, siç kërkon neni 18 i Rregullës ARRU 02/2016.',
          'Between 02:00 and 04:00 almost no one uses water, so most night flow is leakage and a lasting rise usually means a new leak. The method only works with 24-hour supply, which ARRU Rule 02/2016 s.18 requires.')} />
      {f.alarm
        ? <div className="callout alarm"><b>{t(`Alarm: rrjedha e natës është mbi pragun që nga ${f.alarm.since}`, `Alarm: night flow above the threshold since ${f.alarm.since}`)}</b>
            {t(`+${fmt(f.alarm.extra_m3h, 1)} m³/h, rreth ${fmt(f.alarm.extra_m3d)} m³ në ditë, ${eur(f.alarm.cost_year)} në vit. Alarmi ndizet pas dy netëve rresht mbi pragun, për të shmangur alarmet e rreme.`,
              `+${fmt(f.alarm.extra_m3h, 1)} m³/h, about ${fmt(f.alarm.extra_m3d)} m³ a day, ${eur(f.alarm.cost_year)} a year. The alarm fires after two nights in a row above the threshold, to avoid false alarms.`)}
            <div style={{ marginTop: 8 }}><button className="btn primary small" onClick={createWo}>{t('Dërgo ekipin e kërkimit të rrjedhjeve', 'Send the leak detection crew')}</button></div></div>
        : <div className="callout ok"><b>{t('Asnjë alarm', 'No alarm')}</b>{t('Rrjedha e natës është brenda pragut.', 'Night flow is within the threshold.')}</div>}

      <div className="strip">
        <Stat label={t('Baza e rrjedhës së natës', 'Night flow baseline')} value={fmt(f.baseline, 1)} unit="m³/h" />
        <Stat label={t('Pragu i alarmit (+10%)', 'Alarm threshold (+10%)')} value={fmt(f.threshold, 1)} unit="m³/h" />
        <Stat label={t('Konsum legjitim i natës', 'Legitimate night use')} value={fmt(f.legit_night, 2)} unit="m³/h" delta={t('779 lidhje × 1,7 l/orë', '779 connections × 1.7 l/h')} />
        <Stat label={t('Rrjedhje natën', 'Night leakage')} value={fmt(f.night_leak_m3h, 1)} unit="m³/h" tone="bad" />
      </div>

      <section className="panel mt">
        <h2>{t('14 ditët e fundit, çdo orë', 'Last 14 days, hourly')}</h2>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={hourly} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#E6ECEB" vertical={false} />
              <XAxis dataKey="k" ticks={hourly.filter(h => h.k % 24 === 0).map(h => h.k)} tickFormatter={k => f.days[Math.floor(k / 24)].slice(5)} fontSize={11} />
              <YAxis fontSize={11} unit=" m³/h" width={70} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={(k) => hourly[Number(k)]?.label} formatter={(v) => [fmt(Number(v), 1) + ' m³/h', t('Hyrja', 'Inlet')]} />
              {f.days.map((_, d) => <ReferenceArea key={d} x1={d * 24 + 2} x2={d * 24 + 4} fill="#102A3A" fillOpacity={0.07} />)}
              <ReferenceLine y={f.threshold} stroke="#B42318" strokeDasharray="4 3" />
              <Line dataKey="q" stroke="#1D6FA5" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="note">{t('Shiritat gri janë dritarja 02:00–04:00. Vija e kuqe është pragu i alarmit.', 'Grey strips are the 02:00–04:00 window. The red line is the alarm threshold.')}</p>
      </section>

      <div className="grid g-side mt">
        <section className="panel">
          <h2>{t('Rrjedha minimale për çdo natë', 'Minimum flow for each night')}</h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <ComposedChart data={nights} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#E6ECEB" vertical={false} />
                <XAxis dataKey="d" fontSize={11} />
                <YAxis fontSize={11} domain={[0, 'auto']} unit=" m³/h" width={70} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => fmt(Number(v), 1) + ' m³/h'} />
                <ReferenceLine y={f.baseline} stroke="#6B7F8C" label={{ value: t('baza', 'baseline'), fontSize: 11, position: 'insideBottomLeft' }} />
                <ReferenceLine y={f.threshold} stroke="#B42318" strokeDasharray="4 3" label={{ value: t('pragu', 'threshold'), fontSize: 11, position: 'insideTopLeft', fill: '#B42318' }} />
                <Bar dataKey="m" isAnimationActive={false}>{nights.map(n => <Cell key={n.d} fill={n.alarm ? '#B42318' : '#1D6FA5'} />)}</Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <h2>{t('Provo një rrjedhje', 'Try a leak')}</h2>
          <p className="sub">{t('Ndrysho rrjedhjen e simuluar dhe shiko si reagon alarmi. Kjo është e njëjta logjikë që do të punojë mbi të dhënat reale të sensorit.', 'Change the simulated leak and watch the alarm respond. The same logic will run on the real sensor data.')}</p>
          <label className="field">{t('Madhësia e rrjedhjes', 'Leak size')}<span className="val">{fmt(leak, 1)} m³/h</span>
            <input type="range" min={0} max={12} step={0.2} value={leak} onChange={e => setLeak(+e.target.value)} onPointerUp={e => apply(+e.currentTarget.value, day)} onKeyUp={e => apply(+e.currentTarget.value, day)} /></label>
          <label className="field">{t('Fillon në ditën', 'Starts on day')}<span className="val">{day ?? '–'}</span>
            <input type="range" min={7} max={12} step={1} value={day ?? 9} onChange={e => setDay(+e.target.value)} onPointerUp={e => apply(leak, +e.currentTarget.value)} onKeyUp={e => apply(leak, +e.currentTarget.value)} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => { setLeak(0); apply(0, day) }}>{t('Pa rrjedhje', 'No leak')}</button>
            <button className="btn" onClick={() => { setLeak(3.2); setDay(9); apply(3.2, 9) }}>{t('Rikthe demon', 'Reset demo')}</button>
          </div>
          <p className="note mt">{t(`Një rrjedhje ${fmt(leak, 1)} m³/h nuk shihet me sy në rrugë, por kushton rreth ${eur(leak * 24 * 365 * 0.25)} në vit me koston e prodhimit. Pa matës hyrjeje ajo zbulohet vetëm kur del në sipërfaqe.`, `A ${fmt(leak, 1)} m³/h leak is invisible on the street but costs about ${eur(leak * 24 * 365 * 0.25)} a year at production cost. Without an inlet meter it is only found when it surfaces.`)}</p>
        </section>
      </div>
    </div>
  )
}
