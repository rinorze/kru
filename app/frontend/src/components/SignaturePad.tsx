import { useEffect, useRef, type PointerEvent as RPointerEvent } from 'react'
import { useApp } from '../state'

/** Finger, pen or mouse signature. Reports a PNG data URL, or '' when cleared. */
export default function SignaturePad({ onChange, invalid }: { onChange: (png: string) => void; invalid?: boolean }) {
  const { t } = useApp()
  const cv = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const inked = useRef(false)

  useEffect(() => {
    const c = cv.current!
    let w = 0
    const fit = () => {
      const r = c.getBoundingClientRect()
      if (Math.round(r.width) === w) return  // phones fire resize when the URL bar hides
      w = Math.round(r.width)
      // keep the ink when the pad changes size (a tablet turned sideways): copy it, resize, draw it back
      const old = inked.current ? (() => { const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.getContext('2d')!.drawImage(c, 0, 0); return o })() : null
      const dpr = window.devicePixelRatio || 1
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr)
      const g = c.getContext('2d')!
      if (old) g.drawImage(old, 0, 0, old.width, old.height, 0, 0, c.width, c.width * old.height / old.width)
      g.scale(dpr, dpr); g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#102A3A'
      if (old) onChange(c.toDataURL('image/png'))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pos = (e: RPointerEvent) => { const r = cv.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const }
  const down = (e: RPointerEvent) => {
    cv.current!.setPointerCapture(e.pointerId); drawing.current = true
    const g = cv.current!.getContext('2d')!; const [x, y] = pos(e); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.1, y + 0.1); g.stroke()
  }
  const move = (e: RPointerEvent) => {
    if (!drawing.current) return
    const g = cv.current!.getContext('2d')!; const [x, y] = pos(e); g.lineTo(x, y); g.stroke(); inked.current = true
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    if (inked.current) onChange(cv.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = cv.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); inked.current = false; onChange('')
  }

  return (
    <div className={'sigpad' + (invalid ? ' invalid' : '')}>
      <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        role="img" aria-label={t('Fusha e nënshkrimit', 'Signature field')} />
      <div className="sigpad-foot">
        <span className="note">{t('Nënshkruani me gisht, laps ose maus', 'Sign with a finger, stylus or mouse')}</span>
        <button type="button" className="btn small" onClick={clear}>{t('Fshij', 'Clear')}</button>
      </div>
    </div>
  )
}
