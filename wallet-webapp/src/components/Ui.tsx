import { useState, type ReactNode } from 'react'
import { ApiError } from '../lib/api'
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

/**
 * Detalle crudo del error, plegado. En el teléfono no hay DevTools, así que sin
 * esto un fallo del backend es indistinguible de un bug de la app.
 */
export function TechnicalDetails({
  error,
  context,
}: {
  error: unknown
  context?: Record<string, string | undefined>
}) {
  const [copied, setCopied] = useState(false)

  const lines: string[] = []
  if (error instanceof ApiError) lines.push(error.details)
  else if (error instanceof Error) lines.push(`${error.name}: ${error.message}`)
  else if (error !== undefined && error !== null) lines.push(String(error))

  for (const [key, value] of Object.entries(context ?? {})) {
    if (value) lines.push(`${key}: ${value}`)
  }

  if (lines.length === 0) return null
  const text = lines.join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* El texto queda visible y seleccionable igual. */
    }
  }

  return (
    <details className="disclosure">
      <summary>Detalle técnico</summary>
      <div className="disclosure__content stack stack--tight">
        <pre className="raw-json">{text}</pre>
        <button
          type="button"
          className="button button--secondary button--auto button--small"
          onClick={copy}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copiado' : 'Copiar detalle'}
        </button>
      </div>
    </details>
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
