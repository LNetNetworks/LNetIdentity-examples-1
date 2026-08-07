import type {
  CredentialSummaryHolder,
  IssueRequest,
  IssueResponse,
  LoginRequest,
  ShareVCResponse,
  TokenResponse,
  VCDetail,
  WalletResponse,
} from './types'

export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'https://dev-identity-dwallet.l-net.io/wallet'
).replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code?: number

  constructor(message: string, status: number, code?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  /** El token expiró o no es válido: hay que volver a iniciar sesión. */
  get isUnauthorized() {
    return this.status === 401
  }

  /** El usuario está autenticado pero su rol no habilita la operación. */
  get isForbidden() {
    return this.status === 403
  }
}

/**
 * Los DIDs (`did:lac:openprotest:0x…`) viajan como segmento de path. Los `:` son
 * caracteres válidos en un path segment según RFC 3986 y es la forma en la que el
 * propio servicio publica sus URLs (p. ej. el QR de verificación), así que se
 * codifica todo excepto los dos puntos.
 */
export function encodeDidSegment(did: string): string {
  return encodeURIComponent(did.trim()).replace(/%3A/gi, ':')
}

type TokenGetter = () => string | null

let getAccessToken: TokenGetter = () => null
let handleUnauthorized: () => void = () => {}

/** Conecta el cliente con la sesión activa (lo llama el AuthProvider). */
export function configureApi(options: {
  getAccessToken: TokenGetter
  onUnauthorized: () => void
}) {
  getAccessToken = options.getAccessToken
  handleUnauthorized = options.onUnauthorized
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  /** Por defecto todas las llamadas envían el bearer token. */
  auth?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = getAccessToken()
    if (!token) {
      handleUnauthorized()
      throw new ApiError('Tu sesión expiró. Iniciá sesión nuevamente.', 401)
    }
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(
      'No se pudo conectar con el servicio. Revisá tu conexión e intentá de nuevo.',
      0,
    )
  }

  const raw = await response.text()
  let parsed: unknown = undefined
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, response.status),
      response.status,
      isRecord(parsed) && typeof parsed.code === 'number' ? parsed.code : undefined,
    )
  }

  return parsed as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * La API responde `{code, message, status}` o `{message}`. Además, Keycloak
 * devuelve credenciales inválidas como 500, así que se normaliza a algo legible.
 */
function extractErrorMessage(body: unknown, status: number): string {
  const rawMessage = isRecord(body) && typeof body.message === 'string' ? body.message : ''

  if (/invalid user credentials/i.test(rawMessage)) {
    return 'Usuario o contraseña incorrectos.'
  }
  if (rawMessage) {
    // Los mensajes vienen prefijados tipo `ERR_KEYCLOAK_...: detalle`.
    const withoutCode = rawMessage.replace(/^[A-Z_]+:\s*/, '')
    return withoutCode || rawMessage
  }
  if (typeof body === 'string' && body.trim()) return body.trim()

  switch (status) {
    case 401:
      return 'Tu sesión expiró. Iniciá sesión nuevamente.'
    case 403:
      return 'Tu usuario no tiene el rol necesario para esta operación.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 422:
      return 'La credencial no es válida.'
    default:
      return `El servicio respondió con un error (${status}).`
  }
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

export function login(credentials: LoginRequest) {
  return request<TokenResponse>('/login', {
    method: 'POST',
    body: credentials,
    auth: false,
  })
}

export function logout(refreshToken: string) {
  return request<unknown>('/logout', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  })
}

/* -------------------------------------------------------------------------- */
/* Wallet                                                                      */
/* -------------------------------------------------------------------------- */

export function createWallet() {
  return request<WalletResponse>('/', { method: 'POST' })
}

export function createWalletId() {
  return request<{ did?: string; address?: string }>('/wallet-id', { method: 'POST' })
}

export function createWalletDocument() {
  return request<{ did?: string }>('/wallet-document', { method: 'POST' })
}

/* -------------------------------------------------------------------------- */
/* Holder                                                                      */
/* -------------------------------------------------------------------------- */

export async function listHolderCredentials(
  holderDid: string,
  signal?: AbortSignal,
): Promise<CredentialSummaryHolder[]> {
  const result = await request<CredentialSummaryHolder[] | null>(
    `/holder/${encodeDidSegment(holderDid)}`,
    { signal },
  )
  return Array.isArray(result) ? result : []
}

export function getHolderCredential(holderDid: string, id: string, signal?: AbortSignal) {
  return request<VCDetail>(
    `/holder/${encodeDidSegment(holderDid)}/id/${encodeURIComponent(id)}`,
    { signal },
  )
}

/**
 * Verifica la VC y, si es válida, la comparte con el verifier como Verifiable
 * Presentation. Es el endpoint al que apunta el QR del verificador.
 */
export function shareVerify(
  verifierDid: string,
  payload: { did_holder: string; id_vc: string },
) {
  return request<ShareVCResponse>(`/shareverify/${encodeDidSegment(verifierDid)}`, {
    method: 'POST',
    body: payload,
  })
}

/** Comparte la VC como VP sin la verificación previa de `shareverify`. */
export function share(payload: {
  did_holder: string
  id_vc: string
  did_receiver: string
}) {
  return request<ShareVCResponse>('/share', { method: 'POST', body: payload })
}

/* -------------------------------------------------------------------------- */
/* Emisión                                                                     */
/* -------------------------------------------------------------------------- */

export function issueCredential(payload: IssueRequest) {
  return request<IssueResponse>('/vc', { method: 'POST', body: payload })
}
