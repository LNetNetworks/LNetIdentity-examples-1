/** Utilidades para leer (sin verificar) el payload del access token de Keycloak. */

export interface JwtPayload {
  exp?: number
  iat?: number
  sub?: string
  name?: string
  email?: string
  preferred_username?: string
  did?: string
  realm_access?: { roles?: string[] }
  resource_access?: Record<string, { roles?: string[] }>
  [k: string]: unknown
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  // Reconstruye UTF-8 para no romper acentos en nombres de usuario.
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Decodifica el payload del JWT. Devuelve `null` si el token es ilegible. */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    return JSON.parse(base64UrlDecode(payload)) as JwtPayload
  } catch {
    return null
  }
}

/** Roles de realm + de cliente, deduplicados y en minúsculas. */
export function extractRoles(payload: JwtPayload | null): string[] {
  if (!payload) return []
  const roles = [...(payload.realm_access?.roles ?? [])]
  for (const client of Object.values(payload.resource_access ?? {})) {
    roles.push(...(client.roles ?? []))
  }
  const interesting = roles
    .map((role) => role.toLowerCase())
    // Keycloak agrega roles internos que no aportan nada en la UI.
    .filter((role) => !role.startsWith('default-roles') && !['offline_access', 'uma_authorization'].includes(role))
  return [...new Set(interesting)]
}

/** Nombre legible del usuario a partir del token. */
export function extractDisplayName(payload: JwtPayload | null, fallback: string): string {
  if (!payload) return fallback
  return payload.name || payload.preferred_username || payload.email || fallback
}

/**
 * Busca el DID de la wallet dentro del token. La respuesta de `/login` ya trae
 * `did`, pero algunos realms lo exponen como claim, así que sirve de respaldo.
 */
export function extractDidFromToken(payload: JwtPayload | null): string | null {
  if (!payload) return null
  const candidates = [payload.did, payload.wallet_did, payload.walletDid]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('did:')) return candidate
  }
  return null
}
