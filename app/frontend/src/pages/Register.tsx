import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FieldError, api, type BuildingDetail, type RegistrationIn, type UseType, type Village } from '../api'
import SignaturePad from '../components/SignaturePad'
import { PageHead, Seg } from '../components/ui'
import { fmt, useApp } from '../state'

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

type Form = Omit<RegistrationIn, 'lang'>

export default function Register() {
  const { t, lang, bump } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState<Form>({
    full_name: '', personal_no: '', phone: '', email: '', village: 'Kçiq i Madh', address: '', building: params.get('ndertesa') ?? '',
    use_type: 'household', persons: 1, start_date: today(), accept_terms: false, accept_data: false, signature: '',
  })
  const [bad, setBad] = useState<Set<string>>(new Set())
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [bld, setBld] = useState<BuildingDetail | null>(null)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF(x => ({ ...x, [k]: v })); setBad(b => { const n = new Set(b); n.delete(k); return n }) }

  // a building from the map fixes the village and shows what is known about it
  useEffect(() => {
    const ref = f.building.trim()
    if (!/^B-?\d+$/i.test(ref)) { setBld(null); return }
    let alive = true
    const id = window.setTimeout(() => api.building(ref).then(b => { if (alive) { setBld(b); setF(x => ({ ...x, village: b.village })) } })
      .catch(() => { if (alive) setBld(null) }), 250)
    return () => { alive = false; window.clearTimeout(id) }
  }, [f.building])

  const check = () => {
    const b = new Set<string>()
    if (f.full_name.trim().split(/\s+/).length < 2) b.add('full_name')
    if (!/^\d{10}$/.test(f.personal_no)) b.add('personal_no')
    if (!/^\+?[0-9 ]{8,18}$/.test(f.phone.trim())) b.add('phone')
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) b.add('email')
    if (f.address.trim().length < 3) b.add('address')
    if (f.building.trim() && !/^B-?\d+$/i.test(f.building.trim())) b.add('building')
    if (f.start_date < today()) b.add('start_date')
    if (!f.accept_terms) b.add('accept_terms')
    if (!f.accept_data) b.add('accept_data')
    if (!f.signature) b.add('signature')
    return b
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null)
    const b = check()
    setBad(b)
    if (b.size) { setErr(t('Plotësoni fushat e shënuara me të kuqe.', 'Complete the fields marked in red.')); return }
    setBusy(true)
    try {
      const k = await api.createContract({ ...f, full_name: f.full_name.trim(), email: f.email.trim(), phone: f.phone.trim(), building: f.building.trim(), lang })
      bump()
      nav(`/kontrata/${k.number}?k=${k.access}`, { state: { fresh: true } })
    } catch (x) {
      if (x instanceof FieldError) { setBad(new Set(x.fields)); setErr(t('Disa fusha nuk janë të sakta.', 'Some fields are not valid.')) }
      else setErr((x as Error).message)
    } finally { setBusy(false) }
  }

  const cls = (k: string) => (bad.has(k) ? 'invalid' : undefined)
  const hint = (k: string, sq: string, en: string) => bad.has(k) && <span className="field-err">{t(sq, en)}</span>

  return (
    <div className="page">
      <PageHead title={t('Regjistrohu në KRU Mitrovica', 'Register with KRU Mitrovica')}
        lead={t('Kërkesë për lidhje të re me ujësjellësin. Pas nënshkrimit merrni menjëherë kontratën digjitale dhe kodin e konsumatorit; kontrata ruhet përgjithmonë në regjistrin e KRU-së.',
          'Apply for a new water connection. Once you sign you get the digital contract and your customer code straight away; the contract is kept for good in the KRU register.')}
        actions={<Link className="btn" to="/kontratat">{t('Regjistri i kontratave', 'Contract register')}</Link>} />

      <div className="grid g-side">
        <form className="panel form" onSubmit={submit} noValidate>
          <h2>{t('Të dhënat e konsumatorit', 'Customer details')}</h2>
          <div className="form-grid">
            <label className="field">{t('Emri dhe mbiemri', 'Full name')}
              <input type="text" autoComplete="name" value={f.full_name} onChange={e => set('full_name', e.target.value)} className={cls('full_name')} />
              {hint('full_name', 'Shkruani emrin dhe mbiemrin.', 'Enter a first and last name.')}</label>
            <label className="field">{t('Numri personal', 'Personal number')}
              <input type="text" inputMode="numeric" maxLength={10} value={f.personal_no} onChange={e => set('personal_no', e.target.value.replace(/\D/g, ''))} className={cls('personal_no')} />
              {hint('personal_no', 'Numri personal ka 10 shifra.', 'The personal number has 10 digits.')}</label>
            <label className="field">{t('Telefoni', 'Phone')}
              <input type="tel" autoComplete="tel" placeholder="+383 44 123 456" value={f.phone} onChange={e => set('phone', e.target.value)} className={cls('phone')} />
              {hint('phone', 'Shkruani një numër telefoni, p.sh. +383 44 123 456.', 'Enter a phone number, e.g. +383 44 123 456.')}</label>
            <label className="field">{t('Email (opsional)', 'Email (optional)')}
              <input type="email" autoComplete="email" value={f.email} onChange={e => set('email', e.target.value)} className={cls('email')} />
              {hint('email', 'Adresa e email-it nuk është e saktë.', 'The email address is not valid.')}</label>
          </div>

          <h2 className="mt">{t('Vendi i furnizimit', 'Place of supply')}</h2>
          <div className="form-grid">
            <label className="field">{t('Fshati', 'Village')}
              <select value={f.village} onChange={e => set('village', e.target.value as Village)} disabled={!!bld}>
                <option>Kçiq i Madh</option><option>Kçiq i Vogël</option>
              </select></label>
            <label className="field">{t('Adresa (rruga dhe numri)', 'Address (street and number)')}
              <input type="text" autoComplete="street-address" value={f.address} onChange={e => set('address', e.target.value)} className={cls('address')} />
              {hint('address', 'Shkruani rrugën dhe numrin e shtëpisë.', 'Enter the street and house number.')}</label>
            <label className="field">{t('Ndërtesa në hartë (opsionale)', 'Building on the map (optional)')}
              <input type="text" placeholder="B-120" value={f.building} onChange={e => set('building', e.target.value.toUpperCase())} className={cls('building')} />
              {hint('building', 'Kodi i ndërtesës duket si B-120.', 'A building code looks like B-120.')}
              <span className="note">{bld ? t(`${bld.ref}: ${bld.village}, kuota ${fmt(bld.elev)} m, ${fmt(bld.area)} m², ${bld.customers.length} llogari ekzistuese`, `${bld.ref}: ${bld.village}, ${fmt(bld.elev)} m elevation, ${fmt(bld.area)} m², ${bld.customers.length} existing accounts`)
                : <Link to="/harta">{t('Gjeni ndërtesën në hartë', 'Find the building on the map')}</Link>}</span></label>
            <label className="field">{t('Data e fillimit', 'Start date')}
              <input type="date" min={today()} value={f.start_date} onChange={e => set('start_date', e.target.value)} className={cls('start_date')} />
              {hint('start_date', 'Data nuk mund të jetë në të kaluarën.', 'The date cannot be in the past.')}</label>
          </div>
          <div className="form-grid">
            <div className="field">{t('Shfrytëzimi', 'Use')}
              <div style={{ marginTop: 6 }}><Seg label={t('Shfrytëzimi', 'Use')} value={f.use_type} onChange={v => set('use_type', v as UseType)} options={[
                { v: 'household', label: t('Shtëpiak', 'Household') }, { v: 'commercial', label: t('Komercial', 'Commercial') }, { v: 'institution', label: t('Institucion', 'Institution') }]} /></div></div>
            <label className="field">{t('Persona në ekonomi familjare', 'People in the household')}
              <input type="number" min={1} max={40} value={f.persons} onChange={e => set('persons', Math.max(1, Math.min(40, Number(e.target.value) || 1)))} /></label>
          </div>

          <h2 className="mt">{t('Pëlqimi dhe nënshkrimi', 'Consent and signature')}</h2>
          <label className={'check' + (bad.has('accept_terms') ? ' invalid' : '')}><input type="checkbox" checked={f.accept_terms} onChange={e => set('accept_terms', e.target.checked)} />
            {t('I kam lexuar dhe i pranoj kushtet e furnizimit.', 'I have read and accept the terms of supply.')}</label>
          <label className={'check' + (bad.has('accept_data') ? ' invalid' : '')}><input type="checkbox" checked={f.accept_data} onChange={e => set('accept_data', e.target.checked)} />
            {t('Pajtohem që KRU të përpunojë të dhënat e mia për furnizim dhe faturim.', 'I agree that KRU processes my data for supply and billing.')}</label>
          <SignaturePad onChange={v => set('signature', v)} invalid={bad.has('signature')} />
          {hint('signature', 'Nënshkruani në fushën më sipër.', 'Sign in the field above.')}

          {err && <div className="callout alarm mt" role="alert"><b>{t('Kontrata nuk u ruajt', 'Contract not saved')}</b>{err}</div>}
          <button className="btn primary big-btn mt" type="submit" disabled={busy}>{busy ? t('Duke ruajtur…', 'Saving…') : t('Nënshkruaj dhe ruaj kontratën', 'Sign and save the contract')}</button>
        </form>

        <aside className="panel">
          <h2>{t('Si funksionon', 'How it works')}</h2>
          <ol className="steps">
            <li><b>{t('Plotësoni kërkesën', 'Fill in the application')}</b>{t('Të dhënat personale dhe adresën. Nga harta mund të zgjidhni ndërtesën saktë.', 'Your details and address. You can pick the exact building from the map.')}</li>
            <li><b>{t('Nënshkruani në ekran', 'Sign on screen')}</b>{t('Me gisht në telefon ose tablet, ose me maus.', 'With a finger on a phone or tablet, or with a mouse.')}</li>
            <li><b>{t('Merrni kontratën', 'Get the contract')}</b>{t('Kontrata ka numër, kod konsumatori dhe gjurmë SHA-256. Mund ta shtypni ose ruani si PDF.', 'The contract has a number, a customer code and a SHA-256 fingerprint. You can print it or save it as a PDF.')}</li>
            <li><b>{t('Ekipi vjen në terren', 'A crew comes out')}</b>{t('KRU vendos ujëmatësin dhe e lidh pikën në GIS.', 'KRU installs the meter and links its point in GIS.')}</li>
          </ol>
          <div className="callout mt"><b>{t('Pse ka rëndësi për humbjet', 'Why it matters for losses')}</b>
            {t('Çdo banesë që merr ujë pa kontratë është humbje e dukshme. Harta gjen banesat pa konsumator; ky formular i kthen në klientë që paguajnë.',
              'Every dwelling that takes water without a contract is an apparent loss. The map finds dwellings with no customer; this form turns them into paying customers.')}</div>
          <p className="note">{t('Prototip: kontratat ruhen në bazën lokale të panelit dhe nuk dërgohen në sistemin e faturimit të KRU-së.', 'Prototype: contracts are stored in the panel\'s local database and are not sent to the KRU billing system.')}</p>
        </aside>
      </div>
    </div>
  )
}
