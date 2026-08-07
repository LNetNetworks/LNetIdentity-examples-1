import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { signIn } from '../auth/session'
import { ShieldCheckIcon } from '../components/Icons'
import { Alert } from '../components/Ui'
import { API_BASE_URL, ApiError } from '../lib/api'
import { clearCredentialCache } from '../hooks/useCredentials'

interface RedirectState {
  from?: string
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      // Los datos cacheados pertenecen a la sesión anterior.
      clearCredentialCache()
      await signIn(user, password)

      const from = (location.state as RedirectState | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo iniciar sesión.')
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__brand">
        <div className="login__logo">
          <ShieldCheckIcon />
        </div>
        <div className="stack stack--tight">
          <h1 className="page-title">Wallet | Identity</h1>
          <p className="page-subtitle">
            Tus credenciales verificables, siempre con vos.
          </p>
        </div>
      </div>

      <form className="stack stack--loose" onSubmit={handleSubmit} noValidate>
        <div className="stack">
          <div className="field">
            <label className="field__label" htmlFor="user">
              Usuario
            </label>
            <input
              id="user"
              className="input"
              type="text"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="usuario@ejemplo.com"
              value={user}
              onChange={(event) => setUser(event.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              required
            />
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <button
          type="submit"
          className="button button--primary"
          disabled={submitting || !user.trim() || !password}
        >
          {submitting ? (
            <>
              <span className="spinner" />
              Ingresando…
            </>
          ) : (
            'Ingresar'
          )}
        </button>
      </form>

      <p className="login__footer">
        Conectado a
        <br />
        <span className="mono">{API_BASE_URL}</span>
      </p>
    </div>
  )
}
