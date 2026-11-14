// Figures from the final presentation "DMA Kçiq – zona e matur mbi rrjetin e KRU Mitrovica" (nëntor 2026),
// built on KRU's GIS (780 pipes, 615 DN25 connections, 8 UMZ, 6 PRV, 39 valves, 48 repairs) and SRTM 30 m.

export const DMA = {
  houses: 561,
  subzones: 5,
  pressureZones: 18,
  direct35Pct: 72,
  direct35: 402,
  housePrv: 144,
  below3: 15,
  mainsKm: 33.7,
  newPrv: 12,
  fixPrv: 5,
  demandM3d: 323,
  production40: 539,
  pumpHours: 3.9,
  reserveHours: 18,
  reservoir: { name: 'RES_Kçiq', m3: 400, level: '707–710 m' },
  stp: { name: 'STP Kçiq', pumps: '2 pompa KSB', lps: 38, head: 187, kw: 110 },
  drop: { top: 707, bottom: 507 },
}

export interface Subzone { id: string; name: string; houses: number; zones: string; meter: string; m3d: number; color: string
  p35: number; prv: number; low: number }
export const SUBZONES: Subzone[] = [
  { id: 'NZ-1', name: 'Kçiq i Vogël', houses: 27, zones: '02, 04, 07', meter: "UMZ 'për Kçiq' (ekz., DN80)", m3d: 15.6, color: '#8B5CF6', p35: 22, prv: 5, low: 0 },
  { id: 'NZ-2', name: 'Zona e lartë – Ibrahimaj', houses: 73, zones: '01, 03, 06, 08, 10, 11', meter: 'MP-2 (dalja e RES) + UMZ Ibrahimaj (ekz., DN80)', m3d: 42, color: '#C2185B', p35: 50, prv: 23, low: 0 },
  { id: 'NZ-3', name: 'Zona e mesme – Komora', houses: 61, zones: '05, 09', meter: "UMZ 'te komora' (ekz., DN125)", m3d: 35.2, color: '#E07B00', p35: 50, prv: 9, low: 2 },
  { id: 'NZ-4', name: 'Zona e ulët – Qendër', houses: 186, zones: '12, 14, 16', meter: "UMZ 'mes zonave' (ekz., DN100)", m3d: 107.1, color: '#2563EB', p35: 128, prv: 48, low: 10 },
  { id: 'NZ-5', name: 'Zona e ulët – Jug', houses: 214, zones: '13, 15, 17, 18', meter: 'UMZ-NZ5 (i ri, DN100)', m3d: 123.3, color: '#0E9F6E', p35: 152, prv: 59, low: 3 },
]

export const FORMULAS = [
  ['NZ-1', "UMZ 'për Kçiq'"],
  ['NZ-2', "MP-2 − UMZ 'te komora'"],
  ['NZ-3', "UMZ 'te komora' − UMZ 'mes zonave'"],
  ['NZ-4', "UMZ 'mes zonave' − UMZ-NZ5"],
  ['NZ-5', 'UMZ-NZ5'],
  ['DMA Kçiq', "MP-2 + UMZ 'për Kçiq'"],
]

export interface Device { code: string; where: string; type: string; lat: number; lon: number }
export const DEVICES: Device[] = [
  { code: 'MP-0', where: 'Hyrja në STP, para pompave (nga transmetimi)', type: 'Elektromagnetik DN250 + GSM', lat: 42.86498, lon: 20.90663 },
  { code: 'MP-1', where: 'Dalja e pompave, linja e shtytjes DN225', type: 'Elektromagnetik DN200 + GSM', lat: 42.86548, lon: 20.9073 },
  { code: 'MP-2', where: 'Dalja e RES_Kçiq – hyrja e DMA-së', type: 'Elektromagnetik DN150 + GSM', lat: 42.87566, lon: 20.9162 },
  { code: 'LS-1', where: 'Niveli i RES_Kçiq (ndal/nis pompat)', type: 'Ultrasonik/hidrostatik', lat: 42.87611, lon: 20.91547 },
  { code: 'UMZ-NZ5', where: 'Hyrja e nënzonës NZ-5 (nga NZ-4)', type: 'DN100 + GSM 15 min', lat: 42.8624, lon: 20.92074 },
]

export const DIFFS = [
  ['MP-0 − MP-1', 'uji me gravitet dhe drejt Shupkovcit'],
  ['MP-1 − MP-2', 'Kçiqi i Vogël + humbjet në linjë'],
  ['MP-2 + UMZ \'për Kçiq\'', 'gjithë uji që hyn në DMA'],
]

export const WEAKNESSES = ['Pompa P2 jashtë funksionit – STP pa rezervë', 'Asnjë UMZ me telemetri – NRW nuk matet', '48 riparime të regjistruara – pika me rrjedhje të shpeshta']

export const NZ5_CHECKS: [string, string][] = [
  ['Kufi i mbyllur', 'Valvula kufitare e mbyllur dhe e vulosur drejt NZ-4; hyrja te STP e mbyllur (rezervë)'],
  ['Hyrje e matur', "UMZ-NZ5 DN100 me logger GSM 15 min; UMZ 'me gravitacion' ekzistues si hyrje e dytë e matur"],
  ['Madhësi e përshtatshme', '214 lidhje (rekomandimi 100–3000), 15,5 km gypa, 84 nyje'],
  ['Presion i kontrolluar', '4 PRV të reja → 4 zona presioni; 152 shtëpi direkt në 3–5 bar, 59 me PRV shtëpie'],
  ['Monitorim i presionit', '12 sensorë: hyrja, pika kritike dhe pika mesatare (AZP) e çdo zone presioni'],
  ['Ujëmatës shtëpiakë', '214 ujëmatës DN20 (AMR) – bilanci mujor dhe NRW'],
  ['Mirëmbajtje', '42 valvula izoluese për step-test, 42 shpëlarje në fund-linja'],
]

export const NZ5_ZONES = [
  { id: 'DMA-13', houses: 134, elev: '518–555 m', hgl: 584 },
  { id: 'DMA-15', houses: 14, elev: '510–519 m', hgl: 551 },
  { id: 'DMA-17', houses: 54, elev: '514–537 m', hgl: 568 },
  { id: 'DMA-18', houses: 12, elev: '507–520 m', hgl: 552 },
]

export const STEPS: [string, string][] = [
  ['Riparo pompën P2', 'STP sot punon pa rezervë.'],
  ['Instalo matjen', 'MP-0, MP-1, MP-2, LS-1, UMZ-NZ5 dhe logger GSM në 5 UMZ-të ekzistuese.'],
  ['Mat presionin 7 ditë', 'Te hyrjet dhe pikat kritike, para rregullimit të PRV-ve.'],
  ['Fillo me NZ-5 si pilot', 'Mbyll kufirin, vendos 4 PRV, testi zero-presion, MNF bazë.'],
  ['Shtri në NZ-1 deri NZ-4', '12 PRV të reja gjithsej; rregullo 5 PRV ekzistuese sipas HGL-së.'],
  ['Verifiko të dhënat', '0,7 km boshllëqe në GIS, lartësitë (SRTM ±5–10 m), konsumatorët realë.'],
]

// houses by terrain elevation, 20 m bands from 500 m
export const ELEV_BANDS = [38, 125, 141, 118, 53, 36, 16, 27, 7]
