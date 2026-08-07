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

interface ApiErrorContext {
  code?: number
  /** Mensaje tal cual lo devolvió el servicio, sin normalizar. */
  rawMessage?: string
  /** `POST /shareverify/did:lac:…`, para identificar qué llamada falló. */
  endpoint?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: number
  readonly rawMessage?: string
  readonly endpoint?: string

  constructor(message: string, status: number, context: ApiErrorContext = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = context.code
    this.rawMessage = context.rawMessage
    this.endpoint = context.endpoint
  }

  /**
   * Detalle técnico para mostrar y copiar cuando el mensaje amigable no alcanza.
   * El prefijo `ERR_…` que devuelve el servicio suele ser lo más diagnóstico,
   * así que acá se conserva entero.
   */
  get details(): string {
    const lines = [`HTTP ${this.status}`]
    if (this.endpoint) lines.push(this.endpoint)
    if (typeof this.code === 'number') lines.push(`code: ${this.code}`)
    if (this.rawMessage && this.rawMessage !== this.message) lines.push(this.rawMessage)
    return lines.join('\n')
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
  const endpoint = `${method} ${path}`

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = getAccessToken()
    if (!token) {
      handleUnauthorized()
      throw new ApiError('Tu sesión expiró. Iniciá sesión nuevamente.', 401, { endpoint })
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
    // Acá caen también los bloqueos por CORS y por mixed content, que el
    // navegador reporta como un TypeError sin detalle.
    console.error('[api] fallo de red', { endpoint, url: `${API_BASE_URL}${path}`, error })
    throw new ApiError(
      'No se pudo conectar con el servicio. Revisá tu conexión e intentá de nuevo.',
      0,
      { endpoint, rawMessage: error instanceof Error ? error.message : String(error) },
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
    const rawMessage =
      isRecord(parsed) && typeof parsed.message === 'string'
        ? parsed.message
        : typeof parsed === 'string'
          ? parsed
          : undefined

    // Sin esto, un fallo en el teléfono es indepurable: no hay DevTools a mano.
    console.error('[api] respuesta de error', {
      endpoint,
      status: response.status,
      body: parsed,
    })

    throw new ApiError(extractErrorMessage(parsed, response.status), response.status, {
      code: isRecord(parsed) && typeof parsed.code === 'number' ? parsed.code : undefined,
      rawMessage,
      endpoint,
    })
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
  // El servicio devuelve `ERR_CREDENTIAL_REGISTRY: The role is undefined` cuando no
  // logra resolver el rol del usuario. Tal cual, parece un error de la app.
  if (/role is undefined|the role is not defined/i.test(rawMessage)) {
    return 'El servicio no pudo determinar el rol de tu usuario. Es una configuración de la cuenta en el backend, no un problema de la wallet.'
  }
  if (/role/i.test(rawMessage) && status === 403) {
    return 'Tu usuario no tiene el rol necesario para esta operación.'
  }
  if (rawMessage) {
    // Los mensajes vienen prefijados tipo `ERR_KEYCLOAK_...: detalle`. Se recorta
    // para la UI, pero el original queda en `ApiError.rawMessage`.
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
  const result = await request<unknown>(`/holder/${encodeDidSegment(holderDid)}`, { signal })
  return normalizeCredentialList(result)
}

/**
 * El OpenAPI declara `[{id, did_issuer, type}]`, pero este deployment ya demostró
 * apartarse del spec (documenta 401 y devuelve 500). Si el `id` viniera con otro
 * nombre, `id_vc` viajaría como `undefined` y compartir fallaría sin explicación,
 * así que se normalizan las variantes habituales y se avisa por consola.
 */
function normalizeCredentialList(payload: unknown): CredentialSummaryHolder[] {
  const items = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : isRecord(payload) && Array.isArray(payload.credentials)
        ? payload.credentials
        : []

  if (!Array.isArray(payload) && items.length > 0) {
    console.warn('[api] GET /holder/{did} devolvió un objeto envolvente, no un arreglo')
  }

  const normalized: CredentialSummaryHolder[] = []

  for (const item of items) {
    if (!isRecord(item)) continue

    const id = readId(item)
    if (!id) {
      console.warn(
        '[api] credencial sin id utilizable; claves recibidas:',
        Object.keys(item).join(', '),
      )
      continue
    }
    if (!('id' in item)) {
      console.warn(`[api] el id de la credencial vino en otro campo, no en "id" (${id})`)
    }

    normalized.push({
      id,
      did_issuer: readString(item, ['did_issuer', 'didIssuer', 'issuer', 'did_emisor']),
      type: readString(item, ['type', 'credentialType', 'tipo']),
    })
  }

  return normalized
}

/** Acepta `id`, `_id` y la forma `{$oid}` que emite Mongo al serializar. */
function readId(item: Record<string, unknown>): string | undefined {
  for (const key of ['id', '_id', 'idVc', 'id_vc', 'vcId']) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (isRecord(value) && typeof value.$oid === 'string') return value.$oid
  }
  return undefined
}

function readString(
  item: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    // `type` puede llegar como el arreglo completo de tipos W3C.
    if (Array.isArray(value)) {
      const first = value.find(
        (entry) => typeof entry === 'string' && entry && entry !== 'VerifiableCredential',
      )
      if (typeof first === 'string') return first
    }
    if (isRecord(value) && typeof value.id === 'string') return value.id
  }
  return undefined
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
