import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { api } from './api'
import { useApp, useData } from './state'
import Overview from './pages/Overview'
import MapPage from './pages/MapPage'
import BalancePage from './pages/BalancePage'
import NightFlow from './pages/NightFlow'
import PressurePage from './pages/PressurePage'
import Anomalies from './pages/Anomalies'
import Customers from './pages/Customers'
import BillingGis from './pages/BillingGis'
import WorkOrders from './pages/WorkOrders'
import FieldApp from './pages/FieldApp'
import PlanPage from './pages/PlanPage'
import Assumptions from './pages/Assumptions'
import Sources from './pages/Sources'
import Register from './pages/Register'
import ContractPage from './pages/ContractPage'
import Contracts from './pages/Contracts'
import DataPage from './pages/DataPage'
import ZonesPage from './pages/ZonesPage'
import Day24 from './pages/Day24'
import SubzonesPage from './pages/SubzonesPage'
import PilotNz5 from './pages/PilotNz5'

type Item = { to: string; sq: string; en: string; badge?: number | 'alarm' }
type Section = { key: string; sq: string; en: string; icon: ReactNode; items: Item[]; also?: string[] }

const I = (d: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
const ICON = {
  overview: I('M4 13h6V4H4zM14 20h6v-9h-6zM14 4h6v4h-6zM4 20h6v-3H4z'),
  map: I('M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14'),
  losses: I('M12 3c-3.5 5-6 8.2-6 11.5a6 6 0 0 0 12 0C18 11.2 15.5 8 12 3z'),
  billing: I('M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3'),
  field: I('M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'),
  customers: I('M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1.5a4 4 0 0 0-3-3.9M15 4.1a3.5 3.5 0 0 1 0 6.8'),
  pilot: I('M4 20h16M6 16V9M10 16V5M14 16v-6M18 16v-9'),
  more: I('M5 12h.01M12 12h.01M19 12h.01'),
}

function useSections(): Section[] {
  const { version } = useApp()
  const an = useData(api.anomalies)
  const mm = useData(api.mismatches)
  const wo = useData(api.workorders, [version])
  const fl = useData(api.flows)
  const ct = useData(api.contracts, [version])
  const openWo = wo.data?.filter(w => w.status !== 'done').length || undefined
  return [
    { key: 'overview', sq: 'Pasqyra', en: 'Overview', icon: ICON.overview, items: [{ to: '/', sq: 'Pasqyra', en: 'Overview' }] },
    { key: 'map', sq: 'Harta', en: 'Map', icon: ICON.map, items: [{ to: '/nenzonat', sq: 'Nënzonat dhe matja', en: 'Sub-zones and metering' }, { to: '/zonat', sq: 'Zonat e presionit', en: 'Pressure zones' }, { to: '/harta', sq: 'Harta GIS', en: 'GIS map' }] },
    { key: 'losses', sq: 'Humbjet', en: 'Losses', icon: ICON.losses, items: [
      { to: '/24-oret', sq: 'Uji në 24 orë', en: 'Water over 24 h' },
      { to: '/bilanci', sq: 'Bilanci i ujit', en: 'Water balance' },
      { to: '/nata', sq: 'Rrjedha e natës', en: 'Night flow', badge: fl.data?.alarm ? 'alarm' : undefined },
      { to: '/presioni', sq: 'Presioni dhe PRV', en: 'Pressure and PRV' },
    ] },
    { key: 'billing', sq: 'Faturimi', en: 'Billing', icon: ICON.billing, items: [
      { to: '/anomalite', sq: 'Anomalitë', en: 'Anomalies', badge: an.data?.rows.length },
      { to: '/faturim-gis', sq: 'Faturim ↔ GIS', en: 'Billing ↔ GIS', badge: mm.data?.suspects.length },
      { to: '/konsumatoret', sq: 'Konsumatorët', en: 'Customers' },
    ] },
    { key: 'field', sq: 'Terreni', en: 'Field', icon: ICON.field, items: [
      { to: '/urdhrat', sq: 'Urdhrat e punës', en: 'Work orders', badge: openWo },
      { to: '/terreni', sq: 'Lexim në terren', en: 'Field reading' },
    ] },
    { key: 'customers', sq: 'Klientët', en: 'Customers', icon: ICON.customers, also: ['/kontrata/'], items: [
      { to: '/regjistrohu', sq: 'Regjistrohu në KRU', en: 'Register with KRU' },
      { to: '/kontratat', sq: 'Kontratat digjitale', en: 'Digital contracts', badge: ct.data?.length || undefined },
    ] },
    { key: 'pilot', sq: 'Pilot', en: 'Pilot', icon: ICON.pilot, items: [
      { to: '/piloti-nz5', sq: 'Piloti NZ-5', en: 'NZ-5 pilot' },
      { to: '/plani', sq: 'Plani dhe buxheti', en: 'Plan and budget' },
      { to: '/te-dhenat', sq: 'Të dhënat e KRU-së', en: 'KRU data' },
      { to: '/supozimet', sq: 'Supozimet', en: 'Assumptions' },
      { to: '/burimet', sq: 'Burimet', en: 'Sources' },
    ] },
  ]
}

const inSection = (s: Section, path: string) =>
  s.items.some(i => (i.to === '/' ? path === '/' : path === i.to)) || (s.also ?? []).some(p => path.startsWith(p))

/** A section is flagged in the main navigation only for something that needs action, not for counts. */
const sectionFlag = (s: Section) => s.items.some(i => i.badge === 'alarm')

const Badge = ({ b }: { b: Item['badge'] }) =>
  b === undefined ? null : b === 'alarm' ? <span className="flag" aria-label="!" /> : <span className="count">{b}</span>

function Brand() {
  const { t } = useApp()
  return (
    <NavLink to="/" className="brand" aria-label={t('DMA Kçiq, pasqyra', 'DMA Kçiq, overview')}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <path d="M16 3c-4.6 6.6-9 11.3-9 16.2a9 9 0 0 0 18 0C25 14.3 20.6 9.6 16 3z" fill="#5AB0E8" />
        <path d="M8.5 21.5c2.5-1.6 4.6-1.6 7 0s4.6 1.6 8 0" stroke="#0C2D44" strokeWidth="2" fill="none" />
      </svg>
      <span><b>DMA Kçiq</b><small>KRU Mitrovica</small></span>
    </NavLink>
  )
}

function Lang() {
  const { lang, setLang, t } = useApp()
  return (
    <div className="lang" role="group" aria-label={t('Gjuha', 'Language')}>
      <button aria-pressed={lang === 'sq'} onClick={() => setLang('sq')} lang="sq">SQ</button>
      <button aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">EN</button>
    </div>
  )
}

/** One pill instead of a banner on every page: is the panel on KRU's data or on the model, and is it connected. */
function StatusPill() {
  const { t, kru, live, liveOk } = useApp()
  if (live && !liveOk) return <span className="pill bad"><span className="led" />{t('Pa lidhje me serverin', 'No connection to the server')}</span>
  const tel = kru?.telemetry
  const parts: [boolean, string, string][] = [
    [!!kru?.billing.active, 'konsumatorët dhe faturimi', 'customers and billing'],
    [!!tel?.active, 'presionet dhe matësit live', 'pressures and live gauges'],
    [!!tel && tel.flow_days >= 3, 'rrjedha hyrëse dhe e natës', 'inlet and night flow'],
    [!!kru?.network.active, 'rrjeti i tubave', 'the pipe network'],
  ]
  const model = parts.filter(p => !p[0]).map(p => t(p[1], p[2]))
  if (!kru) return null
  if (!model.length) return <NavLink to="/te-dhenat" className="pill ok"><span className="led" />{t('Të dhënat e KRU-së', "KRU's data")}</NavLink>
  const some = model.length < parts.length
  return (
    <NavLink to="/te-dhenat" className="pill sim" title={t('Ende të simuluara: ', 'Still simulated: ') + model.join(', ')}>
      <span className="led" />{some ? t('Pjesërisht të simuluara', 'Partly simulated') : t('Të dhëna të simuluara', 'Simulated data')}
    </NavLink>
  )
}

function AppBar({ sections, current }: { sections: Section[]; current: Section | undefined }) {
  const { t } = useApp()
  return (
    <header className="appbar">
      <div className="appbar-in">
        <Brand />
        <nav className="sections" aria-label={t('Seksionet', 'Sections')}>
          {sections.map(s => (
            <NavLink key={s.key} to={s.items[0].to} className={s === current ? 'on' : ''} aria-current={s === current ? 'page' : undefined}>
              {t(s.sq, s.en)}{sectionFlag(s) && <span className="flag" />}
            </NavLink>
          ))}
        </nav>
        <div className="appbar-end">
          <StatusPill />
          <Lang />
        </div>
      </div>
    </header>
  )
}

function SubNav({ s }: { s: Section }) {
  const { t } = useApp()
  if (s.items.length < 2) return null
  return (
    <div className="subnav">
      <nav className="subnav-in" aria-label={t(s.sq, s.en)}>
        {s.items.map(i => (
          <NavLink key={i.to} to={i.to} end>{t(i.sq, i.en)}<Badge b={i.badge} /></NavLink>
        ))}
      </nav>
    </div>
  )
}

const PRIMARY = ['overview', 'map', 'losses', 'billing']

function BottomBar({ sections, current }: { sections: Section[]; current: Section | undefined }) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])
  const rest = sections.filter(s => !PRIMARY.includes(s.key))
  const moreOn = !!current && !PRIMARY.includes(current.key)
  return (
    <>
      {open && <div className="sheet-bg" onClick={() => setOpen(false)} />}
      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={t('Më shumë', 'More')}>
          {rest.map(s => (
            <div key={s.key} className="sheet-group">
              <h2>{s.icon}{t(s.sq, s.en)}</h2>
              {s.items.map(i => <NavLink key={i.to} to={i.to} end>{t(i.sq, i.en)}<Badge b={i.badge} /></NavLink>)}
            </div>
          ))}
          <div className="sheet-foot"><span>{t('Gjuha', 'Language')}</span><Lang /></div>
        </div>
      )}
      <nav className="bottombar" aria-label={t('Seksionet', 'Sections')}>
        {sections.filter(s => PRIMARY.includes(s.key)).map(s => (
          <NavLink key={s.key} to={s.items[0].to} className={s === current && !open ? 'on' : ''}>
            {s.icon}<span>{t(s.sq, s.en)}</span>{sectionFlag(s) && <span className="flag" />}
          </NavLink>
        ))}
        <button className={moreOn || open ? 'on' : ''} aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {ICON.more}<span>{t('Më shumë', 'More')}</span>
        </button>
      </nav>
    </>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const { lang } = useApp()
  const sections = useSections()
  const current = sections.find(s => inSection(s, pathname)) ?? sections[0]
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return (
    <div className="shell">
      <a className="skip" href="#main">{lang === 'sq' ? 'Kalo te përmbajtja' : 'Skip to content'}</a>
      <AppBar sections={sections} current={current} />
      <SubNav s={current} />
      <main id="main" className="main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/harta" element={<MapPage />} />
          <Route path="/zonat" element={<ZonesPage />} />
          <Route path="/nenzonat" element={<SubzonesPage />} />
          <Route path="/piloti-nz5" element={<PilotNz5 />} />
          <Route path="/24-oret" element={<Day24 />} />
          <Route path="/bilanci" element={<BalancePage />} />
          <Route path="/nata" element={<NightFlow />} />
          <Route path="/presioni" element={<PressurePage />} />
          <Route path="/anomalite" element={<Anomalies />} />
          <Route path="/konsumatoret" element={<Customers />} />
          <Route path="/faturim-gis" element={<BillingGis />} />
          <Route path="/urdhrat" element={<WorkOrders />} />
          <Route path="/terreni" element={<FieldApp />} />
          <Route path="/plani" element={<PlanPage />} />
          <Route path="/supozimet" element={<Assumptions />} />
          <Route path="/burimet" element={<Sources />} />
          <Route path="/regjistrohu" element={<Register />} />
          <Route path="/kontratat" element={<Contracts />} />
          <Route path="/kontrata/:number" element={<ContractPage />} />
          <Route path="/te-dhenat" element={<DataPage />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </main>
      <BottomBar sections={sections} current={current} />
    </div>
  )
}
