import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type CustomerDetail } from '../api'
import { fmt, useApp } from '../state'

export default function CustomerDrawer({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { t, toast, bump } = useApp()
  const [c, setC] = useState<CustomerDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [rules, setRules] = useState<Record<string, { sq: string; en: string; why_sq: string; why_en: string }>>({})

  useEffect(() => {
    if (!code) return
    let alive = true
    setC(null); setErr(null)
    api.customer(code).then(d => { if (alive) setC(d) }).catch(e => { if (alive) setErr(e.message) })
    api.anomalies().then(a => { if (alive) setRules(a.rules) }).catch(() => undefined)
    return () => { alive = false }
  }, [code])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  if (!code) return null
  const data = c ? c.months.map((m, k) => ({ m: m.slice(2), [t('Konsumatori', 'Customer')]: c.readings[k], [t('8 fqinjët', '8 neighbours')]: c.peer[k] })) : []
  const rule = c?.anomaly ? rules[c.anomaly.rule] : null

  const createWo = async () => {
    if (!c) return
    try {
      await api.createWorkorder({
        kind: 'anomaly', ref: c.code, lat: c.lat, lon: c.lon,
        title: `${t('Kontrollo ujëmatësin', 'Check the meter')} ${c.code}${rule ? ': ' + t(rule.sq, rule.en) : ''}`,
      })
      toast(t('Urdhri i punës u krijua', 'Work order created'))
      bump()
    } catch (e) { toast((e as Error).message) }
  }

  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={code}>
        <button className="btn small close" onClick={onClose}>{t('Mbyll', 'Close')}</button>
        <h2 style={{ fontSize: 26 }}>{code}</h2>
        {err && <p className="err">{err}</p>}
        {!c && !err && <p className="note">{t('Duke ngarkuar…', 'Loading…')}</p>}
        {c && (
          <>
            <p className="sub">{c.village ?? t('Fshati i panjohur', 'Village unknown')}{c.band && <>, {t('brezi', 'band')} {c.band}, {t('kuota', 'elevation')} {fmt(c.elev, 1)} m</>}</p>
            {c.anomaly && rule && (
              <div className="callout alarm">
                <b>{t(rule.sq, rule.en)}</b>
                {t(rule.why_sq, rule.why_en)} {t('Humbje e vlerësuar', 'Estimated loss')}: <span className="num">{fmt(c.anomaly.lost_m3_month, 1)}</span> m³/{t('muaj', 'month')}.
              </div>
            )}
            <dl className="kv">
              <dt>{t('Mesatarja mujore', 'Monthly average')}</dt><dd>{fmt(c.avg, 1)} m³</dd>
              <dt>{t('Leximi i fundit', 'Last reading')}</dt><dd>{fmt(c.readings[c.readings.length - 1], 1)} m³</dd>
              <dt>{t('Viti i ujëmatësit', 'Meter year')}</dt><dd>{c.meter_year ?? '–'}{c.meter_year !== null && new Date().getFullYear() - c.meter_year > 8 ? ', ' + t('mbi 8 vjet, nën-regjistron', 'over 8 years, under-registers') : ''}</dd>
              <dt>{t('Koordinatat', 'Coordinates')}</dt><dd>{c.lat !== null && c.lon !== null ? `${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}` : t('Pa pikë në GIS', 'No GIS point')}</dd>
            </dl>
            <h3 className="mt">{t('12 muajt e fundit kundrejt 8 fqinjëve më të afërt', 'Last 12 months against the 8 nearest neighbours')}{c.lat === null && <span className="note"> {t('(pa pikë GIS: krahasuar me fshatin)', '(no GIS point: compared with the village)')}</span>}</h3>
            <div style={{ height: 230 }}>
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#E6ECEB" vertical={false} />
                  <XAxis dataKey="m" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} unit=" m³" width={60} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line dataKey={t('Konsumatori', 'Customer')} stroke="#B42318" strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />
                  <Line dataKey={t('8 fqinjët', '8 neighbours')} stroke="#6B7F8C" strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
              <button className="btn primary" onClick={createWo}>{t('Krijo urdhër pune', 'Create work order')}</button>
              {c.lat !== null && <a className="btn" href={`https://www.google.com/maps?q=${c.lat},${c.lon}`} target="_blank" rel="noreferrer">{t('Hap në Google Maps', 'Open in Google Maps')}</a>}
            </div>
            <h3>{t('Leximet në terren', 'Field readings')}</h3>
            {c.field_readings.length === 0
              ? <p className="note">{t('Asnjë lexim në terren ende. Lexuesi e shton nga faqja "Lexim në terren".', 'No field readings yet. A reader adds one from the Field reading page.')}</p>
              : <table className="data"><thead><tr><th>{t('Koha', 'Time')}</th><th className="r">m³</th><th>{t('Shënim', 'Note')}</th></tr></thead>
                <tbody>{c.field_readings.map(f => <tr key={f.id}><td>{f.ts.replace('T', ' ')}</td><td className="r num">{fmt(f.reading, 1)}</td><td>{f.note}</td></tr>)}</tbody></table>}
          </>
        )}
      </aside>
    </>
  )
}
