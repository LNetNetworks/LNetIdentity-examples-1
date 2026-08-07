import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../auth/session'
import { useSession } from '../auth/useSession'
import { AppShell } from '../components/AppShell'
import { LogOutIcon, ShieldCheckIcon } from '../components/Icons'
import { WalletSetup } from '../components/WalletSetup'
import { Alert, CopyableValue, DataRow } from '../components/Ui'
import { clearCredentialCache } from '../hooks/useCredentials'
import { API_BASE_URL } from '../lib/api'
import { formatDateTime } from '../lib/credentials'

export function Profile() {
  const session = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    clearCredentialCache()
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell title="Perfil" showNav>
      <div className="stack stack--loose">
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="login__logo" style={{ width: 62, height: 62, borderRadius: 18 }}>
            <ShieldCheckIcon style={{ width: 30, height: 30 }} />
          </div>
          <div className="stack stack--tight">
            <strong style={{ fontSize: 19 }}>{session?.displayName ?? '—'}</strong>
            {session?.roles.length ? (
              <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                {session.roles.map((role) => (
                  <span className="badge" key={role}>
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-small text-muted">Sin roles declarados en el token</span>
            )}
          </div>
        </div>

        {session && !session.did && <WalletSetup />}

        <section className="stack stack--tight">
          <h2 className="section-label">Mi identidad</h2>
          <div className="panel panel--flush">
            <div className="data-list">
              <DataRow label="Usuario">{session?.user ?? '—'}</DataRow>
              <DataRow label="DID del titular">
                {session?.did ? (
                  <CopyableValue value={session.did} label="Mi DID" />
                ) : (
                  <span className="text-muted">Sin wallet creada</span>
                )}
              </DataRow>
              <DataRow label="Sesión válida hasta">
                {session?.expiresAt
                  ? formatDateTime(new Date(session.expiresAt).toISOString())
                  : 'Sin vencimiento declarado'}
              </DataRow>
            </div>
          </div>
        </section>

        <section className="stack stack--tight">
          <h2 className="section-label">Servicio</h2>
          <div className="panel panel--flush">
            <div className="data-list">
              <DataRow label="API D-Wallet" mono>
                {API_BASE_URL}
              </DataRow>
            </div>
          </div>
        </section>

        <Alert tone="info">
          Tus credenciales no se guardan en el dispositivo: se consultan al servicio D-Wallet
          cada vez que abrís la wallet.
        </Alert>

        <button
          type="button"
          className="button button--danger"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <>
              <span className="spinner" />
              Cerrando sesión…
            </>
          ) : (
            <>
              <LogOutIcon />
              Cerrar sesión
            </>
          )}
        </button>
      </div>
    </AppShell>
  )
}
