import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type Building, type Live, type Sensor, type Zone } from './api'

export type Lang = 'sq' | 'en'

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (sq: string, en: string) => string
  version: number
  bump: () => void
  live: Live | null
  liveOk: boolean
  zone: Zone | null
  buildings: Building[]
  sensors: Sensor[]
  toast: (msg: string) => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('kciq.lang') as Lang) || 'sq' } catch { return 'sq' }
  })
  const [version, setVersion] = useState(0)
  const [live, setLive] = useState<Live | null>(null)
  const [liveOk, setLiveOk] = useState(false)
  const [zone, setZone] = useState<Zone | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('kciq.lang', l) } catch { /* storage blocked */ }
  }, [])
  const t = useCallback((sq: string, en: string) => (lang === 'sq' ? sq : en), [lang])
  const bump = useCallback(() => setVersion(v => v + 1), [])
  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.setTimeout(() => setToastMsg(m => (m === msg ? null : m)), 3200)
  }, [])

  useEffect(() => {
    api.zone().then(setZone).catch(() => setZone(null))
    api.buildings().then(setBuildings).catch(() => setBuildings([]))
    api.sensors().then(setSensors).catch(() => setSensors([]))
  }, [])

  useEffect(() => {
    let es: EventSource | null = null
    let timer: number | undefined
    const connect = () => {
      es = new EventSource('/api/stream')
      es.onmessage = e => { setLive(JSON.parse(e.data)); setLiveOk(true) }
      es.onerror = () => {
        setLiveOk(false)
        es?.close()
        timer = window.setTimeout(connect, 4000)
      }
    }
    connect()
    return () => { es?.close(); window.clearTimeout(timer) }
  }, [])

  const value = useMemo(() => ({ lang, setLang, t, version, bump, live, liveOk, zone, buildings, sensors, toast }),
    [lang, setLang, t, version, bump, live, liveOk, zone, buildings, sensors, toast])

  return (
    <AppCtx.Provider value={value}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp outside provider')
  return c
}

/** Fetch helper that refetches when assumptions or scenario change (version bump). */
export function useData<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const { version } = useApp()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setError(null)
    fn().then(d => { if (alive) setData(d) }).catch(e => { if (alive) setError(String(e.message ?? e)) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, tick, ...deps])
  return { data, error, reload: () => setTick(x => x + 1) }
}

export const fmt = (x: number, d = 0) =>
  Number.isFinite(x) ? x.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\./g, ' ') : '–'

export const eur = (x: number) => fmt(x) + ' €'

export const BAND_COLOR: Record<string, string> = { A: 'var(--band-a)', B: 'var(--band-b)', C: 'var(--band-c)' }
export const BAND_HEX: Record<string, string> = { A: '#B5304A', B: '#D9961E', C: '#1F8A7E' }
export const VILLAGE_HEX: Record<string, string> = { 'Kçiq i Madh': '#1D5F95', 'Kçiq i Vogël': '#8A5CC2' }

export function pressureHex(bar: number) {
  if (bar > 7) return '#B5304A'
  if (bar > 6) return '#E06C3C'
  if (bar < 1.5) return '#C9A227'
  if (bar < 2.5) return '#7DB0C9'
  return '#1D6FA5'
}
