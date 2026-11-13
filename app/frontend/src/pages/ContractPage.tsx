import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import ContractDoc from '../components/ContractDoc'
import { Loading } from '../components/ui'
import { useApp, useData } from '../state'

export default function ContractPage() {
  const { number = '' } = useParams()
  const { t, toast } = useApp()
  const fresh = (useLocation().state as { fresh?: boolean } | null)?.fresh
  const [params] = useSearchParams()
  const key = params.get('k') ?? ''
  const { data: k, error } = useData(() => api.contract(number, key), [number, key])
  const [copied, setCopied] = useState(false)

  if (!k) return <div className="page"><Loading error={error} /></div>
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { toast(window.location.href) }
  }

  return (
    <div className="page">
      <div className="no-print">
        {fresh && <div className="callout ok"><b>{t('Kontrata u nënshkrua dhe u ruajt', 'Contract signed and saved')}</b>
          {t(`Kodi juaj i konsumatorit është ${k.customer_code}. Ruajeni lidhjen e kësaj faqeje: vetëm me të shihet kontrata e plotë.`, `Your customer code is ${k.customer_code}. Keep the link to this page: only it shows the full contract.`)}</div>}
        {!k.full && <div className="callout"><b>{t('Pamje publike', 'Public view')}</b>
          {t('Numri personal dhe nënshkrimi fshihen. Kontrata e plotë hapet vetëm me lidhjen që merr konsumatori pas nënshkrimit.', 'The personal number and signature are hidden. The full contract opens only with the link the customer receives after signing.')}</div>}
        <div className="contract-bar">
          <span className={'verify ' + (k.verified ? 'ok' : 'bad')}>
            {k.verified ? t('Integriteti u verifikua: kontrata nuk është ndryshuar', 'Integrity verified: the contract has not been changed')
              : t('Kujdes: gjurma nuk përputhet', 'Warning: the fingerprint does not match')}
          </span>
          <div className="actions">
            <button className="btn primary" onClick={() => window.print()}>{t('Shtyp ose ruaj PDF', 'Print or save as PDF')}</button>
            <button className="btn" onClick={copy}>{copied ? t('Lidhja u kopjua', 'Link copied') : t('Kopjo lidhjen', 'Copy link')}</button>
            <Link className="btn" to="/kontratat">{t('Të gjitha kontratat', 'All contracts')}</Link>
            {k.building && <Link className="btn" to="/harta">{t('Shiko në hartë', 'View on the map')}</Link>}
          </div>
        </div>
      </div>
      <ContractDoc k={k} />
    </div>
  )
}
