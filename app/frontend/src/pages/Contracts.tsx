import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Loading, PageHead } from '../components/ui'
import { useApp, useData } from '../state'

export default function Contracts() {
  const { t, version } = useApp()
  const nav = useNavigate()
  const { data, error } = useData(api.contracts, [version])
  const [q, setQ] = useState('')
  const USE = { household: t('Shtëpiak', 'Household'), commercial: t('Komercial', 'Commercial'), institution: t('Institucion', 'Institution') }

  const rows = (data ?? []).filter(k => !q || [k.number, k.customer_code, k.full_name, k.building, k.address].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page">
      <PageHead title={t('Regjistri i kontratave', 'Contract register')}
        lead={t('Çdo kontratë e nënshkruar digjitalisht. Regjistri vetëm shton: kontratat nuk ndryshohen dhe nuk fshihen, dhe secila lidhet me gjurmën e kontratës para saj.',
          'Every digitally signed contract. The register only grows: contracts are never changed or deleted, and each is linked to the fingerprint of the one before it.')}
        actions={<Link className="btn primary" to="/regjistrohu">{t('Regjistrim i ri', 'New registration')}</Link>} />
      {!data ? <Loading error={error} /> : (
        <section className="panel flush">
          <div className="table-tools">
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Kërko emër, kod ose numër kontrate', 'Search name, code or contract number')}
              aria-label={t('Kërko kontratë', 'Search contracts')} />
            <span className="note">{rows.length} {t('kontrata', 'contracts')}</span>
          </div>
          {rows.length === 0 ? (
            <div className="empty">
              <p>{data.length === 0 ? t('Ende nuk ka kontrata. Regjistroni konsumatorin e parë.', 'No contracts yet. Register the first customer.') : t('Asnjë kontratë nuk përputhet me kërkimin.', 'No contract matches the search.')}</p>
              {data.length === 0 && <Link className="btn primary" to="/regjistrohu">{t('Regjistrim i ri', 'New registration')}</Link>}
            </div>
          ) : (
            <table className="data responsive">
              <thead><tr>
                <th>{t('Kontrata', 'Contract')}</th><th>{t('Konsumatori', 'Customer')}</th><th>{t('Adresa', 'Address')}</th>
                <th>{t('Shfrytëzimi', 'Use')}</th><th>{t('Data', 'Date')}</th><th>{t('Gjurma', 'Fingerprint')}</th>
              </tr></thead>
              <tbody>
                {rows.map(k => (
                  <tr key={k.number} className="click" onClick={() => nav(`/kontrata/${k.number}`)}>
                    <td data-l={t('Kontrata', 'Contract')}><Link to={`/kontrata/${k.number}`} onClick={e => e.stopPropagation()}>{k.number}</Link><br /><span className="note">{k.customer_code}</span></td>
                    <td data-l={t('Konsumatori', 'Customer')}>{k.full_name}<br /><span className="note num">{k.personal_no}</span></td>
                    <td data-l={t('Adresa', 'Address')}>{k.address}, {k.village}{k.building && <><br /><span className="note">{k.building}</span></>}</td>
                    <td data-l={t('Shfrytëzimi', 'Use')}>{USE[k.use_type]}</td>
                    <td data-l={t('Data', 'Date')} className="num">{k.created.slice(0, 10)}</td>
                    <td data-l={t('Gjurma', 'Fingerprint')}><code className="hash">{k.hash.slice(0, 12)}…</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  )
}
