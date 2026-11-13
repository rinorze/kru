import { Link } from 'react-router-dom'
import { api } from '../api'
import ProfileChart from '../components/ProfileChart'
import { Loading, PageHead, Stat } from '../components/ui'
import { eur, fmt, useApp, useData } from '../state'

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
      color: 'var(--alarm)', to: '/nata',
      h: t(`Rrjedha e natës u rrit që nga ${fl.data.alarm.since}`, `Night flow up since ${fl.data.alarm.since}`),
      p: t(`+${fmt(fl.data.alarm.extra_m3h, 1)} m³/h mbi bazën, rreth ${fmt(fl.data.alarm.extra_m3d)} m³/ditë. Rrjedhje e re e mundshme. Kosto ${eur(fl.data.alarm.cost_year)}/vit nëse nuk riparohet.`,
        `+${fmt(fl.data.alarm.extra_m3h, 1)} m³/h above baseline, about ${fmt(fl.data.alarm.extra_m3d)} m³/day. Likely a new leak. Costs ${eur(fl.data.alarm.cost_year)}/year if left.`),
    },
    p && {
      color: 'var(--band-a)', to: '/presioni',
      h: t(`${fmt(p.arru_over_now)} ndërtesa mbi 7 bar`, `${fmt(p.arru_over_now)} buildings above 7 bar`),
      p: t('Rregulla ARRU 02/2016 lejon 1,5–7 bar te lidhja. Brezi A në fund të fshatit është më i ekspozuari.', 'ARRU Rule 02/2016 allows 1.5–7 bar at the connection. Band A at the bottom of the village is the most exposed.'),
    },
    an.data && {
      color: 'var(--warn)', to: '/anomalite',
      h: t(`${an.data.rows.length} ujëmatës me lexime të dyshimta`, `${an.data.rows.length} meters with suspicious readings`),
      p: t(`Rreth ${fmt(an.data.lost_m3_month)} m³/muaj të pafaturuar, ${eur(an.data.lost_eur_year)}/vit me tarifën 0,53 €/m³.`, `About ${fmt(an.data.lost_m3_month)} m³/month unbilled, ${eur(an.data.lost_eur_year)}/year at the €0.53/m³ tariff.`),
    },
    mm.data && {
      color: '#5B2AA6', to: '/faturim-gis',
      h: t(`${mm.data.suspects.length} banesa pa kontratë uji`, `${mm.data.suspects.length} dwellings with no water contract`),
      p: t(`Ndërtesa mbi 60 m² që nuk kanë konsumator në faturim. Kandidatë për lidhje ilegale. ${mm.data.no_gis.length} konsumatorë nuk kanë pikë në GIS.`, `Buildings over 60 m² with no billing customer. Candidates for illegal connections. ${mm.data.no_gis.length} customers have no GIS point.`),
    },
  ].filter(Boolean) as { color: string; to: string; h: string; p: string }[]

  return (
    <div className="page">
      <PageHead
        title={t('Zona pilot DMA01: Kçiq i Madh dhe Kçiq i Vogël', 'Pilot zone DMA01: Kçiq i Madh and Kçiq i Vogël')}
        lead={t('Dy fshatra në një zonë kadastrale, 160 m ndryshim lartësie nga lugina e Sitnicës deri në kodër. Ky panel tregon ku humbet uji, pse, dhe çfarë kursen një valvul reduktuese presioni.',
          'Two villages in one cadastral zone, with 160 m of height difference from the Sitnica valley to the hilltop. This panel shows where water is lost, why, and what one pressure-reducing valve saves.')}
      />
      {!b ? <Loading error={bal.error} /> : (
        <div className="strip">
          <Stat label={t('Uji pa të ardhura', 'Non-revenue water')} value={fmt(b.nrw_pct, 1)} unit="%" tone="bad" delta={t('KRU 2025: 49% kompania, 64% Mitrovica', 'KRU 2025: 49% company, 64% Mitrovica')} />
          <Stat label={t('Humbje reale', 'Real losses')} value={fmt(b.real)} unit="m³/d" delta={`${fmt(b.real_l_conn_day)} l/${t('lidhje/ditë', 'conn/day')}`} />
          <Stat label="ILI" value={fmt(b.ili, 1)} delta={t(`Kategoria ${b.ili_band} e Bankës Botërore`, `World Bank band ${b.ili_band}`)} />
          <Stat label={t('Vlera e humbur në vit', 'Value lost per year')} value={eur(b.value_tariff)} delta={t('me tarifën familjare', 'at the household tariff')} />
          {p && <Stat label={t('Kursimi me një PRV', 'Saving with one PRV')} value={eur(p.saved_eur)} unit={t('/vit', '/yr')} tone="good" delta={t(`kthim në ${fmt(p.payback_months ?? 0, 1)} muaj`, `payback in ${fmt(p.payback_months ?? 0, 1)} months`)} />}
        </div>
      )}

      <div className="grid g-side mt">
        <section className="panel">
          <h2>{t('Pse humbet uji këtu: presioni', 'Why water is lost here: pressure')}</h2>
          <p className="sub">{t('Çdo ndërtesë e zonës, e renditur sipas kuotës. Rezervuari e mban vijën piezometrike në 620 m, kështu që shtëpitë poshtë kanë 8–11 bar. Vija blu tregon efektin e një PRV-je në 3 bar për brezin A.',
            'Every building in the zone, sorted by ground level. The reservoir holds the hydraulic grade at 620 m, so houses at the bottom see 8–11 bar. The blue line shows one PRV at 3 bar on band A.')}</p>
          <ProfileChart buildings={buildings} pressure={p} height={300} />
          <Link className="btn" to="/presioni">{t('Hap simulatorin e presionit', 'Open the pressure simulator')}</Link>
        </section>
        <section className="panel">
          <h2>{t('Çka kërkon veprim', 'Needs action')}</h2>
          <ul className="alerts">
            {alerts.map(a => (
              <li key={a.to}>
                <span className="bar" style={{ background: a.color }} />
                <div><h3 style={{ margin: 0 }}>{a.h}</h3><p>{a.p}</p></div>
                <Link className="btn small" to={a.to}>{t('Shiko', 'View')}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {zone && (
        <section className="panel mt flush">
          <table className="data">
            <thead><tr>
              <th>{t('Fshati', 'Village')}</th><th className="r">{t('Banorë 2024', 'People 2024')}</th><th className="r">{t('Ekonomi familjare', 'Households')}</th>
              <th className="r">{t('Ndërtesa (OSM)', 'Buildings (OSM)')}</th><th className="r">{t('Konsumatorë', 'Customers')}</th><th className="r">{t('Kuota', 'Elevation')}</th>
            </tr></thead>
            <tbody>
              {Object.entries(zone.villages).map(([name, v]) => (
                <tr key={name}><td><b>{name}</b></td><td className="r num">{fmt(v.population)}</td><td className="r num">{fmt(v.households)}</td>
                  <td className="r num">{fmt(v.buildings)}</td><td className="r num">{fmt(v.customers)}</td><td className="r num">{fmt(v.elev_min)}–{fmt(v.elev_max)} m</td></tr>
              ))}
              <tr><td><b>{t('Gjithsej', 'Total')}</b></td><td className="r num"><b>{fmt(zone.population)}</b></td><td className="r num"><b>{fmt(zone.households)}</b></td>
                <td className="r num"><b>{fmt(zone.buildings)}</b></td><td className="r num"><b>{fmt(Object.values(zone.villages).reduce((s, v) => s + v.customers, 0))}</b></td>
                <td className="r num">{fmt(zone.elev_min)}–{fmt(zone.elev_max)} m</td></tr>
            </tbody>
          </table>
          <p className="note" style={{ padding: '8px 12px', margin: 0 }}>
            {t(`Burimi: ASK, Regjistrimi 2024. Zona kadastrale ${zone.cadastral_zone.name}, ${fmt(zone.cadastral_zone.area_km2, 1)} km², ${fmt(zone.road_km, 1)} km rrugë.`,
              `Source: KAS, 2024 census. Cadastral zone ${zone.cadastral_zone.name}, ${fmt(zone.cadastral_zone.area_km2, 1)} km², ${fmt(zone.road_km, 1)} km of roads.`)}
          </p>
        </section>
      )}
    </div>
  )
}
