import { useMemo, useRef, useState } from 'react'
import type { Building, Pressure } from '../api'
import { fmt, useApp } from '../state'

/**
 * The signature view: every building in the zone, sorted by ground level, drawn as a terrain profile.
 * Above it sit the hydraulic grade lines (now, and after the PRV) and the ARRU service corridor
 * (1.5 to 7 bar above the ground). Where the blue line leaves the green corridor the law is broken.
 */
export default function ProfileChart({ buildings, pressure, height = 340, compact = false }:
  { buildings: Building[]; pressure: Pressure | null; height?: number; compact?: boolean }) {
  const { t } = useApp()
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 1000
  const H = height
  const pad = { l: 52, r: 16, t: 18, b: compact ? 26 : 40 }

  const model = useMemo(() => {
    if (!buildings.length || !pressure) return null
    const pm = new Map(pressure.points.map(([i, p0, p1]) => [i, { p0, p1 }]))
    const rows = [...buildings].sort((a, b) => a.elev - b.elev).map(b => ({ b, ...(pm.get(b.i) ?? { p0: 0, p1: 0 }) }))
    const n = rows.length
    const zmin = 500
    const zmax = Math.max(720, ...rows.map(r => r.b.elev + r.p0 * 10.2)) + 5
    const x = (k: number) => pad.l + (k / (n - 1)) * (W - pad.l - pad.r)
    const y = (z: number) => pad.t + (1 - (z - zmin) / (zmax - zmin)) * (H - pad.t - pad.b)
    const line = (f: (r: (typeof rows)[number]) => number) => rows.map((r, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(f(r)).toFixed(1)}`).join('')
    const terrain = line(r => r.b.elev) + `L${x(n - 1)},${y(zmin)}L${x(0)},${y(zmin)}Z`
    const lo = rows.map((r, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(r.b.elev + 15.3).toFixed(1)}`).join('')
    const hi = [...rows].reverse().map((r, k) => `L${x(n - 1 - k).toFixed(1)},${y(r.b.elev + 71.4).toFixed(1)}`).join('')
    const corridor = lo + hi + 'Z'
    const now = line(r => r.b.elev + r.p0 * 10.2)
    const next = line(r => r.b.elev + r.p1 * 10.2)
    // shaded overpressure: area between HGL-after and the 7 bar line, where HGL is above it
    const over = rows.map((r, k) => ({ k, top: r.b.elev + r.p1 * 10.2, lim: r.b.elev + 71.4 }))
    let overPath = ''
    let run: typeof over = []
    const flush = () => {
      if (run.length > 1) {
        overPath += run.map((o, j) => `${j ? 'L' : 'M'}${x(o.k).toFixed(1)},${y(o.top).toFixed(1)}`).join('')
        overPath += [...run].reverse().map(o => `L${x(o.k).toFixed(1)},${y(o.lim).toFixed(1)}`).join('') + 'Z'
      }
      run = []
    }
    over.forEach(o => { if (o.top > o.lim) run.push(o); else flush() })
    flush()
    const bandEdges: { band: string; k0: number; k1: number }[] = []
    rows.forEach((r, k) => {
      const last = bandEdges[bandEdges.length - 1]
      if (!last || last.band !== r.b.band) bandEdges.push({ band: r.b.band, k0: k, k1: k })
      else last.k1 = k
    })
    const ticks: number[] = []
    for (let z = Math.ceil(zmin / 50) * 50; z <= zmax; z += 50) ticks.push(z)
    return { rows, n, x, y, terrain, corridor, now, next, overPath, bandEdges, ticks, zmin }
  }, [buildings, pressure, H, pad.b, pad.l, pad.r, pad.t])

  if (!model) return <div className="empty" style={{ height }}>{t('Duke ngarkuar profilin…', 'Loading profile…')}</div>
  const { rows, n, x, y, terrain, corridor, now, next, overPath, bandEdges, ticks, zmin } = model
  const changed = pressure && pressure.saved_m3d > 0

  const onMove = (e: React.MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const k = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1))
    setHover(k >= 0 && k < n ? k : null)
  }
  const h = hover !== null ? rows[hover] : null

  return (
    <div>
      <svg ref={svgRef} className="profile" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={t('Profili i terrenit dhe i presionit për çdo ndërtesë', 'Terrain and pressure profile for every building')}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#B5304A" strokeWidth="2" opacity=".45" />
          </pattern>
        </defs>
        {bandEdges.map(be => (
          <g key={be.band}>
            <rect x={x(be.k0)} y={pad.t} width={Math.max(1, x(be.k1) - x(be.k0))} height={H - pad.t - pad.b}
              fill={be.band === 'A' ? '#B5304A' : be.band === 'B' ? '#D9961E' : '#1F8A7E'} opacity=".05" />
            {!compact && <text x={(x(be.k0) + x(be.k1)) / 2} y={H - 8} textAnchor="middle" style={{ fontWeight: 600 }}>
              {t('Brezi', 'Band')} {be.band}, {be.k1 - be.k0 + 1}
            </text>}
          </g>
        ))}
        {ticks.map(z => (
          <g key={z} className="axis">
            <line x1={pad.l} x2={W - pad.r} y1={y(z)} y2={y(z)} strokeDasharray="2 4" />
            <text x={pad.l - 8} y={y(z) + 4} textAnchor="end">{z} m</text>
          </g>
        ))}
        <path d={corridor} fill="#1E7F4F" opacity=".13" />
        <path d={terrain} fill="#C9BFAE" stroke="#8C7F6A" strokeWidth="1" />
        {overPath && <path d={overPath} fill="url(#hatch)" />}
        <path d={now} fill="none" stroke="#102A3A" strokeWidth="1.6" strokeDasharray={changed ? '5 4' : undefined} opacity={changed ? 0.7 : 1} />
        {changed && <path d={next} fill="none" stroke="#1D6FA5" strokeWidth="2.6" />}
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(zmin)} stroke="#102A3A" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(h.b.elev)} r="4" fill="#8C7F6A" />
            <circle cx={x(hover)} cy={y(h.b.elev + h.p1 * 10.2)} r="4.5" fill="#1D6FA5" />
          </g>
        )}
      </svg>
      {!compact && (
        <div className="legend">
          <span className="chip"><span className="dot" style={{ background: '#C9BFAE', borderRadius: 2 }} />{t('Terreni nën secilën ndërtesë (EU-DEM)', 'Ground under each building (EU-DEM)')}</span>
          <span className="chip"><span className="dot" style={{ background: 'rgba(30,127,79,.3)', borderRadius: 2 }} />{t('Korridori ARRU 1,5–7 bar', 'ARRU corridor 1.5–7 bar')}</span>
          <span className="chip"><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#102A3A" strokeWidth="2" strokeDasharray={changed ? '5 4' : undefined} /></svg>{t('Kuota piezometrike tani', 'Hydraulic grade now')}</span>
          {changed && <span className="chip"><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#1D6FA5" strokeWidth="3" /></svg>{t('Pas PRV-së', 'After the PRV')}</span>}
          <span className="chip"><span className="dot" style={{ background: 'url(#hatch)', border: '1px solid #B5304A', borderRadius: 2 }} />{changed ? t('Mbi 7 bar pas PRV-së', 'Above 7 bar after the PRV') : t('Mbi 7 bar', 'Above 7 bar')}</span>
        </div>
      )}
      <div className="note" style={{ minHeight: 20, marginTop: 4 }}>
        {h ? `${h.b.id}, ${h.b.village}, ${t('brezi', 'band')} ${h.b.band}: ${t('kuota', 'ground')} ${fmt(h.b.elev, 1)} m, ${t('presioni', 'pressure')} ${fmt(h.p0, 1)} bar${changed ? ` → ${fmt(h.p1, 1)} bar` : ''}`
          : t('Kaloni miun mbi profil për të parë çdo ndërtesë.', 'Move the pointer over the profile to inspect each building.')}
      </div>
    </div>
  )
}
