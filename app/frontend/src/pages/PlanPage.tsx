import { useState } from 'react'
import { api } from '../api'
import { Loading, PageHead } from '../components/ui'
import { eur, useApp, useData } from '../state'

export default function PlanPage() {
  const { t } = useApp()
  const { data: p, error } = useData(api.plan)
  const [tier, setTier] = useState<'min' | 'std' | 'adv'>('std')
  if (!p) return <div className="page"><Loading error={error} /></div>
  const lines = p.budget.lines.filter(l => l[tier] > 0)
  const total = lines.reduce((s, l) => s + l[tier], 0)

  return (
    <div className="page">
      <PageHead title={t('Plani i pilotit në 6 muaj', 'The 6-month pilot plan')}
        lead={t('Nga kufiri i zonës deri te raporti për ARRU-në. Çdo hap ka përgjegjësin e vet në KRU dhe në ASEE.', 'From the zone boundary to the report for ARRU. Each step has an owner at KRU and at ASEE.')} />

      <section className="panel">
        <h2>{t('Kalendari', 'Timeline')}</h2>
        <div className="gantt mt">
          <div />
          <div className="months">{[1, 2, 3, 4, 5, 6].map(m => <span key={m}>{t('Muaji', 'Month')} {m}</span>)}</div>
          {p.phases.map(ph => (
            <div key={ph.en} style={{ display: 'contents' }}>
              <div className="step">{t(ph.sq, ph.en)}<small>{ph.who}</small></div>
              <div className="track" title={t(ph.d_sq, ph.d_en)}>
                <div className="barx" style={{ left: `${(ph.m0 / 6) * 100}%`, width: `${((ph.m1 - ph.m0) / 6) * 100}%` }}>{t(ph.d_sq, ph.d_en)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel mt flush">
        <table className="data">
          <thead><tr><th>{t('Treguesi', 'Indicator')}</th><th className="r">{t('Sot', 'Today')}</th><th className="r">{t('Muaji 6', 'Month 6')}</th><th className="r">{t('Muaji 12', 'Month 12')}</th></tr></thead>
          <tbody>{p.targets.map(x => <tr key={x.en}><td>{t(x.sq, x.en)}</td><td className="r num">{x.base}</td><td className="r num">{x.m6}</td><td className="r num"><b>{x.m12}</b></td></tr>)}</tbody>
        </table>
        {p.targets_note && <p className="note" style={{ padding: '8px 12px', margin: 0 }}>{t(p.targets_note.sq, p.targets_note.en)}</p>}
      </section>

      <h2 className="mt" style={{ marginTop: 28 }}>{t('Buxheti', 'Budget')}</h2>
      <p className="sub">{t(p.budget.note_sq, p.budget.note_en)}</p>
      <div className="tiers" role="group" aria-label={t('Niveli i buxhetit', 'Budget tier')}>
        {p.budget.tiers.map(x => (
          <button key={x.key} aria-pressed={tier === x.key} onClick={() => setTier(x.key)}>
            <span>{t(x.sq, x.en)}</span><b>{eur(x.total)}</b><small>{t(x.d_sq, x.d_en)}</small>
          </button>
        ))}
      </div>
      <section className="panel mt flush">
        <table className="data">
          <thead><tr><th>{t('Zëri', 'Item')}</th><th className="r">€</th><th>{t('Baza e çmimit', 'Price basis')}</th></tr></thead>
          <tbody>
            {lines.map(l => <tr key={l.en}><td>{t(l.sq, l.en)}</td><td className="r num">{eur(l[tier])}</td><td><span className={'tag ' + (l.basis === 'sourced' ? 'done' : 'open')}>{l.basis === 'sourced' ? t('me burim', 'sourced') : t('vlerësim', 'estimate')}</span></td></tr>)}
            <tr><td><b>{t('Gjithsej', 'Total')}</b></td><td className="r num"><b>{eur(total)}</b></td><td /></tr>
          </tbody>
        </table>
      </section>

      <div className="grid g2 mt">
        <section className="panel">
          <h2>{t('Komunikimi i sensorëve', 'Sensor communications')}</h2>
          <p style={{ fontSize: 14 }}>{t(p.comms.sq, p.comms.en)}</p>
        </section>
        <section className="panel">
          <h2>{t('Raste të ngjashme', 'Comparable cases')}</h2>
          {p.cases.map(c => (
            <div key={c.place} style={{ marginBottom: 12 }}>
              <h3 style={{ marginBottom: 2 }}>{c.place}, {c.year}</h3>
              <p style={{ margin: 0, fontSize: 14 }}>{t(c.sq, c.en)} <a href={c.url} target="_blank" rel="noreferrer">{t('Burimi', 'Source')}</a></p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
