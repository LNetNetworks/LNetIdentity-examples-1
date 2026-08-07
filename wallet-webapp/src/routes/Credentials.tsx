import { useNavigate } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { AppShell } from '../components/AppShell'
import { CredentialCard } from '../components/CredentialCard'
import { InboxIcon, RefreshIcon, ScanIcon } from '../components/Icons'
import { InstallBanner } from '../components/InstallBanner'
import { WalletSetup } from '../components/WalletSetup'
import { Alert, EmptyState } from '../components/Ui'
import { getCachedDetail, useHolderCredentials } from '../hooks/useCredentials'
import { credentialStatus, validUntil } from '../lib/credentials'

export function Credentials() {
  const session = useSession()
  const navigate = useNavigate()
  const holderDid = session?.did ?? null

  const { credentials, loading, error, refreshing, reload } = useHolderCredentials(holderDid)

  const refreshAction = holderDid ? (
    <button
      type="button"
      className="icon-button"
      onClick={reload}
      disabled={loading || refreshing}
      aria-label="Actualizar credenciales"
    >
      {refreshing ? <span className="spinner" /> : <RefreshIcon />}
    </button>
  ) : undefined

  return (
    <AppShell title="Mis credenciales" showNav action={refreshAction}>
      {!holderDid ? (
        <WalletSetup />
      ) : (
        <>
          <InstallBanner />

          {error && <Alert tone="error">{error}</Alert>}

          {loading ? (
            <div className="stack">
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : credentials.length === 0 && !error ? (
            <EmptyState
              icon={<InboxIcon />}
              title="Todavía no tenés credenciales"
              text="Cuando un emisor te envíe una credencial verificable, va a aparecer acá."
              action={
                <button
                  type="button"
                  className="button button--secondary button--auto"
                  onClick={() => navigate('/request')}
                >
                  Solicitar una credencial
                </button>
              }
            />
          ) : (
            <>
              <div className="row row--between">
                <span className="section-label">
                  {credentials.length}{' '}
                  {credentials.length === 1 ? 'credencial' : 'credenciales'}
                </span>
                <button
                  type="button"
                  className="button button--ghost button--auto button--small"
                  onClick={() => navigate('/scan')}
                >
                  <ScanIcon />
                  Compartir
                </button>
              </div>

              <ul className="stack">
                {credentials.map((credential) => {
                  // Si el detalle ya se cargó antes, la tarjeta muestra la vigencia.
                  const detail = getCachedDetail(holderDid, credential.id)
                  return (
                    <li key={credential.id}>
                      <CredentialCard
                        type={detail?.type ?? credential.type}
                        issuerDid={credential.did_issuer}
                        status={detail ? credentialStatus(detail) : undefined}
                        validUntil={validUntil(detail ?? undefined)}
                        onClick={() => navigate(`/credential/${encodeURIComponent(credential.id)}`)}
                      />
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </>
      )}
    </AppShell>
  )
}
