import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { AppShell } from '../components/AppShell'
import { CredentialCard } from '../components/CredentialCard'
import { CheckIcon, InboxIcon, ShareIcon, XIcon } from '../components/Icons'
import { Alert, CopyableValue, DataRow, EmptyState, Loading } from '../components/Ui'
import { getCachedDetail, useHolderCredentials } from '../hooks/useCredentials'
import * as api from '../lib/api'
import { credentialStatus, humanizeType, validUntil } from '../lib/credentials'
import { isDid } from '../lib/qr'

type Phase = 'select' | 'sending' | 'success' | 'error'

interface ShareState {
  credentialId?: string
}

export function Share() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const session = useSession()

  const holderDid = session?.did ?? null
  const verifierDid = searchParams.get('verifier')?.trim() ?? ''
  const verifierIsValid = isDid(verifierDid)

  const { credentials, loading, error: listError } = useHolderCredentials(
    verifierIsValid ? holderDid : null,
  )

  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as ShareState | null)?.credentialId ?? null,
  )
  const [phase, setPhase] = useState<Phase>('select')
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  // Con una sola credencial no tiene sentido obligar a elegir.
  useEffect(() => {
    if (selectedId === null && credentials.length === 1) {
      setSelectedId(credentials[0].id)
    }
  }, [credentials, selectedId])

  const selected = credentials.find((credential) => credential.id === selectedId) ?? null

  const submit = async () => {
    if (!holderDid || !selectedId || !verifierIsValid) return

    setPhase('sending')
    setResultMessage(null)

    try {
      const response = await api.shareVerify(verifierDid, {
        did_holder: holderDid,
        id_vc: selectedId,
      })
      setResultMessage(response?.message ?? null)
      setPhase('success')
      navigator.vibrate?.([40, 60, 40])
    } catch (cause) {
      setResultMessage(
        cause instanceof api.ApiError
          ? cause.message
          : 'No se pudo compartir la credencial. Intentá de nuevo.',
      )
      setPhase('error')
    }
  }

  /* ---------------------------------------------------------------------- */

  if (!verifierIsValid) {
    return (
      <AppShell title="Compartir credencial" back="/scan">
        <Alert tone="error">
          El código escaneado no contiene un DID de verificador válido. Volvé a escanear el QR.
        </Alert>
        <button type="button" className="button button--secondary" onClick={() => navigate('/scan')}>
          Volver a escanear
        </button>
      </AppShell>
    )
  }

  if (phase === 'success' || phase === 'error') {
    const success = phase === 'success'
    return (
      <AppShell title="Compartir credencial" back="/">
        <div className="result">
          <div className={`result__icon result__icon--${success ? 'success' : 'error'}`}>
            {success ? <CheckIcon strokeWidth={3} /> : <XIcon strokeWidth={3} />}
          </div>
          <h2 className="result__title">
            {success ? 'Credencial compartida' : 'No se pudo compartir'}
          </h2>
          <p className="result__text">
            {success
              ? `Se envió la presentación verificable de “${humanizeType(selected?.type)}” al verificador.`
              : resultMessage}
          </p>
        </div>

        <div className="panel panel--flush">
          <div className="data-list">
            <DataRow label="Verificador">
              <CopyableValue value={verifierDid} label="DID del verificador" />
            </DataRow>
            {selectedId && (
              <DataRow label="Credencial enviada">
                <span>{humanizeType(selected?.type)}</span>
              </DataRow>
            )}
            {success && resultMessage && (
              <DataRow label="Respuesta del servicio">{resultMessage}</DataRow>
            )}
          </div>
        </div>

        <div className="stack stack--tight">
          {!success && (
            <button
              type="button"
              className="button button--primary"
              onClick={() => setPhase('select')}
            >
              Reintentar
            </button>
          )}
          <button type="button" className="button button--secondary" onClick={() => navigate('/')}>
            Volver a mis credenciales
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Compartir credencial" back="/scan">
      <div className="stack stack--loose">
        <section className="stack stack--tight">
          <h2 className="section-label">Verificador</h2>
          <div className="panel">
            <CopyableValue value={verifierDid} label="DID del verificador" />
          </div>
          <p className="field__hint">
            Vas a generar una presentación verificable (VP) firmada con tu DID y enviarla a
            este verificador.
          </p>
        </section>

        <section className="stack stack--tight">
          <h2 className="section-label">Elegí qué credencial compartir</h2>

          {listError && <Alert tone="error">{listError}</Alert>}

          {loading ? (
            <Loading label="Buscando tus credenciales…" />
          ) : credentials.length === 0 ? (
            <EmptyState
              icon={<InboxIcon />}
              title="No tenés credenciales para compartir"
              text="Necesitás al menos una credencial verificable en tu wallet."
            />
          ) : (
            <ul className="stack">
              {credentials.map((credential) => {
                const detail = getCachedDetail(holderDid ?? '', credential.id)
                return (
                  <li key={credential.id}>
                    <CredentialCard
                      type={detail?.type ?? credential.type}
                      issuerDid={credential.did_issuer}
                      status={detail ? credentialStatus(detail) : undefined}
                      validUntil={validUntil(detail ?? undefined)}
                      selectable
                      selected={selectedId === credential.id}
                      onClick={() => setSelectedId(credential.id)}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {credentials.length > 0 && (
          <button
            type="button"
            className="button button--primary"
            onClick={submit}
            disabled={!selectedId || phase === 'sending'}
          >
            {phase === 'sending' ? (
              <>
                <span className="spinner" />
                Enviando presentación…
              </>
            ) : (
              <>
                <ShareIcon />
                Compartir credencial
              </>
            )}
          </button>
        )}
      </div>
    </AppShell>
  )
}
