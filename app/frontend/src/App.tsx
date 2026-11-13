import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { api } from './api'
import { fmt, useApp, useData } from './state'
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

function Rail() {
  const { t, lang, setLang, version } = useApp()
  const an = useData(api.anomalies)
  const mm = useData(api.mismatches)
  const wo = useData(api.workorders, [version])
  const fl = useData(api.flows)
  const ct = useData(api.contracts, [version])
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [pathname])
  const openWo = wo.data?.filter(w => w.status !== 'done').length
  const groups: { h: string; items: { to: string; sq: string; en: string; count?: number | string }[] }[] = [
    { h: t('Zona', 'Zone'), items: [
      { to: '/', sq: 'Pasqyra', en: 'Overview' },
      { to: '/harta', sq: 'Harta GIS', en: 'GIS map' },
    ] },
    { h: t('Analiza', 'Analysis'), items: [
      { to: '/bilanci', sq: 'Bilanci i ujit', en: 'Water balance' },
      { to: '/nata', sq: 'Rrjedha e natës', en: 'Night flow', count: fl.data?.alarm ? '!' : undefined },
      { to: '/presioni', sq: 'Presioni dhe PRV', en: 'Pressure and PRV' },
    ] },
    { h: t('Faturimi', 'Billing'), items: [
      { to: '/anomalite', sq: 'Anomalitë', en: 'Anomalies', count: an.data?.rows.length },
      { to: '/konsumatoret', sq: 'Konsumatorët', en: 'Customers' },
      { to: '/faturim-gis', sq: 'Faturim ↔ GIS', en: 'Billing ↔ GIS', count: mm.data?.suspects.length },
    ] },
    { h: t('Klientët', 'Customers'), items: [
      { to: '/regjistrohu', sq: 'Regjistrohu në KRU', en: 'Register with KRU' },
      { to: '/kontratat', sq: 'Kontratat digjitale', en: 'Digital contracts', count: ct.data?.length || undefined },
    ] },
    { h: t('Terreni', 'Field'), items: [
      { to: '/urdhrat', sq: 'Urdhrat e punës', en: 'Work orders', count: openWo || undefined },
      { to: '/terreni', sq: 'Lexim në terren', en: 'Field reading' },
    ] },
    { h: t('Pilot', 'Pilot'), items: [
      { to: '/plani', sq: 'Plani dhe buxheti', en: 'Plan and budget' },
      { to: '/supozimet', sq: 'Supozimet', en: 'Assumptions' },
      { to: '/burimet', sq: 'Burimet', en: 'Sources' },
    ] },
  ]
  return (
    <aside className={'rail' + (open ? ' open' : '')}>
      <div className="rail-top">
      <NavLink to="/" className="brand">
        <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="7" fill="#1D4A63" /><path d="M16 5c-4 6-8 10.5-8 15a8 8 0 0 0 16 0c0-4.5-4-9-8-15z" fill="#4FA3D9" /><path d="M9 21h14" stroke="#EEF2F1" strokeWidth="2" /></svg>
        <span><b>DMA Kçiq</b><small>{t('Paneli i zonës pilot', 'Pilot zone panel')}</small></span>
      </NavLink>
      <button className="menu-btn" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(o => !o)}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>{open
          ? <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          : <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}</svg>
        {open ? t('Mbyll', 'Close') : t('Menyja', 'Menu')}
      </button>
      </div>
      <nav className="nav" id="main-nav" aria-label={t('Navigimi', 'Navigation')}>
        {groups.map(g => (
          <div key={g.h} style={{ display: 'contents' }}>
            <h6>{g.h}</h6>
            {g.items.map(i => (
              <NavLink key={i.to} to={i.to} end={i.to === '/'}>
                {t(i.sq, i.en)}
                {i.count !== undefined && <span className="count">{i.count}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="rail-foot">
        <div className="lang" role="group" aria-label={t('Gjuha', 'Language')}>
          <button aria-pressed={lang === 'sq'} onClick={() => setLang('sq')}>Shqip</button>
          <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
        </div>
        <div>{t('Hackathoni UPF i KRU Mitrovica, 2026', 'KRU Mitrovica NRW hackathon, 2026')}</div>
      </div>
    </aside>
  )
}

function Topbar() {
  const { t, live, liveOk, zone } = useApp()
  const v = live?.values ?? {}
  const g = (id: string, label: string, unit: string, d = 1) => (
    <div className="gauge" title={id}>
      <small>{label}</small>
      <b>{v[id] !== undefined ? fmt(v[id], d) : '–'}<i>{unit}</i></b>
    </div>
  )
  return (
    <>
      <header className="topbar">
        <div className="zone-name">
          {zone ? 'Kçiq i Madh + Kçiq i Vogël' : 'DMA Kçiq'}
          <span>{zone ? `${t('zona kadastrale', 'cadastral zone')} 71202012, ${fmt(zone.population)} ${t('banorë', 'people')}` : ''}</span>
        </div>
        <div className="gauges" aria-live="polite">
          <span className="chip"><span className={'pulse' + (liveOk ? '' : ' off')} />{liveOk ? t('Live, çdo 2 s', 'Live, every 2 s') : live ? t('Pa lidhje', 'Offline') : t('Duke u lidhur…', 'Connecting…')}</span>
          {g('DMA01-Q-HYRJA', t('Hyrja', 'Inlet'), 'm³/h')}
          {g('DMA01-P-ULET', t('Pika e ulët', 'Low point'), 'bar', 2)}
          {g('DMA01-P-AZP', 'AZP', 'bar', 2)}
          {g('DMA01-P-KRIT', t('Pika kritike', 'Critical point'), 'bar', 2)}
        </div>
      </header>
      <div className="simbar">
        {t('Terreni, ndërtesat, rrugët dhe kufiri janë të vërteta (OSM, EU-DEM, Geoportali). Rrjedhat, presionet dhe konsumatorët janë të simuluar derisa KRU të japë të dhënat reale.',
          'Terrain, buildings, roads and the boundary are real (OSM, EU-DEM, Geoportal). Flows, pressures and customers are simulated until KRU provides the real data.')}
      </div>
    </>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const { lang } = useApp()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return (
    <div className="shell">
      <Rail />
      <div className="main">
        <Topbar />
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/harta" element={<MapPage />} />
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
          <Route path="*" element={<Overview />} />
        </Routes>
      </div>
    </div>
  )
}
