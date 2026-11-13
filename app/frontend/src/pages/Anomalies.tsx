import { useState } from 'react'
import { api, type Rule } from '../api'
import CustomerDrawer from '../components/CustomerDrawer'
import ZoneMap from '../components/ZoneMap'
import { Loading, PageHead, Stat } from '../components/ui'
import { eur, fmt, useApp, useData } from '../state'

const RULE_COLOR: Record<Rule, string> = { zero: '#B42318', drop: '#9A6200', peer: '#5B2AA6', spike: '#1D6FA5' }

export default function Anomalies() {
  const { t, bump, toast } = useApp()
  const { data: a, error } = useData(api.anomalies)
  const [rule, setRule] = useState<Rule | ''>('')
  const [code, setCode] = useState<string | null>(null)
  if (!a) return <div className="page"><Loading error={error} /></div>
  const rows = a.rows.filter(r => !rule || r.rule === rule).sort((x, y) => y.lost_m3_month - x.lost_m3_month)

  const createAll = async () => {
    let n = 0
    for (const r of rows) {
      try {
        await api.createWorkorder({ kind: 'anomaly', ref: r.code, lat: r.lat, lon: r.lon, title: `${t('Kontrollo ujëmatësin', 'Check the meter')} ${r.code}: ${t(a.rules[r.rule].sq, a.rules[r.rule].en)}` })
        n++
      } catch { /* duplicate open order */ }
    }
    toast(t(`${n} urdhra pune u krijuan`, `${n} work orders created`)); bump()
  }

  return (
    <div className="page">
      <PageHead title={t('Gjuetari i anomalive', 'Anomaly hunter')}
        lead={t('Katër rregulla të thjeshta mbi 12 muaj lexime gjejnë ujëmatësit që duhen kontrolluar. Çdo rregull ka arsyen e vet, kështu që lexuesi e di çfarë të kërkojë në terren.',
          'Four simple rules over 12 months of readings find the meters to check. Each rule states its reason, so the reader knows what to look for on site.')}
        actions={<>
          <a className="btn" href="/api/export/anomalies.csv">{t('Eksporto CSV', 'Export CSV')}</a>
          <button className="btn primary" onClick={createAll}>{t(`Krijo ${rows.length} urdhra pune`, `Create ${rows.length} work orders`)}</button>
        </>} />
      <div className="strip">
        <Stat label={t('Ujëmatës të shënuar', 'Meters flagged')} value={a.rows.length} />
        <Stat label={t('Ujë i pafaturuar', 'Unbilled water')} value={fmt(a.lost_m3_month)} unit={t('m³/muaj', 'm³/month')} />
        <Stat label={t('Të ardhura të humbura', 'Revenue lost')} value={eur(a.lost_eur_year)} unit={t('/vit', '/yr')} tone="bad" />
      </div>
      <div className="grid g4 mt">
        {(Object.keys(a.rules) as Rule[]).map(k => (
          <button key={k} className="panel" style={{ textAlign: 'left', cursor: 'pointer', borderColor: rule === k ? RULE_COLOR[k] : undefined, borderWidth: rule === k ? 2 : 1 }}
            aria-pressed={rule === k} onClick={() => setRule(rule === k ? '' : k)}>
            <span className="chip"><span className="dot" style={{ background: RULE_COLOR[k] }} /><b className="num" style={{ fontSize: 22 }}>{a.by_rule[k] ?? 0}</b></span>
            <h3 style={{ marginTop: 6 }}>{t(a.rules[k].sq, a.rules[k].en)}</h3>
            <p className="note" style={{ margin: 0 }}>{t(a.rules[k].why_sq, a.rules[k].why_en)}</p>
          </button>
        ))}
      </div>
      <div className="grid g-side mt">
        <section className="panel flush scroll">
          <table className="data">
            <thead><tr><th>{t('Kodi', 'Code')}</th><th>{t('Rregulli', 'Rule')}</th><th>{t('Fshati', 'Village')}</th><th className="r">{t('I fundit', 'Last')}</th><th className="r">{t('Pritej', 'Expected')}</th><th className="r">{t('Humbje m³/muaj', 'Loss m³/month')}</th><th className="r">{t('Ujëmatësi', 'Meter')}</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.code} className="click" onClick={() => setCode(r.code)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setCode(r.code) }}>
                  <td><b>{r.code}</b></td>
                  <td><span className={'tag ' + r.rule}>{t(a.rules[r.rule].sq, a.rules[r.rule].en)}</span></td>
                  <td>{r.village}</td>
                  <td className="r num">{fmt(r.last, 1)}</td><td className="r num">{fmt(r.expected, 1)}</td><td className="r num"><b>{fmt(r.lost_m3_month, 1)}</b></td>
                  <td className="r num">{r.meter_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <ZoneMap size="short" showSensors={false} markers={rows.filter(r => r.lat !== null && r.lon !== null).map(r => ({ key: r.code, lat: r.lat!, lon: r.lon!, color: RULE_COLOR[r.rule], r: 6, ring: true, label: r.code, onClick: () => setCode(r.code) }))} />
      </div>
      <CustomerDrawer code={code} onClose={() => setCode(null)} />
    </div>
  )
}
