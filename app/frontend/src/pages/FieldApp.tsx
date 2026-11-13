import { useState } from 'react'
import { api } from '../api'
import { PageHead } from '../components/ui'
import { fmt, useApp } from '../state'

type Result = Awaited<ReturnType<typeof api.addReading>>

export default function FieldApp() {
  const { t, bump } = useApp()
  const [code, setCode] = useState('K-10001')
  const [reading, setReading] = useState('')
  const [note, setNote] = useState('')
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null)
  const [geoMsg, setGeoMsg] = useState<string | null>(null)
  const [res, setRes] = useState<Result | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const locate = () => {
    if (!navigator.geolocation) { setGeoMsg(t('Ky shfletues nuk jep vendndodhjen.', 'This browser does not provide location.')); return }
    setGeoMsg(t('Duke kërkuar GPS…', 'Getting GPS…'))
    navigator.geolocation.getCurrentPosition(
      p => { setPos({ lat: p.coords.latitude, lon: p.coords.longitude }); setGeoMsg(`±${Math.round(p.coords.accuracy)} m`) },
      () => setGeoMsg(t('Vendndodhja u refuzua. Leximi ruhet pa koordinata.', 'Location was refused. The reading is saved without coordinates.')),
      { enableHighAccuracy: true, timeout: 8000 })
  }
  const send = async () => {
    setErr(null); setRes(null)
    const value = Number(reading.replace(',', '.'))
    if (!Number.isFinite(value) || value < 0) { setErr(t('Shkruani një numër, p.sh. 12,5', 'Enter a number, e.g. 12.5')); return }
    try {
      const r = await api.addReading({ code: code.trim().toUpperCase(), reading: value, lat: pos?.lat, lon: pos?.lon, note })
      setRes(r); bump()
    } catch (e) { setErr((e as Error).message) }
  }
  const warnText = (w: Result['warning'], exp: number) => w === 'zero'
    ? t('Lexim zero. Kontrolloni nëse ujëmatësi rrotullohet ose është anashkaluar, dhe bëni foto.', 'Zero reading. Check whether the meter turns or is bypassed, and take a photo.')
    : w === 'high' ? t(`Mbi 3 herë mesataren (${fmt(exp, 1)} m³). Kontrolloni për rrjedhje pas ujëmatësit.`, `Over 3 times the average (${fmt(exp, 1)} m³). Check for a leak after the meter.`)
      : t(`Nën 40% të mesatares (${fmt(exp, 1)} m³). Kontrolloni plombën dhe lidhjet.`, `Under 40% of the average (${fmt(exp, 1)} m³). Check the seal and the pipework.`)

  return (
    <div className="page">
      <PageHead title={t('Lexim në terren', 'Field reading')}
        lead={t('Pamja që lexuesi sheh në telefon. Kontrolli i leximit bëhet menjëherë, para se të largohet nga shtëpia. Në versionin Android punon offline me SQLite dhe sinkronizohet përmes Mobile Sync të KRU-së.',
          'The screen a meter reader sees on the phone. The reading is checked on the spot, before they leave the house. The Android version works offline with SQLite and syncs through KRU\'s Mobile Sync.')} />
      <div className="phone">
        <label className="field">{t('Kodi i konsumatorit', 'Customer code')}<input type="text" value={code} onChange={e => setCode(e.target.value)} autoCapitalize="characters" /></label>
        <label className="field">{t('Leximi i këtij muaji (m³)', 'This month\'s reading (m³)')}<input className="big num" type="text" inputMode="decimal" value={reading} onChange={e => setReading(e.target.value)} placeholder="0" /></label>
        <label className="field">{t('Shënim', 'Note')}<textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('P.sh. ujëmatësi në bodrum, qeni në oborr', 'E.g. meter in the basement, dog in the yard')} /></label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <button className="btn" onClick={locate}>{t('Shto vendndodhjen GPS', 'Add GPS location')}</button>
          <span className="note">{geoMsg}</span>
        </div>
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={!reading || !code} onClick={send}>{t('Ruaj leximin', 'Save reading')}</button>
        {err && <div className="callout alarm mt"><b>{t('Leximi nuk u ruajt', 'Reading not saved')}</b>{err}</div>}
        {res && (res.warning
          ? <div className="callout warn mt"><b>{t('U ruajt, me paralajmërim', 'Saved, with a warning')}</b>{warnText(res.warning, res.expected)}</div>
          : <div className="callout ok mt"><b>{t('Leximi u ruajt', 'Reading saved')}</b>{t(`Brenda pritjes (mesatarja ${fmt(res.expected, 1)} m³).`, `Within expectation (average ${fmt(res.expected, 1)} m³).`)}</div>)}
        {res?.distance_m !== null && res?.distance_m !== undefined && res.distance_m > 50 && (
          <div className="callout warn mt"><b>{t(`Jeni ${fmt(res.distance_m)} m larg ujëmatësit`, `You are ${fmt(res.distance_m)} m from the meter`)}</b>{t('Kontrolloni që lexuat ujëmatësin e duhur. Kjo mbron nga leximet "nga zyra".', 'Check you read the right meter. This guards against readings made from the office.')}</div>
        )}
      </div>
    </div>
  )
}
