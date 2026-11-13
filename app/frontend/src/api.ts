export type Band = 'A' | 'B' | 'C'
export type Village = 'Kçiq i Madh' | 'Kçiq i Vogël'

export interface Building { i: number; id: string; lat: number; lon: number; elev: number; band: Band; village: Village; area: number }
export interface Road { name: string; kind: string; len_m: number; pts: [number, number][] }
export interface Poi { name: string; kind: string; lat: number; lon: number }
export interface Zone {
  name: string; dma: string; population: number; households: number; buildings: number; dwellings: number
  elev_min: number; elev_median: number; elev_max: number; road_km: number; today: string
  cadastral_zone: { name: string; area_km2: number; source: string }
  villages: Record<Village, { population: number; households: number; buildings: number; customers: number; elev_min: number; elev_max: number }>
  bands: Record<Band, { buildings: number; zmin: number; zmax: number }>
  boundary: GeoJSON.Feature; neighbours: GeoJSON.Feature[]; pois: Poi[]
}
export interface Sensor { id: string; kind: 'flow' | 'pressure'; unit: string; sq: string; en: string; lat: number | null; lon: number | null; elev: number | null }
export interface Live { ts: string; values: Record<string, number> }
export interface Flows {
  days: string[]; hourly: number[]; daily: number[]; billed: number[]; mnf: number[]
  baseline: number; threshold: number; legit_night: number; night_leak_m3h: number
  alarm: null | { since: string; extra_m3h: number; extra_m3d: number; cost_year: number }
}
export interface Balance {
  input: number; billed: number; unbilled_auth: number; unauth: number; under_reg: number; apparent: number; real: number
  nrw: number; nrw_pct: number; real_l_conn_day: number; real_m3_km_day: number; uarl: number; ili: number; ili_band: string
  avg_pressure_m: number; value_tariff: number; value_real_cost: number; value_apparent_tariff: number
}
export interface BandP { buildings: number; p_now_min: number; p_now_avg: number; p_now_max: number; p_new_min: number; p_new_avg: number; p_new_max: number; leak_now: number; leak_new: number }
export interface Pressure {
  bands: Record<Band, BandP>; leak_now: number; leak_new: number; saved_m3d: number; saved_m3y: number; saved_eur: number
  nrw_now: number; nrw_new: number; burst_cut_pct: number; critical_bar: number; over_6bar_now: number; over_6bar_new: number
  arru_over_now: number; arru_over_new: number; arru_under_now: number; arru_under_new: number; under_min_new: number
  hist_now: number[]; hist_new: number[]; avg_pressure_m: number; points: [number, number, number][]
  payback_months: number | null; hgl_low: number; hgl_high: number
}
export type Rule = 'zero' | 'drop' | 'peer' | 'spike'
export interface Anomaly { code: string; rule: Rule; last: number; expected: number; lost_m3_month: number; lat: number; lon: number; band: Band; village: Village; meter_year: number }
export interface Anomalies { rules: Record<Rule, { sq: string; en: string; why_sq: string; why_en: string }>; rows: Anomaly[]; by_rule: Partial<Record<Rule, number>>; lost_m3_month: number; lost_eur_year: number }
export interface Suspect { id: string; lat: number; lon: number; elev: number; band: Band; village: Village; area: number; nearest_m: number }
export interface Mismatch { buildings_without_customer: number; suspects: Suspect[]; no_gis: { code: string; avg: number }[] }
export interface CustomerRow { code: string; band: Band; village: Village; elev: number; avg: number; last: number; meter_year: number; rule: Rule | null; lat: number; lon: number }
export interface CustomerDetail {
  code: string; band: Band; village: Village; elev: number; avg: number; meter_year: number; lat: number; lon: number
  months: string[]; readings: number[]; peer: number[]; anomaly: Anomaly | null
  field_readings: { id: number; reading: number; ts: string; note: string; lat: number | null; lon: number | null }[]
}
export type WoStatus = 'open' | 'field' | 'done'
export interface WorkOrder { id: number; kind: string; ref: string; title: string; lat: number | null; lon: number | null; status: WoStatus; note: string; created: string; updated: string }
export interface Assumption { v: number; unit: string; src: string; sq: string; en: string }
export interface Plan {
  phases: { m0: number; m1: number; sq: string; en: string; who: string; d_sq: string; d_en: string }[]
  targets: { sq: string; en: string; base: string; m6: string; m12: string }[]
  targets_note?: { sq: string; en: string }
  budget: {
    note_sq: string; note_en: string
    tiers: { key: 'min' | 'std' | 'adv'; sq: string; en: string; total: number; d_sq: string; d_en: string }[]
    lines: { sq: string; en: string; min: number; std: number; adv: number; basis: string }[]
  }
  comms: { sq: string; en: string }
  cases: { place: string; year: string; sq: string; en: string; url: string }[]
  references: { t: string; url: string }[]
  methods?: { sq: string; en: string; src: string; url: string }[]
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!r.ok) {
    let msg = r.statusText
    try { msg = (await r.json()).detail ?? msg } catch { /* not json */ }
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return r.json() as Promise<T>
}

export const api = {
  zone: () => req<Zone>('/zone'),
  buildings: () => req<Building[]>('/buildings'),
  roads: () => req<Road[]>('/roads'),
  sensors: () => req<Sensor[]>('/sensors'),
  flows: () => req<Flows>('/flows'),
  balance: () => req<Balance>('/balance'),
  pressure: (body: { prv_on: boolean; prv_set_bar: number; prv_bands: 'A' | 'AB'; capex: number }) =>
    req<Pressure>('/pressure', { method: 'POST', body: JSON.stringify(body) }),
  anomalies: () => req<Anomalies>('/anomalies'),
  mismatches: () => req<Mismatch>('/mismatches'),
  customers: (q = '', village = '') => req<{ total: number; rows: CustomerRow[] }>(`/customers?limit=60&q=${encodeURIComponent(q)}&village=${encodeURIComponent(village)}`),
  customer: (code: string) => req<CustomerDetail>('/customers/' + encodeURIComponent(code)),
  workorders: () => req<WorkOrder[]>('/workorders'),
  createWorkorder: (w: { kind: string; ref: string; title: string; lat?: number | null; lon?: number | null; note?: string }) =>
    req<WorkOrder>('/workorders', { method: 'POST', body: JSON.stringify(w) }),
  patchWorkorder: (id: number, p: { status?: WoStatus; note?: string }) => req<WorkOrder>('/workorders/' + id, { method: 'PATCH', body: JSON.stringify(p) }),
  deleteWorkorder: (id: number) => req<{ ok: boolean }>('/workorders/' + id, { method: 'DELETE' }),
  addReading: (r: { code: string; reading: number; lat?: number | null; lon?: number | null; note?: string }) =>
    req<{ ok: boolean; warning: null | 'zero' | 'high' | 'low'; expected: number; distance_m: number | null }>('/readings', { method: 'POST', body: JSON.stringify(r) }),
  assumptions: () => req<Record<string, Assumption>>('/assumptions'),
  putAssumptions: (values: Record<string, number>) => req<Record<string, Assumption>>('/assumptions', { method: 'PUT', body: JSON.stringify({ values }) }),
  scenario: () => req<{ leak_m3h: number; leak_start_day: number | null }>('/scenario'),
  putScenario: (s: { leak_m3h: number; leak_start_day: number | null }) => req<{ leak_m3h: number; leak_start_day: number | null }>('/scenario', { method: 'PUT', body: JSON.stringify(s) }),
  plan: () => req<Plan>('/plan'),
}
