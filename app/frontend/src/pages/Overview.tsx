import { Link } from 'react-router-dom'
import { api } from '../api'
import { DMA } from '../dma'
import ProfileChart from '../components/ProfileChart'
import { Loading } from '../components/ui'
import { eur, fmt, useApp, useData } from '../state'

const FRESH_MS = 90 * 60 * 1000  // loggers usually send hourly; older than this is flagged as stale

/** The four live sensors, ordered from the bottom of the zone to the top, with the ground level they sit at. */
function LiveSensors() {
  const { t, live, liveOk, sensors } = useApp()
  const v = live?.values ?? {}
  const elev = (id: string) => sensors.find(s => s.id === id)?.elev
  const rows: [string, string, string, number][] = [
    ['DMA01-Q-HYRJA', t('Matësi i hyrjes', 'Inlet meter'), 'm³/h', 1],
    ['DMA01-P-ULET', t('Pika më e ulët', 'Lowest point'), 'bar', 2],
    ['DMA01-P-AZP', t('Pika mesatare', 'Average point'), 'bar', 2],
    ['DMA01-P-KRIT', t('Pika kritike', 'Critical point'), 'bar', 2],
  ]
  let state = t('Duke u lidhur…', 'Connecting…')
  if (live && !liveOk) state = t('Pa lidhje', 'Offline')
  else if (live?.source === 'measured') {
    const stamp = live.ts.slice(0, 16).replace('T', ' ')
    state = Date.now() - new Date(live.ts).getTime() < FRESH_MS ? t(`Matur, ${stamp.slice(11)}`, `Measured, ${stamp.slice(11)}`) : t(`Leximi i fundit ${stamp}`, `Last reading ${stamp}`)
  } else if (live) state = t('Simulim live, çdo 2 s', 'Simulated live, every 2 s')
  return (
    <div className="live" aria-live="polite">
      <p className="live-state"><span className={'led' + (live && liveOk ? ' on' : '')} />{state}</p>
      <dl>
        {rows.map(([id, label, unit, d]) => (
          <div key={id}>
            <dt>{label}{elev(id) != null && <small>{fmt(elev(id))} m</small>}</dt>
            <dd className="num">{v[id] !== undefined ? fmt(v[id], d) : '–'}<i>{unit}</i></dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function DataNote() {
  const { t, kru } = useApp()
  const real: string[] = [], model: string[] = []
  const put = (on: boolean, sq: string, en: string) => (on ? real : model).push(t(sq, en))
  const tel = kru?.telemetry
  put(!!kru?.billing.active, 'konsumatorët dhe faturimi', 'customers and billing')
  put(!!tel?.active, 'presionet dhe matësit live', 'pressures and live gauges')
  put(!!tel && tel.flow_days >= 3, 'rrjedha hyrëse dhe e natës', 'inlet and night flow')
  put(!!kru?.network.active, 'rrjeti i tubave', 'the pipe network')
  if (!kru) return null
  return (
    <p className={'data-note' + (model.length ? '' : ' real')}>
      {t('Terreni, ndërtesat, rrugët dhe kufiri janë të vërteta (OSM, EU-DEM, Geoportali). ', 'Terrain, buildings, roads and the boundary are real (OSM, EU-DEM, Geoportal). ')}
      {real.length > 0 && <>{t('Nga KRU: ', 'From KRU: ')}{real.join(', ')}. </>}
      {model.length > 0
        ? <>{t('Ende të simuluara: ', 'Still simulated: ')}{model.join(', ')}. <Link to="/te-dhenat">{t('Ngarko të dhënat e KRU-së', "Upload KRU's data")}</Link></>
        : t('Vlerësimet e mbetura janë te Supozimet.', 'The remaining estimates are listed under Assumptions.')}
    </p>
  )
}

export default function Overview() {
  const { t, zone, buildings } = useApp()
  const bal = useData(api.balance)
  const fl = useData(api.flows)
  const an = useData(api.anomalies)
  const mm = useData(api.mismatches)
  const pr = useData(() => api.pressure({ prv_on: true, prv_set_bar: 3, prv_bands: 'A', capex: 15000 }))
  const b = bal.data
  const p = pr.data

  const alerts = [
    fl.data?.alarm && {
      tone: 'alarm', to: '/nata', cta: t('Shiko rrjedhën e natës', 'See night flow'),
      h: t(`Rrjedha e natës u rrit që nga ${fl.data.alarm.since}`, `Night flow up since ${fl.data.alarm.since}`),
      p: t(`+${fmt(fl.data.alarm.extra_m3h, 1)} m³/h mbi bazën, rreth ${fmt(fl.data.alarm.extra_m3d)} m³ në ditë. Ka gjasa për një rrjedhje të re; kushton ${eur(fl.data.alarm.cost_year)} në vit nëse nuk riparohet.`,
        `+${fmt(fl.data.alarm.extra_m3h, 1)} m³/h above baseline, about ${fmt(fl.data.alarm.extra_m3d)} m³ a day. Likely a new leak; it costs ${eur(fl.data.alarm.cost_year)} a year if left.`),
    },
    p && {
      tone: 'band-a', to: '/presioni', cta: t('Provo një PRV', 'Try a PRV'),
      h: t(`${fmt(p.arru_over_now)} ndërtesa marrin mbi 7 bar`, `${fmt(p.arru_over_now)} buildings get more than 7 bar`),
      p: t('ARRU lejon 1,5–7 bar te lidhja. Brezi A, në fund të fshatit, është më i ekspozuari.', 'ARRU allows 1.5–7 bar at the connection. Band A, at the bottom of the village, is the most exposed.'),
    },
    an.data && {
      tone: 'warn', to: '/anomalite', cta: t('Shiko ujëmatësit', 'See the meters'),
      h: t(`${an.data.rows.length} ujëmatës me lexime të dyshimta`, `${an.data.rows.length} meters with suspicious readings`),
      p: t(`Rreth ${fmt(an.data.lost_m3_month)} m³ në muaj pa u faturuar, ${eur(an.data.lost_eur_year)} në vit.`, `About ${fmt(an.data.lost_m3_month)} m³ a month unbilled, ${eur(an.data.lost_eur_year)} a year.`),
    },
    mm.data && {
      tone: 'violet', to: '/faturim-gis', cta: t('Shiko banesat', 'See the dwellings'),
      h: t(`${mm.data.suspects.length} banesa pa kontratë uji`, `${mm.data.suspects.length} dwellings with no water contract`),
      p: t(`Ndërtesa mbi 60 m² pa konsumator në faturim, të dyshuara për lidhje ilegale. ${mm.data.no_gis.length} konsumatorë nuk kanë pikë në GIS.`, `Buildings over 60 m² with no billing customer, suspected illegal connections. ${mm.data.no_gis.length} customers have no GIS point.`),
    },
  ].filter(Boolean) as { tone: string; to: string; cta: string; h: string; p: string }[]

  return (
    <div className="page overview">
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-text">
          <span className="eyebrow">{t('DMA Kçiq – zona e matur mbi rrjetin e KRU Mitrovica', 'DMA Kçiq – a metered zone on the KRU Mitrovica network')}</span>
          <h1 id="hero-h">{t('Kçiq humb 69,9% të ujit që hyn në zonë', 'Kçiq loses 69.9% of the water that enters the zone')}</h1>
          <p>{t('Matësi i zonës tregon 1.599 m³ në ditë hyrje dhe vetëm 481 m³ të faturuar [MATUR]. Nga RES_Kçiq (707 m) deri te shtëpia më e ulët (507 m) ka 200 m rënie, dhe asnjë UMZ nuk ka telemetri: presioni është problemi, matja mungon.',
            'The zone meter shows 1,599 m³ a day going in and only 481 m³ billed [MEASURED]. From RES_Kçiq (707 m) to the lowest house (507 m) there is a 200 m drop, and no zone meter has telemetry: pressure is the problem and metering is missing.')}</p>
          <dl className="hero-figs">
            <div><dt>{t('shtëpi (GIS)', 'houses (GIS)')}</dt><dd>{DMA.houses}</dd></div>
            <div><dt>{t('nënzona të matura', 'metered sub-zones')}</dt><dd>{DMA.subzones}</dd></div>
            <div><dt>{t('zona presioni', 'pressure zones')}</dt><dd>{DMA.pressureZones}</dd></div>
            <div><dt>{t('direkt në 3–5 bar', 'directly at 3–5 bar')}</dt><dd>{DMA.direct35Pct}%</dd></div>
          </dl>
          <ol className="phases">
            <li><b>{t('1 · Mat', '1 · Measure')}</b>{t('MP-0, MP-1, MP-2, LS-1, UMZ-NZ5 dhe logger GSM çdo 15 min; riparo pompën P2.', 'MP-0, MP-1, MP-2, LS-1, UMZ-NZ5 and GSM loggers every 15 min; repair pump P2.')} <Link to="/nenzonat">{t('Nënzonat dhe matja', 'Sub-zones and metering')} →</Link></li>
            <li><b>{t('2 · Pilot NZ-5', '2 · NZ-5 pilot')}</b>{t('Kufi i mbyllur, 4 PRV, testi zero-presion, MNF bazë 02:00–04:00.', 'Sealed boundary, 4 PRVs, zero-pressure test, baseline MNF 02:00–04:00.')} <Link to="/piloti-nz5">{t('Piloti NZ-5', 'NZ-5 pilot')} →</Link></li>
            <li><b>{t('3 · Shtri', '3 · Extend')}</b>{t('12 PRV të reja në NZ-1 deri NZ-4, 18 zona presioni në 3–5 bar.', '12 new PRVs in NZ-1 to NZ-4, 18 pressure zones at 3–5 bar.')} <Link to="/24-oret">{t('Uji në 24 orë', 'Water over 24 h')} →</Link></li>
          </ol>
        </div>
        <LiveSensors />
        <div className="hero-chart">
          <ProfileChart buildings={buildings} pressure={p} height={280} dark />
        </div>
      </section>
      <DataNote />

      <div className="ov-grid">
        <section aria-labelledby="todo-h">
          <h2 id="todo-h">{t('Çka kërkon veprim', 'Needs action')}</h2>
          <ul className="todo">
            {alerts.map(a => (
              <li key={a.to} className={a.tone}>
                <div><h3>{a.h}</h3><p>{a.p}</p></div>
                <Link className="btn" to={a.to}>{a.cta}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="fig-h">
          <h2 id="fig-h">{t('Bilanci i 7 ditëve të fundit', 'The last 7 days in balance')}</h2>
          {!b ? <Loading error={bal.error} /> : (
            <dl className="figs">
              <div className="bad"><dt>{t('Uji pa të ardhura', 'Non-revenue water')}</dt><dd className="num">{fmt(b.nrw_pct, 1)}<i>%</i></dd>
                <small>{t('KRU 2025: 49% kompania, 64% njësia Mitrovicë', 'KRU 2025: 49% company-wide, 64% Mitrovica unit')}</small></div>
              <div><dt>{t('Humbje reale', 'Real losses')}</dt><dd className="num">{fmt(b.real)}<i>m³/d</i></dd>
                <small>{fmt(b.real_l_conn_day)} {t('litra për lidhje në ditë', 'litres per connection a day')}</small></div>
              <div><dt>{t('Indeksi i rrjedhjeve (ILI)', 'Leakage index (ILI)')}</dt><dd className="num">{fmt(b.ili, 1)}</dd>
                <small>{t(`Kategoria ${b.ili_band} e Bankës Botërore`, `World Bank band ${b.ili_band}`)}</small></div>
              <div><dt>{t('Vlera e humbur në vit', 'Value lost per year')}</dt><dd className="num">{eur(b.value_tariff)}</dd>
                <small>{t('me tarifën familjare 0,53 €/m³', 'at the €0.53/m³ household tariff')}</small></div>
            </dl>
          )}
          <Link className="btn" to="/bilanci">{t('Hap bilancin e plotë', 'Open the full balance')}</Link>
        </section>
      </div>

      {zone && (
        <section className="mt" aria-labelledby="zone-h">
          <h2 id="zone-h">{t('Dy fshatrat e zonës', 'The two villages')}</h2>
          <div className="panel flush">
            <table className="data">
              <thead><tr>
                <th>{t('Fshati', 'Village')}</th><th className="r">{t('Banorë 2024', 'People 2024')}</th><th className="r">{t('Ekonomi familjare', 'Households')}</th>
                <th className="r">{t('Ndërtesa', 'Buildings')}</th><th className="r">{t('Konsumatorë', 'Customers')}</th><th className="r">{t('Kuota', 'Elevation')}</th>
              </tr></thead>
              <tbody>
                {Object.entries(zone.villages).map(([name, v]) => (
                  <tr key={name}><td><b>{name}</b></td><td className="r num">{fmt(v.population)}</td><td className="r num">{fmt(v.households)}</td>
                    <td className="r num">{fmt(v.buildings)}</td><td className="r num">{fmt(v.customers)}</td><td className="r num">{fmt(v.elev_min)}–{fmt(v.elev_max)} m</td></tr>
                ))}
                <tr className="total"><td>{t('Gjithsej', 'Total')}</td><td className="r num">{fmt(zone.population)}</td><td className="r num">{fmt(zone.households)}</td>
                  <td className="r num">{fmt(zone.buildings)}</td><td className="r num">{fmt(Object.values(zone.villages).reduce((s, v) => s + v.customers, 0))}</td>
                  <td className="r num">{fmt(zone.elev_min)}–{fmt(zone.elev_max)} m</td></tr>
              </tbody>
            </table>
          </div>
          <p className="note">
            {t(`Burimi: ASK, Regjistrimi 2024. Zona kadastrale ${zone.cadastral_zone.name}, ${fmt(zone.cadastral_zone.area_km2, 1)} km², ${fmt(zone.road_km, 1)} km rrugë.`,
              `Source: KAS, 2024 census. Cadastral zone ${zone.cadastral_zone.name}, ${fmt(zone.cadastral_zone.area_km2, 1)} km², ${fmt(zone.road_km, 1)} km of roads.`)}
          </p>
        </section>
      )}
    </div>
  )
}
