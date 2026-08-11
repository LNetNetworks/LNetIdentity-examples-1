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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}`;
    throw new APIError(message, body?.code, res.status);
  }
  return body as T;
}
