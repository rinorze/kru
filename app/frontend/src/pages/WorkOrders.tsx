import { useState } from 'react'
import { api, type WoStatus, type WorkOrder } from '../api'
import { PageHead } from '../components/ui'
import { useApp, useData } from '../state'

const KIND: Record<string, [string, string]> = {
  anomaly: ['Ujëmatës', 'Meter'], suspect: ['Inspektim', 'Inspection'], leak: ['Rrjedhje', 'Leak'], pressure: ['Presion', 'Pressure'], other: ['Tjetër', 'Other'],
}

export default function WorkOrders() {
  const { t, version, bump, toast } = useApp()
  const { data, error, reload } = useData(api.workorders, [version])
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('other')

  const move = async (w: WorkOrder, status: WoStatus) => { await api.patchWorkorder(w.id, { status }); reload(); bump() }
  const del = async (w: WorkOrder) => {
    if (!window.confirm(t(`Fshi urdhrin #${w.id}?`, `Delete order #${w.id}?`))) return
    await api.deleteWorkorder(w.id); reload(); bump()
  }
  const add = async () => {
    try { await api.createWorkorder({ kind, ref: '', title }); setTitle(''); reload(); bump(); toast(t('Urdhri u shtua', 'Order added')) }
    catch (e) { toast((e as Error).message) }
  }
  const cols: { s: WoStatus; sq: string; en: string }[] = [
    { s: 'open', sq: 'Të hapura', en: 'Open' }, { s: 'field', sq: 'Në terren', en: 'In the field' }, { s: 'done', sq: 'Të kryera', en: 'Done' },
  ]
  return (
    <div className="page">
      <PageHead title={t('Urdhrat e punës', 'Work orders')}
        lead={t('Çdo anomali, banesë e dyshimtë, alarm nate ose PRV bëhet urdhër pune. Ruhen në SQLite në server, njësoj si regjistri append-only i KRU-së.',
          'Every anomaly, suspect dwelling, night alarm or PRV becomes a work order. They are stored in SQLite on the server, like KRU\'s append-only log.')}
        actions={<a className="btn" href="/api/export/workorders.csv">{t('Eksporto CSV', 'Export CSV')}</a>} />
      <section className="panel" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <select value={kind} onChange={e => setKind(e.target.value)} style={{ width: 150 }} aria-label={t('Lloji', 'Type')}>
          {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{t(v[0], v[1])}</option>)}
        </select>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('P.sh. Kontrollo valvulën kufitare në rrugën Halil Mustafa', 'E.g. Check the boundary valve on Halil Mustafa street')} style={{ flex: 1, minWidth: 220 }} />
        <button className="btn primary" disabled={title.trim().length < 3} onClick={add}>{t('Shto urdhër', 'Add order')}</button>
      </section>
      {error && <p className="err">{error}</p>}
      <div className="kanban">
        {cols.map(c => {
          const list = (data ?? []).filter(w => w.status === c.s)
          return (
            <div key={c.s} className="col">
              <h3>{t(c.sq, c.en)}<span className="num">{list.length}</span></h3>
              {list.length === 0 && <p className="note">{c.s === 'open' ? t('Asgjë e hapur. Krijoni urdhra nga Anomalitë, Faturim ↔ GIS ose Rrjedha e natës.', 'Nothing open. Create orders from Anomalies, Billing ↔ GIS or Night flow.') : '–'}</p>}
              {list.map(w => (
                <article key={w.id} className="wo">
                  <div className="meta">#{w.id} <span className={'tag ' + w.status}>{t(...(KIND[w.kind] ?? KIND.other))}</span> {w.created.replace('T', ' ').slice(0, 16)}</div>
                  <div style={{ marginTop: 4 }}>{w.title}</div>
                  {w.note && <div className="note">{w.note}</div>}
                  <div className="row">
                    {c.s !== 'open' && <button className="btn small" onClick={() => move(w, c.s === 'done' ? 'field' : 'open')}>{t('Kthe', 'Back')}</button>}
                    {c.s !== 'done' && <button className="btn small primary" onClick={() => move(w, c.s === 'open' ? 'field' : 'done')}>{c.s === 'open' ? t('Dërgo në terren', 'Send to field') : t('Shëno të kryer', 'Mark done')}</button>}
                    {w.lat !== null && <a className="btn small" href={`https://www.google.com/maps?q=${w.lat},${w.lon}`} target="_blank" rel="noreferrer">{t('Harta', 'Map')}</a>}
                    <button className="btn small" onClick={() => del(w)}>{t('Fshi', 'Delete')}</button>
                  </div>
                </article>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
