import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { api } from '../api'
import { Loading, PageHead, Stat } from '../components/ui'
import { eur, fmt, useApp, useData } from '../state'

export default function BalancePage() {
  const { t } = useApp()
  const { data: b, error } = useData(api.balance)
  const as = useData(api.assumptions).data
  if (!b) return <div className="page"><Loading error={error} /></div>
  const pct = (x: number) => fmt((x / b.input) * 100, 1) + '%'
  const iliPos = Math.min(100, (b.ili / 24) * 100)
  const bars = [
    { k: t('Faturuar', 'Billed'), v: b.billed, c: '#1E7F4F' },
    { k: t('E autorizuar pa faturë', 'Unbilled authorised'), v: b.unbilled_auth, c: '#7FB89A' },
    { k: t('Nën-regjistrim', 'Meter under-registration'), v: b.under_reg, c: '#D9961E' },
    { k: t('E paautorizuar', 'Unauthorised use'), v: b.unauth, c: '#B87A10' },
    { k: t('Humbje reale', 'Real losses'), v: b.real, c: '#B5304A' },
  ]
  return (
    <div className="page">
      <PageHead title={t('Bilanci i ujit sipas IWA', 'IWA water balance')}
        lead={t('Ku shkon çdo m³ që hyn në zonë, në m³ në ditë. Hyrja matet në matësin e hyrjes; faturimi vjen nga sistemi i faturimit; humbjet reale janë mbetja.',
          'Where every m³ entering the zone goes, in m³ per day. Input is measured at the inlet meter, billing comes from the billing system, and real losses are what remains.')} />
      <div className="strip">
        <Stat label={t('Hyrja në sistem', 'System input')} value={fmt(b.input)} unit="m³/d" />
        <Stat label={t('Uji pa të ardhura', 'Non-revenue water')} value={fmt(b.nrw)} unit="m³/d" delta={`${fmt(b.nrw_pct, 1)}% ${t('e hyrjes', 'of input')}`} tone="bad" />
        <Stat label={t('Humbje reale për km', 'Real losses per km')} value={fmt(b.real_m3_km_day, 1)} unit="m³/km/d" />
        <Stat label="UARL" value={fmt(b.uarl, 1)} unit="m³/d" delta={t('humbja e pashmangshme', 'unavoidable loss')} />
        <Stat label="ILI" value={fmt(b.ili, 1)} delta={t(`kategoria ${b.ili_band}`, `band ${b.ili_band}`)} />
      </div>

      <section className="panel mt">
        <h2>{t('Tabela standarde IWA', 'Standard IWA table')}</h2>
        <p className="sub">{t('E njëjta strukturë që përdorin ARRU dhe Banka Botërore. Lexohet nga e majta në të djathtë.', 'The same structure ARRU and the World Bank use. Read it from left to right.')}</p>
        <div className="iwa">
          <div><div className="cell" style={{ gridRow: 'span 5' }}><small>{t('Hyrja në sistem', 'System input volume')}</small><b>{fmt(b.input)}</b><span className="note">100%</span></div></div>
          <div>
            <div className="cell rev" style={{ minHeight: 120 }}><small>{t('Konsum i autorizuar', 'Authorised consumption')}</small><b>{fmt(b.billed + b.unbilled_auth)}</b><span className="note">{pct(b.billed + b.unbilled_auth)}</span></div>
            <div className="cell nrw" style={{ minHeight: 180 }}><small>{t('Humbjet e ujit', 'Water losses')}</small><b>{fmt(b.apparent + b.real)}</b><span className="note">{pct(b.apparent + b.real)}</span></div>
          </div>
          <div>
            <div className="cell rev"><small>{t('Konsum i autorizuar i faturuar', 'Billed authorised')}</small><b>{fmt(b.billed)}</b></div>
            <div className="cell"><small>{t('Konsum i autorizuar i pafaturuar', 'Unbilled authorised')}</small><b>{fmt(b.unbilled_auth)}</b><span className="note">{t('zjarrfikës, larje rrjeti', 'firefighting, mains flushing')}</span></div>
            <div className="cell app"><small>{t('Humbje komerciale', 'Apparent losses')}</small><b>{fmt(b.apparent)}</b><span className="note">{t(`nën-regjistrim ${fmt(b.under_reg)}, ilegale ${fmt(b.unauth)}`, `under-registration ${fmt(b.under_reg)}, unauthorised ${fmt(b.unauth)}`)}</span></div>
            <div className="cell real" style={{ minHeight: 110 }}><small>{t('Humbje reale (fizike)', 'Real (physical) losses')}</small><b>{fmt(b.real)}</b><span className="note">{t('rrjedhje, plasaritje, tejmbushje', 'leaks, bursts, overflows')}</span></div>
          </div>
          <div>
            <div className="cell rev" style={{ minHeight: 60 }}><small>{t('Ujë me të ardhura', 'Revenue water')}</small><b>{fmt(b.billed)}</b><span className="note">{pct(b.billed)}</span></div>
            <div className="cell nrw" style={{ minHeight: 240 }}><small>{t('Ujë pa të ardhura', 'Non-revenue water')}</small><b>{fmt(b.nrw)}</b><span className="note">{pct(b.nrw)}</span></div>
          </div>
        </div>
      </section>

      <div className="grid g2 mt">
        <section className="panel">
          <h2>{t('Përbërja e hyrjes', 'Make-up of the input')}</h2>
          <div style={{ height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={bars} layout="vertical" margin={{ left: 10, right: 50 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="k" width={170} fontSize={12.5} tickLine={false} axisLine={false} />
                <Bar dataKey="v" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                  {bars.map(x => <Cell key={x.k} fill={x.c} />)}
                  <LabelList dataKey="v" position="right" fontSize={12.5} formatter={(v: unknown) => fmt(Number(v)) + ' m³'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <h2>{t('Indeksi i humbjeve të infrastrukturës', 'Infrastructure Leakage Index')}</h2>
          <p className="sub">{t(`ILI = humbjet reale ÷ humbjet e pashmangshme (UARL). UARL = (18·Lm + 0,8·Nc + 25·Lp)·P, me ${fmt(as?.mains_km.v, 1)} km rrjet, ${fmt(as?.connections.v)} lidhje dhe presion mesatar `, `ILI = real losses ÷ unavoidable losses (UARL). UARL = (18·Lm + 0.8·Nc + 25·Lp)·P, with ${fmt(as?.mains_km.v, 1)} km of mains, ${fmt(as?.connections.v)} connections and an average pressure of `)}<span className="num">{fmt(b.avg_pressure_m, 1)}</span> m.</p>
          <div className="scale">
            <span /><span /><span /><span />
            <div className="scale-marker" style={{ left: `calc(${iliPos}% - 1px)` }} />
          </div>
          <div className="scale-lab"><span>A &lt; 4</span><span>B 4–8</span><span>C 8–16</span><span>D &gt; 16</span></div>
          <p className="mt" style={{ fontSize: 14 }}>
            {t(`ILI ${fmt(b.ili, 1)} bie në kategorinë ${b.ili_band}. Për vendet në zhvillim, Banka Botërore e lexon B si "potencial për përmirësim të dukshëm: menaxhim presioni, kontroll aktiv i rrjedhjeve, mirëmbajtje më e mirë".`,
              `An ILI of ${fmt(b.ili, 1)} falls in band ${b.ili_band}. For developing countries the World Bank reads B as "potential for marked improvement: pressure management, active leakage control, better maintenance".`)}
          </p>
          <h3 className="mt">{t('Vlera në euro në vit', 'Value in euro per year')}</h3>
          <dl className="kv">
            <dt>{t('Gjithë NRW me tarifën 0,53 €/m³', 'All NRW at the €0.53/m³ tariff')}</dt><dd>{eur(b.value_tariff)}</dd>
            <dt>{t('Humbjet reale me koston e prodhimit', 'Real losses at production cost')}</dt><dd>{eur(b.value_real_cost)}</dd>
            <dt>{t('Humbjet komerciale me tarifë', 'Apparent losses at tariff')}</dt><dd>{eur(b.value_apparent_tariff)}</dd>
          </dl>
          <p className="note mt">{t('Humbjet komerciale vlerësohen me tarifë sepse ai ujë shitet; humbjet reale me koston e prodhimit sepse ai ujë nuk arrin te askush.', 'Apparent losses are valued at the tariff because that water is sold; real losses at production cost because that water reaches no one.')}</p>
        </section>
      </div>
    </div>
  )
}
