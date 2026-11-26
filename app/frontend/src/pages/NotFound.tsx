import { Link } from 'react-router-dom'
import { PageHead } from '../components/ui'
import { useApp } from '../state'

/** Shown for an address the panel does not have (it used to show the overview). */
export default function NotFound() {
  const { t } = useApp()
  return (
    <>
      <PageHead
        title={t('Faqja nuk u gjet', 'Page not found')}
        lead={t('Kjo adresë nuk ekziston në panel. Mund të jetë shtypur gabim ose faqja është zhvendosur.',
          'This address does not exist in the panel. It may be mistyped, or the page has moved.')} />
      <Link className="btn" to="/">{t('Kthehu te pasqyra', 'Back to the overview')}</Link>
    </>
  )
}
