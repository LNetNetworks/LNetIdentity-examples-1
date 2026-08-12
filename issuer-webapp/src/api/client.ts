import { APIError } from '../types';

// The Swagger UI documents this service without its real base path; verified
// against the live deployment that every route actually lives under /wallet.
// Override with VITE_IDENTITY_API_BASE_URL (see .env.example) for a different environment.
export const API_BASE = import.meta.env.VITE_IDENTITY_API_BASE_URL || 'https://dev-identity-dwallet.l-net.io/wallet';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = `${API_BASE}${path}`;
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
