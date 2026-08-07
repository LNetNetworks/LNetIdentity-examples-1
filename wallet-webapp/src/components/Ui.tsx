import { useState, type ReactNode } from 'react'
import { AlertTriangleIcon, CheckIcon, CopyIcon, InfoIcon } from './Icons'

/* -------------------------------------------------------------------------- */
/* Alert                                                                       */
/* -------------------------------------------------------------------------- */

type AlertTone = 'error' | 'warning' | 'info' | 'success'

const ALERT_ICON: Record<AlertTone, typeof InfoIcon> = {
  error: AlertTriangleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
  success: CheckIcon,
}

export function Alert({ tone = 'info', children }: { tone?: AlertTone; children: ReactNode }) {
  const IconComponent = ALERT_ICON[tone]
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <IconComponent />
      <div>{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Estados                                                                     */
/* -------------------------------------------------------------------------- */

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="loading-block">
      <div className="spinner spinner--large" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <p className="empty-state__title">{title}</p>
      {text && <p className="empty-state__text">{text}</p>}
      {action}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Filas de datos                                                              */
/* -------------------------------------------------------------------------- */

export function DataRow({
  label,
  children,
  mono = false,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="data-row">
      <span className="data-row__label">{label}</span>
      <span className={mono ? 'data-row__value mono' : 'data-row__value'}>{children}</span>
    </div>
  )
}

/** Valor largo (DIDs, ids) con botón de copiado y confirmación efímera. */
export function CopyableValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Sin permiso de portapapeles el valor sigue visible y seleccionable. */
    }
  }

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <span className="mono" style={{ flex: 1, minWidth: 0 }}>
        {value}
      </span>
      <button
        type="button"
        className="icon-button"
        onClick={copy}
        aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
        style={{ width: 32, height: 32, flexBasis: 32 }}
      >
        {copied ? (
          <CheckIcon style={{ width: 16, height: 16, color: 'var(--success)' }} />
        ) : (
          <CopyIcon style={{ width: 16, height: 16 }} />
        )}
      </button>
    </div>
  )
}
