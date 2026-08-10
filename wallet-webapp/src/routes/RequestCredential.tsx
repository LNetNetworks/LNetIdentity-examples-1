import { useState, type FormEvent } from 'react'
import { useSession } from '../auth/useSession'
import { AppShell } from '../components/AppShell'
import { FilePlusIcon, PlusIcon, XIcon } from '../components/Icons'
import { WalletSetup } from '../components/WalletSetup'
import { Alert, CopyableValue, EmptyState } from '../components/Ui'
import * as api from '../lib/api'
import { formatDateTime } from '../lib/credentials'
import { isDid } from '../lib/qr'
import { addRequest, listRequests, newLocalId, removeRequest } from '../lib/requests'
import type { CredentialRequestRecord } from '../lib/types'

interface ClaimField {
  key: string
  value: string
}

const DEFAULT_CONTEXT = 'https://schema.org'

export function RequestCredential() {
  const session = useSession()
  const holderDid = session?.did ?? null
  const canIssue = session?.roles.includes('issuer') ?? false

  const [issuerDid, setIssuerDid] = useState('')
  const [type, setType] = useState('')
  const [context, setContext] = useState(DEFAULT_CONTEXT)
  const [validUntil, setValidUntil] = useState('')
  const [claims, setClaims] = useState<ClaimField[]>([{ key: '', value: '' }])

  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<
    { tone: 'success' | 'warning' | 'error'; text: string } | null
  >(null)
  const [history, setHistory] = useState<CredentialRequestRecord[]>(() => listRequests(holderDid))

  if (!holderDid) {
    return (
      <AppShell title="Solicitar credencial" showNav>
        <WalletSetup />
      </AppShell>
    )
  }

  const updateClaim = (index: number, patch: Partial<ClaimField>) => {
    setClaims((current) =>
      current.map((claim, position) => (position === index ? { ...claim, ...patch } : claim)),
    )
  }

  const addClaim = () => setClaims((current) => [...current, { key: '', value: '' }])

  const removeClaim = (index: number) => {
    setClaims((current) =>
      current.length === 1 ? [{ key: '', value: '' }] : current.filter((_, i) => i !== index),
    )
  }

  const buildData = (): Record<string, unknown> => {
    const data: Record<string, unknown> = {}
    for (const claim of claims) {
      const key = claim.key.trim()
      if (!key) continue
      data[key] = claim.value
    }
    return data
  }

  const issuerDidValid = isDid(issuerDid.trim())
  const contextValid = /^https?:\/\/\S+$/i.test(context.trim())
  const formValid = issuerDidValid && type.trim().length > 0 && contextValid

  const resetForm = () => {
    setType('')
    setValidUntil('')
    setClaims([{ key: '', value: '' }])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!formValid || submitting) return

    setSubmitting(true)
    setFeedback(null)

    const data = buildData()
    const record: CredentialRequestRecord = {
      localId: newLocalId(),
      createdAt: new Date().toISOString(),
      issuerDid: issuerDid.trim(),
      holderDid,
      type: type.trim(),
      context: context.trim(),
      data,
      status: 'pending',
    }

    try {
      const response = await api.issueCredential({
        did: record.issuerDid,
        subject: holderDid,
        type: record.type,
        context: record.context,
        data,
        ...(validUntil ? { validUntil: new Date(validUntil).toISOString() } : {}),
      })

      record.status = 'issued'
      record.vcId = response?.id
      setFeedback({
        tone: 'success',
        text: 'La credencial fue emitida y ya debería aparecer en tu listado.',
      })
      resetForm()
    } catch (cause) {
      const isForbidden = cause instanceof api.ApiError && cause.isForbidden
      record.status = isForbidden ? 'pending' : 'error'
      record.message =
        cause instanceof api.ApiError ? cause.message : 'No se pudo enviar la solicitud.'

      setFeedback({
        tone: isForbidden ? 'warning' : 'error',
        text: isForbidden
          ? 'Tu usuario no tiene rol de emisor, así que la emisión debe completarla el emisor. La solicitud quedó registrada abajo para que puedas enviársela.'
          : record.message,
      })
    } finally {
      addRequest(record)
      setHistory(listRequests(holderDid))
      setSubmitting(false)
    }
  }

  const discard = (localId: string) => {
    removeRequest(localId)
    setHistory(listRequests(holderDid))
  }

  return (
    <AppShell title="Solicitar credencial" showNav>
      <div className="stack stack--loose">
        <p className="page-subtitle">
          Completá los datos de la credencial que necesitás. La solicitud se envía al servicio
          de emisión de D-Wallet con tu DID como titular.
        </p>

        {!canIssue && (
          <Alert tone="info">
            El servicio solo permite emitir credenciales a usuarios con rol <strong>issuer</strong>.
            Si tu usuario no lo tiene, la solicitud queda registrada localmente para que se la
            envíes al emisor.
          </Alert>
        )}

        <form className="stack stack--loose" onSubmit={handleSubmit} noValidate>
          <div className="stack">
            <div className="field">
              <label className="field__label" htmlFor="issuer">
                DID del emisor
              </label>
              <input
                id="issuer"
                className="input input--mono"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="did:lac:openprotest:0x…"
                value={issuerDid}
                onChange={(event) => setIssuerDid(event.target.value)}
                disabled={submitting}
              />
              {issuerDid.trim() && !issuerDidValid && (
                <p className="field__hint" style={{ color: 'var(--danger)' }}>
                  El valor no tiene formato de DID.
                </p>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="type">
                Tipo de credencial
              </label>
              <input
                id="type"
                className="input"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="UniversityDegreeCredential"
                value={type}
                onChange={(event) => setType(event.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="context">
                Contexto (@context)
              </label>
              <input
                id="context"
                className="input input--mono"
                type="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="https://schema.org"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                disabled={submitting}
              />
              {context.trim() && !contextValid && (
                <p className="field__hint" style={{ color: 'var(--danger)' }}>
                  Tiene que ser una URL http/https.
                </p>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="valid-until">
                Válida hasta <span className="text-muted">(opcional)</span>
              </label>
              <input
                id="valid-until"
                className="input"
                type="date"
                value={validUntil}
                onChange={(event) => setValidUntil(event.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="stack stack--tight">
            <span className="section-label">Datos de la credencial</span>
            {claims.map((claim, index) => (
              <div className="input-with-action" key={index}>
                <input
                  className="input"
                  type="text"
                  placeholder="Campo"
                  aria-label={`Nombre del campo ${index + 1}`}
                  autoCapitalize="none"
                  value={claim.key}
                  onChange={(event) => updateClaim(index, { key: event.target.value })}
                  disabled={submitting}
                />
                <input
                  className="input"
                  type="text"
                  placeholder="Valor"
                  aria-label={`Valor del campo ${index + 1}`}
                  value={claim.value}
                  onChange={(event) => updateClaim(index, { value: event.target.value })}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeClaim(index)}
                  aria-label={`Quitar campo ${index + 1}`}
                  disabled={submitting}
                >
                  <XIcon style={{ width: 18, height: 18 }} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button button--ghost button--auto button--small"
              onClick={addClaim}
              disabled={submitting}
            >
              <PlusIcon />
              Agregar campo
            </button>
          </div>

          {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

          <button
            type="submit"
            className="button button--primary"
            disabled={!formValid || submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" />
                Enviando solicitud…
              </>
            ) : (
              'Enviar solicitud'
            )}
          </button>
        </form>

        <section className="stack stack--tight">
          <h2 className="section-label">Mis solicitudes</h2>
          {history.length === 0 ? (
            <EmptyState
              icon={<FilePlusIcon />}
              title="Sin solicitudes"
              text="Las credenciales que solicites van a quedar registradas acá."
            />
          ) : (
            <ul className="stack stack--tight">
              {history.map((record) => (
                <li className="panel" key={record.localId}>
                  <div className="stack stack--tight">
                    <div className="row row--between">
                      <strong>{record.type}</strong>
                      <span className={`badge badge--${statusBadge(record.status)}`}>
                        {STATUS_TEXT[record.status]}
                      </span>
                    </div>
                    <span className="text-small text-muted">
                      {formatDateTime(record.createdAt)}
                    </span>
                    <CopyableValue value={record.issuerDid} label="DID del emisor" />
                    {record.message && (
                      <span className="text-small text-muted">{record.message}</span>
                    )}
                    <button
                      type="button"
                      className="button button--ghost button--auto button--small"
                      onClick={() => discard(record.localId)}
                    >
                      Quitar del historial
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}

const STATUS_TEXT: Record<CredentialRequestRecord['status'], string> = {
  issued: 'Emitida',
  pending: 'Pendiente',
  error: 'Error',
}

function statusBadge(status: CredentialRequestRecord['status']): string {
  if (status === 'issued') return 'valid'
  if (status === 'error') return 'expired'
  return 'pending'
}
