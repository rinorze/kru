import type { ReactNode } from 'react'

export function PageHead({ title, lead, actions }: { title: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, unit, delta, tone }: { label: string; value: ReactNode; unit?: string; delta?: ReactNode; tone?: 'bad' | 'good' }) {
  return (
    <div className={tone}>
      <small>{label}</small>
      <b>{value}{unit && <i>{unit}</i>}</b>
      {delta && <span className="delta note">{delta}</span>}
    </div>
  )
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(o => <button key={o.v} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  )
}

export function Loading({ error }: { error?: string | null }) {
  if (error) return <p className="err">{error}. Kontrolloni që API-ja punon në portën 8000. / Check that the API runs on port 8000.</p>
  return <p className="note">…</p>
}
