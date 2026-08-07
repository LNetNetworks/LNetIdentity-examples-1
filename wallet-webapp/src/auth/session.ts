import * as api from '../lib/api'
import { decodeJwt, extractDidFromToken, extractDisplayName, extractRoles } from '../lib/jwt'
import { readJson, remove, writeJson } from '../lib/storage'

const STORAGE_KEY = 'piw.session.v1'

export interface Session {
  accessToken: string
  refreshToken: string | null
  /** DID de la wallet del holder. `null` si el usuario todavía no tiene wallet. */
  did: string | null
  /** Identificador con el que inició sesión. */
  user: string
  displayName: string
  roles: string[]
  /** Epoch ms de expiración del access token. `null` si no se pudo determinar. */
  expiresAt: number | null
}

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

let current: Session | null = loadInitialSession()
const listeners = new Set<() => void>()

function loadInitialSession(): Session | null {
  const stored = readJson<Session>(STORAGE_KEY)
  if (!stored?.accessToken) return null
  if (isExpired(stored)) {
    remove(STORAGE_KEY)
    return null
  }
  return stored
}

function emit() {
  for (const listener of listeners) listener()
}

function setSession(next: Session | null) {
  current = next
  if (next) writeJson(STORAGE_KEY, next)
  else remove(STORAGE_KEY)
  emit()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSession(): Session | null {
  return current
}

export function isExpired(session: Session | null): boolean {
  if (!session) return true
  if (session.expiresAt === null) return false
  // Margen de 15s para no disparar una request con un token a punto de vencer.
  return Date.now() >= session.expiresAt - 15_000
}

/** Limpia la sesión si el token ya venció. Devuelve `true` si la cerró. */
export function enforceExpiry(): boolean {
  if (current && isExpired(current)) {
    setSession(null)
    return true
  }
  return false
}

/* El cliente API se conecta al store en tiempo de import, antes de cualquier
 * render, para que ningún efecto pueda disparar una request sin token. */
api.configureApi({
  getAccessToken: () => (isExpired(current) ? null : current?.accessToken ?? null),
  onUnauthorized: () => setSession(null),
})

/* -------------------------------------------------------------------------- */
/* Acciones                                                                    */
/* -------------------------------------------------------------------------- */

export async function signIn(user: string, password: string): Promise<Session> {
  const tokens = await api.login({ user: user.trim(), password })
  if (!tokens?.access_token) {
    throw new api.ApiError('El servicio no devolvió un token de acceso.', 500)
  }

  const payload = decodeJwt(tokens.access_token)

  const session: Session = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    did: tokens.did ?? extractDidFromToken(payload),
    user: user.trim(),
    displayName: extractDisplayName(payload, user.trim()),
    roles: extractRoles(payload),
    expiresAt: resolveExpiry(payload?.exp, tokens.expires_in),
  }

  setSession(session)
  return session
}

function resolveExpiry(exp: number | undefined, expiresIn: number | undefined): number | null {
  if (typeof exp === 'number' && Number.isFinite(exp)) return exp * 1000
  if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
    return Date.now() + expiresIn * 1000
  }
  return null
}

export async function signOut(): Promise<void> {
  const session = current
  // La sesión local se cierra siempre, aunque el backend falle.
  try {
    if (session?.refreshToken && !isExpired(session)) {
      await api.logout(session.refreshToken)
    }
  } catch {
    /* Cerrar sesión nunca debe quedar bloqueado por un error de red. */
  } finally {
    setSession(null)
  }
}

/** Guarda el DID recién creado para el usuario autenticado. */
export function setWalletDid(did: string): void {
  if (!current) return
  setSession({ ...current, did })
}
