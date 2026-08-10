import {
  accentIndex,
  formatDate,
  humanizeType,
  shortDid,
  specificType,
  STATUS_LABEL,
  type CredentialStatus,
} from '../lib/credentials'
import { CheckIcon, ChevronRightIcon } from './Icons'

interface CredentialCardProps {
  type?: string | string[]
  issuerDid?: string
  /** Vigencia; solo disponible cuando ya se cargó el detalle de la VC. */
  status?: CredentialStatus
  validUntil?: string
  onClick?: () => void
  selectable?: boolean
  selected?: boolean
}

export function CredentialCard({
  type,
  issuerDid,
  status,
  validUntil,
  onClick,
  selectable = false,
  selected = false,
}: CredentialCardProps) {
  const className = [
    'credential-card',
    `accent-${accentIndex(specificType(type))}`,
    selectable ? 'credential-card--selectable' : '',
    selected ? 'credential-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <div className="credential-card__body">
      <div className="stack stack--tight">
        <span className="credential-card__type">{humanizeType(type)}</span>
        <span className="credential-card__issuer">
          Emisor: {shortDid(issuerDid, 6)}
        </span>
      </div>

      <div className="credential-card__footer">
        <div className="stack stack--tight">
          {status && status !== 'unknown' && (
            <span className="badge badge--on-card">{STATUS_LABEL[status]}</span>
          )}
          {validUntil && (
            <span className="credential-card__meta">Válida hasta {formatDate(validUntil)}</span>
          )}
          {/* Sin detalle cargado no hay vigencia que mostrar: se invita a abrirla. */}
          {!status && !validUntil && !selectable && (
            <span className="credential-card__hint">
              Ver detalle
              <ChevronRightIcon strokeWidth={2.5} />
            </span>
          )}
        </div>

        {selectable && (
          <span className="credential-card__check" aria-hidden="true">
            <CheckIcon strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  )

  if (!onClick) {
    return <div className={className}>{content}</div>
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-pressed={selectable ? selected : undefined}
    >
      {content}
    </button>
  )
}
