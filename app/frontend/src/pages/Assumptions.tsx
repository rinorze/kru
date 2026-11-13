import { useEffect, useState } from 'react'
import { api, type Assumption } from '../api'
import { Loading, PageHead } from '../components/ui'
import { useApp, useData } from '../state'

const SRC: Record<string, [string, string, string]> = {
  census: ['Regjistrimi 2024', '2024 census', 'done'], sourced: ['Me burim', 'Sourced', 'done'], literature: ['Literaturë', 'Literature', 'field'],
  estimate: ['Vlerësim', 'Estimate', 'open'], measured: ['Matur nga KRU', 'Measured by KRU', 'done'], assumption: ['Supozim', 'Assumption', 'open'],
}

export default function Assumptions() {
  const { t, bump, toast, version } = useApp()
  const { data, error } = useData(api.assumptions, [version])
  const [draft, setDraft] = useState<Record<string, string>>({})
  useEffect(() => { if (data) setDraft(Object.fromEntries(Object.entries(data).map(([k, a]) => [k, String(a.v)]))) }, [data])
  if (!data) return <div className="page"><Loading error={error} /></div>

  const changed = Object.entries(draft).filter(([k, v]) => data[k] && Number(v) !== data[k].v && v !== '' && Number.isFinite(Number(v)))
  const save = async () => {
    try {
      await api.putAssumptions(Object.fromEntries(changed.map(([k, v]) => [k, Number(v)])))
      bump(); toast(t('Supozimet u ruajtën dhe analizat u rillogaritën.', 'Assumptions saved and the analysis recalculated.'))
    } catch (e) { toast((e as Error).message) }
  }
  return (
    <div className="page">
      <PageHead title={t('Supozimet e modelit', 'Model assumptions')}
        lead={t('Çdo numër që nuk vjen nga matja është këtu, me burimin e vet. Kur KRU jep të dhënat reale, ndryshoni vlerën: bilanci, rrjedha e natës, presioni dhe objektivat rillogariten. Regjistri i konsumatorëve krijohet një herë dhe nuk ndryshon. Ndryshimet ruhen deri në rinisjen e serverit.',
          'Every number that does not come from measurement is here, with its source. When KRU provides the real data, change the value: the balance, night flow, pressure and targets recalculate. The customer register is generated once and does not change. Changes last until the server restarts.')}
        actions={<button className="btn primary" disabled={!changed.length} onClick={save}>{t(`Ruaj ${changed.length || ''} ndryshime`, `Save ${changed.length || ''} changes`)}</button>} />
      <section className="panel flush">
        <table className="data">
          <thead><tr><th>{t('Supozimi', 'Assumption')}</th><th style={{ width: 150 }}>{t('Vlera', 'Value')}</th><th>{t('Njësia', 'Unit')}</th><th>{t('Burimi', 'Source')}</th></tr></thead>
          <tbody>
            {(Object.entries(data) as [string, Assumption][]).map(([k, a]) => {
              const s = SRC[a.src] ?? [a.src, a.src, 'open']
              return (
                <tr key={k}>
                  <td>{t(a.sq, a.en)}<div className="note">{k}</div></td>
                  <td><input type="number" step="any" value={draft[k] ?? ''} disabled={k === 'connections'} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} aria-label={t(a.sq, a.en)}
                    style={Number(draft[k]) !== a.v ? { borderColor: 'var(--water)', background: 'var(--water-2)' } : undefined} /></td>
                  <td>{a.unit}</td>
                  <td><span className={'tag ' + s[2]}>{t(s[0], s[1])}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
      <p className="note mt">{t('Numri i lidhjeve është i kyçur sepse regjistri i konsumatorëve krijohet një herë prej tij.', 'The number of connections is locked because the customer register is generated once from it.')}</p>
    </div>
  )
}
