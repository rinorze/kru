import { useEffect, useState } from 'react'
import { api, type CustomerRow } from '../api'
import CustomerDrawer from '../components/CustomerDrawer'
import { PageHead, Seg } from '../components/ui'
import { BAND_HEX, fmt, useApp } from '../state'

export default function Customers() {
  const { t, version } = useApp()
  const [q, setQ] = useState('')
  const [village, setVillage] = useState('')
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [code, setCode] = useState<string | null>(null)
  useEffect(() => {
    const h = window.setTimeout(() => api.customers(q, village).then(r => { setRows(r.rows); setTotal(r.total) }).catch(() => setRows([])), 150)
    return () => window.clearTimeout(h)
  }, [q, village, version])

  return (
    <div className="page">
      <PageHead title={t('Konsumatorët', 'Customers')}
        lead={t('Regjistri i simuluar i faturimit për 779 ekonomi familjare. Çdo konsumator lidhet me një ndërtesë në GIS dhe ka 12 lexime mujore.',
          'The simulated billing register for 779 households. Each customer is linked to a building in GIS and has 12 monthly readings.')} />
      <div className="map-tools">
        <input type="search" placeholder={t('Kërko kodin, p.sh. K-10042', 'Search a code, e.g. K-10042')} value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 280 }} aria-label={t('Kërko', 'Search')} />
        <Seg label={t('Fshati', 'Village')} value={village} onChange={setVillage} options={[{ v: '', label: t('Të dy', 'Both') }, { v: 'Kçiq i Madh', label: 'Kçiq i Madh' }, { v: 'Kçiq i Vogël', label: 'Kçiq i Vogël' }]} />
        <span className="note">{t(`${total} gjetur, shfaqen ${rows.length}`, `${total} found, showing ${rows.length}`)}</span>
      </div>
      <section className="panel flush scroll" style={{ maxHeight: 'calc(100vh - 290px)' }}>
        <table className="data">
          <thead><tr><th>{t('Kodi', 'Code')}</th><th>{t('Fshati', 'Village')}</th><th>{t('Brezi', 'Band')}</th><th className="r">{t('Kuota', 'Elevation')}</th><th className="r">{t('Mesatarja m³/muaj', 'Average m³/month')}</th><th className="r">{t('I fundit', 'Last')}</th><th className="r">{t('Ujëmatësi', 'Meter')}</th><th>{t('Statusi', 'Status')}</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.code} className="click" onClick={() => setCode(r.code)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setCode(r.code) }}>
                <td><b>{r.code}</b></td><td>{r.village}</td>
                <td><span className="chip"><span className="dot" style={{ background: BAND_HEX[r.band] }} />{r.band}</span></td>
                <td className="r num">{fmt(r.elev)} m</td><td className="r num">{fmt(r.avg, 1)}</td><td className="r num">{fmt(r.last, 1)}</td><td className="r num">{r.meter_year}</td>
                <td>{r.rule ? <span className={'tag ' + r.rule}>{t('Anomali', 'Anomaly')}</span> : <span className="tag">{t('Normal', 'Normal')}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">{t('Asnjë konsumator nuk përputhet. Provoni një kod tjetër.', 'No customer matches. Try another code.')}</p>}
      </section>
      <CustomerDrawer code={code} onClose={() => setCode(null)} />
    </div>
  )
}
