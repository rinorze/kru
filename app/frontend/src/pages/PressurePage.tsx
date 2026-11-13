import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type Band, type Pressure } from '../api'
import ProfileChart from '../components/ProfileChart'
import { PageHead, Seg, Stat } from '../components/ui'
import { BAND_HEX, eur, fmt, useApp } from '../state'

export default function PressurePage() {
  const { t, buildings, version, bump, toast } = useApp()
  const [on, setOn] = useState(true)
  const [setp, setSetp] = useState(3)
  const [bands, setBands] = useState<'A' | 'AB'>('A')
  const [capex, setCapex] = useState(15000)
  const [p, setP] = useState<Pressure | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const h = window.setTimeout(() => {
      api.pressure({ prv_on: on, prv_set_bar: setp, prv_bands: bands, capex }).then(r => { if (alive) { setP(r); setErr(null) } }).catch(e => { if (alive) setErr(e.message) })
    }, 120)
    return () => { alive = false; window.clearTimeout(h) }
  }, [on, setp, bands, capex, version])

  // the PRV sits where the main enters the controlled band: its highest building
  const inlet = buildings.filter(b => bands.includes(b.band)).reduce<typeof buildings[number] | null>((m, b) => (!m || b.elev > m.elev ? b : m), null)
  const hist = p ? p.hist_now.map((n, k) => ({ bar: k === 12 ? '12+' : String(k), [t('Tani', 'Now')]: n, [t('Pas PRV', 'After PRV')]: p.hist_new[k] })) : []

  const createWo = async () => {
    try {
      await api.createWorkorder({ kind: 'pressure', ref: `PRV-${bands}-${setp}`, title: t(`Instalo PRV në hyrje të brezit ${bands === 'A' ? 'A' : 'A+B'}, pikë vendosje ${fmt(setp, 1)} bar`, `Install PRV at the band ${bands === 'A' ? 'A' : 'A+B'} inlet, set point ${fmt(setp, 1)} bar`),
        lat: inlet?.lat ?? null, lon: inlet?.lon ?? null, note: t(`Në kufirin e brezit, pranë ndërtesës ${inlet?.id ?? ''} (${fmt(inlet?.elev ?? 0)} m), ku tubi kryesor zbret në brez. Vendndodhja e saktë konfirmohet me GIS-in e KRU-së. Verifiko presionin në pikën kritike pas instalimit.`, `At the band edge, near building ${inlet?.id ?? ''} (${fmt(inlet?.elev ?? 0)} m), where the main enters the band. Confirm the exact spot with KRU's GIS. Verify pressure at the critical point after installation.`) })
      toast(t('Urdhri i punës u krijua', 'Work order created')); bump()
    } catch (e) { toast((e as Error).message) }
  }

  return (
    <div className="page">
      <PageHead title={t('Presioni dhe valvula reduktuese (PRV)', 'Pressure and the pressure-reducing valve (PRV)')}
        lead={t('Rrjedhjet rriten me presionin (ligji FAVAD, L₁/L₀ = (P₁/P₀)^N1). Shtëpitë në fund të Kçiqit kanë presion mbi kufirin ligjor. Zgjidhni ku vendoset PRV-ja dhe në sa bar.',
          'Leakage grows with pressure (the FAVAD law, L₁/L₀ = (P₁/P₀)^N1). Houses at the bottom of Kçiq sit above the legal limit. Choose where the PRV goes and its set point.')} />

      <div className="grid g-side">
        <section className="panel">
          <ProfileChart buildings={buildings} pressure={p} height={360} />
        </section>
        <section className="panel">
          <h2>{t('Cilësimet e PRV-së', 'PRV settings')}</h2>
          <label className="check"><input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />{t('PRV e instaluar', 'PRV installed')}</label>
          <label className="field">{t('Presioni në dalje te pika më e lartë e brezit', 'Outlet pressure at the highest point of the band')}<span className="val">{fmt(setp, 1)} bar</span>
            <input type="range" min={1.5} max={6} step={0.1} value={setp} disabled={!on} onChange={e => setSetp(+e.target.value)} /></label>
          <div className="field">{t('Brezat e kontrolluar', 'Bands controlled')}<div style={{ marginTop: 6 }}>
            <Seg label={t('Brezat', 'Bands')} value={bands} onChange={setBands} options={[{ v: 'A', label: t('Vetëm A (510–545 m)', 'A only (510–545 m)') }, { v: 'AB', label: 'A + B (510–592 m)' }]} /></div></div>
          <label className="field">{t('Investimi (PRV, pus, instalim)', 'Investment (PRV, chamber, installation)')}<span className="val">{eur(capex)}</span>
            <input type="range" min={5000} max={40000} step={500} value={capex} onChange={e => setCapex(+e.target.value)} /></label>
          {err && <p className="err">{err}</p>}
          {on && bands === 'AB' && p && p.saved_m3d < 1 && (
            <div className="callout warn"><b>{t('Kjo pikë vendosjeje nuk ndryshon asgjë për A + B', 'This set point changes nothing for A + B')}</b>
              {t('Shtëpia më e lartë e brezit B merr vetëm rreth 2,8 bar sot, kështu që një PRV në hyrje të B duhet vendosur më poshtë se kaq. Zgjidhja më e mirë: PRV vetëm për brezin A.', 'The highest house in band B gets only about 2.8 bar today, so a PRV at the B inlet must be set below that. The better option: a PRV for band A only.')}</div>
          )}
          {p && (
            <>
              {p.under_min_new > 0
                ? <div className="callout warn"><b>{t(`${p.under_min_new} ndërtesa nën ${fmt(2.5, 1)} bar`, `${p.under_min_new} buildings below 2.5 bar`)}</b>{t('Shtëpitë më të larta të brezit mund të kenë presion të dobët në orët e pikut. Ngrini pikën e vendosjes ose kufizoni PRV-në te brezi A.', 'The highest houses in the band may get weak pressure at peak hours. Raise the set point or limit the PRV to band A.')}</div>
                : <div className="callout ok"><b>{t('Asnjë ndërtesë nën 2,5 bar', 'No building below 2.5 bar')}</b>{t(`Pika kritike mbetet në ${fmt(p.critical_bar, 1)} bar.`, `The critical point stays at ${fmt(p.critical_bar, 1)} bar.`)}</div>}
              <button className="btn primary" onClick={createWo} disabled={!on}>{t('Krijo urdhër pune për PRV-në', 'Create a work order for the PRV')}</button>
            </>
          )}
        </section>
      </div>

      {p && (
        <>
          <div className="strip mt">
            <Stat label={t('Rrjedhje tani', 'Leakage now')} value={fmt(p.leak_now)} unit="m³/d" />
            <Stat label={t('Rrjedhje pas PRV', 'Leakage after PRV')} value={fmt(p.leak_new)} unit="m³/d" tone="good" delta={`−${fmt(p.saved_m3d)} m³/d`} />
            <Stat label={t('Kursim në vit', 'Saving per year')} value={eur(p.saved_eur)} tone="good" delta={`${fmt(p.saved_m3y)} m³ × 0,25 €/m³`} />
            <Stat label={t('Kthimi i investimit', 'Payback')} value={p.payback_months !== null ? fmt(p.payback_months, 1) : '–'} unit={t('muaj', 'months')} />
            <Stat label="NRW" value={`${fmt(p.nrw_now, 1)} → ${fmt(p.nrw_new, 1)}`} unit="%" />
            <Stat label={bands === 'A' ? t('Më pak plasaritje në brezin A', 'Fewer bursts in band A') : t('Më pak plasaritje në A + B', 'Fewer bursts in A + B')} value={`−${fmt(p.burst_cut_pct)}`} unit="%" delta={t('rregulli 1,4 × ulja e presionit max', '1.4 × cut in max pressure')} />
          </div>

          <div className="grid g2 mt">
            <section className="panel">
              <h2>{t('Ndërtesat sipas presionit', 'Buildings by pressure')}</h2>
              <p className="sub">{t(`Mbi 7 bar (kufiri ARRU): ${fmt(p.arru_over_now)} tani, ${fmt(p.arru_over_new)} pas PRV-së. Nën 1,5 bar: ${fmt(p.arru_under_now)} → ${fmt(p.arru_under_new)}.`,
                `Above 7 bar (the ARRU limit): ${fmt(p.arru_over_now)} now, ${fmt(p.arru_over_new)} after the PRV. Below 1.5 bar: ${fmt(p.arru_under_now)} → ${fmt(p.arru_under_new)}.`)}</p>
              <div style={{ height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={hist} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#E6ECEB" vertical={false} />
                    <ReferenceArea x1="2" x2="6" fill="#1E7F4F" fillOpacity={0.07} />
                    <XAxis dataKey="bar" fontSize={11} unit=" bar" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey={t('Tani', 'Now')} fill="#9FB1BC" isAnimationActive={false} />
                    <Bar dataKey={t('Pas PRV', 'After PRV')} fill="#1D6FA5" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="panel flush">
              <table className="data">
                <thead><tr><th>{t('Brezi', 'Band')}</th><th className="r">{t('Ndërtesa', 'Buildings')}</th><th className="r">{t('Presioni tani', 'Pressure now')}</th><th className="r">{t('Pas PRV', 'After PRV')}</th><th className="r">{t('Rrjedhje m³/d', 'Leakage m³/d')}</th></tr></thead>
                <tbody>
                  {(Object.entries(p.bands) as [Band, Pressure['bands'][Band]][]).map(([k, v]) => (
                    <tr key={k}>
                      <td><span className="chip"><span className="dot" style={{ background: BAND_HEX[k] }} /><b>{k}</b></span></td>
                      <td className="r num">{v.buildings}</td>
                      <td className="r num">{fmt(v.p_now_min, 1)}–{fmt(v.p_now_max, 1)} bar</td>
                      <td className="r num">{fmt(v.p_new_min, 1)}–{fmt(v.p_new_max, 1)} bar</td>
                      <td className="r num">{fmt(v.leak_now)} → {fmt(v.leak_new)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 16px' }}>
                <h3>{t('Si llogaritet', 'How it is calculated')}</h3>
                <p className="note">{t(`Presioni statik = (kuota piezometrike − kuota e ndërtesës) ÷ 10,2. Rezervuari jep ${p.hgl_low} m për brezat A dhe B; brezi C furnizohet me pompë deri në ${p.hgl_high} m. Humbjet e fërkimit injorohen, kështu që presioni real në pik është pak më i ulët. Rrjedhja shkallëzohet me (P₁/P₀)^N1 me N1 = 1,0 (literatura jep 0,5–1,5 sipas materialit të tubave). Rregulli 1,4× për plasaritjet vjen nga Thornton dhe Lambert (2006) dhe vlen si tendencë, jo si garanci.`,
                  `Static pressure = (hydraulic grade − building elevation) ÷ 10.2. The reservoir gives ${p.hgl_low} m for bands A and B; band C is pumped to ${p.hgl_high} m. Friction losses are ignored, so real peak-hour pressure is slightly lower. Leakage scales with (P₁/P₀)^N1 with N1 = 1.0 (the literature gives 0.5–1.5 depending on pipe material). The 1.4× burst rule is from Thornton and Lambert (2006) and is a tendency, not a guarantee.`)}</p>
              </div>
            </section>
          </div>
          <div className="callout mt">
            <b>{t('Rast real në Kosovë: Graçanica, 2023', 'A real Kosovo case: Graçanica, 2023')}</b>
            {t('Një PRV DN150 për rreth 15 000 € uli presionin nga 5,9 në 2,5 bar. Rezultati: −640 m³/ditë, plasaritjet nga 196 në 88 në vit, rreth 132 000 € kursim në vit (Lajqi et al., Sustainability 2023).',
              'One DN150 PRV for about €15,000 cut pressure from 5.9 to 2.5 bar. Result: −640 m³/day, bursts down from 196 to 88 a year, about €132,000 saved a year (Lajqi et al., Sustainability 2023).')}
          </div>
        </>
      )}
    </div>
  )
}
