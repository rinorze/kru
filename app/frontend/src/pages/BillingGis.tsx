import { useState } from 'react'
import { api } from '../api'
import ZoneMap, { FlyTo } from '../components/ZoneMap'
import { Loading, PageHead, Stat } from '../components/ui'
import { eur, fmt, useApp, useData } from '../state'

export default function BillingGis() {
  const { t, bump, toast, buildings } = useApp()
  const { data: m, error } = useData(api.mismatches)
  const { data: asm } = useData(api.assumptions)
  const tariff = asm?.tariff?.v ?? 0.53
  const [sel, setSel] = useState<string | null>(null)
  if (!m) return <div className="page"><Loading error={error} /></div>
  const s = m.suspects.find(x => x.id === sel) ?? null
  // a dwelling of this size typically uses ~12 m³/month (KRU average household)
  const potential = m.suspects.length * 12 * 12 * tariff

  const inspect = async (id: string) => {
    const x = m.suspects.find(y => y.id === id)!
    try {
      await api.createWorkorder({ kind: 'suspect', ref: x.id, lat: x.lat, lon: x.lon, title: t(`Inspekto ndërtesën ${x.id} (${x.area} m²): lidhje pa kontratë?`, `Inspect building ${x.id} (${x.area} m²): connection with no contract?`) })
      toast(t('Urdhri i inspektimit u krijua', 'Inspection order created')); bump()
    } catch (e) { toast((e as Error).message) }
  }

  return (
    <div className="page">
      <PageHead title={t('Ura faturim ↔ GIS', 'Billing ↔ GIS bridge')}
        lead={t('Krahasimi i regjistrit të faturimit me ndërtesat në hartë. Në gjithë KRU-në, faturimi ka 56 536 konsumatorë dhe GIS-i 54 020; në 2025 u gjetën 403 lidhje ilegale. Këtu e bëjmë të njëjtin krahasim për Kçiqin, ndërtesë për ndërtesë.',
          'Matching the billing register against the buildings on the map. Across KRU, billing has 56,536 customers and GIS has 54,020; 403 illegal connections were found in 2025. Here we run the same match for Kçiq, building by building.')}
        actions={<>
          <a className="btn" href="/api/export/suspects.csv">{t('Eksporto të dyshimtët', 'Export suspects')}</a>
          <a className="btn" href="/api/export/no_gis.csv">{t('Eksporto pa GIS', 'Export no-GIS')}</a>
        </>} />
      <div className="strip">
        <Stat label={t('Ndërtesa në GIS', 'Buildings in GIS')} value={fmt(buildings.length)} />
        <Stat label={t('Ndërtesa pa konsumator', 'Buildings with no customer')} value={fmt(m.buildings_without_customer)} delta={t('shumica janë garazhe, stalla, shtojca', 'mostly garages, barns, annexes')} />
        <Stat label={t('Banesa të dyshimta', 'Suspect dwellings')} value={m.suspects.length} tone="bad" delta={t('mbi 60 m², pa ujëmatës', 'over 60 m², no meter')} />
        <Stat label={t('Konsumatorë pa pikë GIS', 'Customers with no GIS point')} value={m.no_gis.length} delta={t('i njëjti raport si KRU: 2 516 / 56 536', 'same ratio as KRU: 2,516 / 56,536')} />
        <Stat label={t('Të ardhura të mundshme', 'Potential revenue')} value={eur(potential)} unit={t('/vit', '/yr')} tone="good" delta={t(`12 m³/muaj × ${fmt(tariff, 2)} €`, `12 m³/month × €${fmt(tariff, 2)}`)} />
      </div>
      <div className="grid g-side mt">
        <ZoneMap markers={m.suspects.map(x => ({ key: x.id, lat: x.lat, lon: x.lon, color: '#5B2AA6', r: x.id === sel ? 11 : 7, ring: true, label: `${x.id}, ${x.area} m²`, onClick: () => setSel(x.id) }))} showSensors={false}>
          <FlyTo lat={s?.lat ?? null} lon={s?.lon ?? null} zoom={18} />
        </ZoneMap>
        <section className="panel flush scroll" style={{ maxHeight: 640 }}>
          <table className="data">
            <thead><tr><th>{t('Ndërtesa', 'Building')}</th><th>{t('Fshati', 'Village')}</th><th className="r">m²</th><th className="r">{t('Fqinji', 'Neighbour')}</th><th /></tr></thead>
            <tbody>
              {m.suspects.map(x => (
                <tr key={x.id} className={'click' + (x.id === sel ? ' sel' : '')} onClick={() => setSel(x.id)}>
                  <td><b>{x.id}</b></td><td>{x.village}</td><td className="r num">{x.area}</td><td className="r num">{x.nearest_m} m</td>
                  <td className="r"><button className="btn small" onClick={e => { e.stopPropagation(); inspect(x.id) }}>{t('Inspekto', 'Inspect')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <div className="grid g2 mt">
        <section className="panel">
          <h2>{t('Si funksionon përputhja', 'How the match works')}</h2>
          <ol style={{ paddingLeft: 18, margin: 0, fontSize: 14 }}>
            <li>{t('Çdo konsumator në faturim ka koordinatat e ujëmatësit (nga aplikacioni i leximit ose GIS-i).', 'Each billing customer has meter coordinates (from the reading app or GIS).')}</li>
            <li>{t('Çdo ndërtesë në OSM ose kadastër lidhet me ujëmatësin që qëndron në të.', 'Each OSM or cadastral building is linked to the meter that sits in it.')}</li>
            <li>{t('Banesat mbi 60 m² pa asnjë ujëmatës shënohen si të dyshimta. Kolona "Fqinji" jep distancën deri te konsumatori më i afërt: sa më afër, aq më e lehtë një lidhje e paligjshme.', 'Dwellings over 60 m² with no meter are flagged. The "Neighbour" column gives the distance to the nearest customer: the closer it is, the easier an illegal tap.')}</li>
            <li>{t('Konsumatorët pa koordinata shkojnë në listën "pa GIS" që lexuesi i plotëson në raundin e ardhshëm.', 'Customers with no coordinates go on the "no GIS" list the reader fills in on the next round.')}</li>
          </ol>
        </section>
        <section className="panel">
          <h2>{t('Konsumatorë pa pikë GIS', 'Customers with no GIS point')}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {m.no_gis.map(c => <span key={c.code} className="tag">{c.code}</span>)}
          </div>
        </section>
      </div>
    </div>
  )
}
