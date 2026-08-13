import { APIError, type WalletBackend, type WalletSettings } from '../types';

// The Swagger UI documents this service without its real base path; verified
// against the live deployment that every route actually lives under /wallet.
// Override with VITE_IDENTITY_API_BASE_URL (see .env.example) for a different environment.
export const DEFAULT_DWALLET_API_BASE =
  import.meta.env.VITE_IDENTITY_API_BASE_URL || 'https://dev-identity-dwallet.l-net.io/wallet';
export const DEFAULT_SSI_VC_API_BASE =
  import.meta.env.VITE_SSI_VC_API_BASE_URL || 'https://dev-identity-api.l-net.io/';
export const API_BASE = DEFAULT_DWALLET_API_BASE;

let activeBackend: WalletBackend = 'dwallet';
let apiBaseUrls: Record<WalletBackend, string> = {
  dwallet: DEFAULT_DWALLET_API_BASE,
  'ssi-vc': DEFAULT_SSI_VC_API_BASE,
};

export function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getApiBase(backend: WalletBackend = activeBackend): string {
  return normalizeApiBaseUrl(apiBaseUrls[backend]);
}

export function getActiveBackend(): WalletBackend {
  return activeBackend;
}

export function getActiveApiBase(): string {
  return getApiBase(activeBackend);
}

export function configureApiClient(settings: WalletSettings | null) {
  activeBackend = settings?.activeBackend || 'dwallet';
  apiBaseUrls = {
    dwallet: normalizeApiBaseUrl(settings?.dwalletApiBaseUrl || DEFAULT_DWALLET_API_BASE),
    'ssi-vc': normalizeApiBaseUrl(settings?.ssiVcApiBaseUrl || DEFAULT_SSI_VC_API_BASE),
  };
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// The wallet API wraps Keycloak and reports an expired/invalid token as a 200-shaped
// error body whose `message` is prefixed with this code (e.g. "ERR_KEYCLOAK_AUTHENTICATE:
// An unexpected error occurred: jwt expired") rather than a distinct `code` field or a
// clean 401 — verified live, not documented in the Swagger UI. AuthContext registers a
// handler here so a stale token forces a re-login instead of surfacing as a raw error.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  apiBaseUrl = getActiveApiBase(),
): Promise<T> {
  const endpoint = `${normalizeApiBaseUrl(apiBaseUrl)}${path}`;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(endpoint, { ...options, headers });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const errorBody = body && typeof body === 'object'
      ? body as Record<string, unknown>
      : null;
    const backendMessage = typeof errorBody?.message === 'string' ? errorBody.message : '';
    if (backendMessage.startsWith('ERR_KEYCLOAK_AUTHENTICATE')) onUnauthorized?.();
    throw new APIError({
      code: errorBody?.code,
      status: res.status,
      statusText: res.statusText,
      method,
      endpoint,
      response: body,
    });
  }
  return body as T;
}
