import { useState } from 'react'
import { setWalletDid } from '../auth/session'
import { ApiError } from '../lib/api'
import { provisionWallet } from '../lib/wallet'
import { KeyIcon } from './Icons'
import { Alert } from './Ui'

/** Onboarding para usuarios que todavía no tienen una wallet DID asociada. */
export function WalletSetup() {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    setCreating(true)
    setError(null)
    try {
      const did = await provisionWallet()
      setWalletDid(did)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo crear la wallet.')
      setCreating(false)
    }
  }

  return (
    <div className="stack">
      <div className="empty-state">
        <div className="empty-state__icon">
          <KeyIcon />
        </div>
        <p className="empty-state__title">Todavía no tenés una wallet</p>
        <p className="empty-state__text">
          Necesitás un DID para recibir y compartir credenciales verificables. Se crea una
          sola vez y queda asociado a tu usuario.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <button type="button" className="button button--primary" onClick={create} disabled={creating}>
        {creating ? (
          <>
            <span className="spinner" />
            Creando wallet…
          </>
        ) : (
          'Crear mi wallet'
        )}
      </button>
    </div>
  )
}
