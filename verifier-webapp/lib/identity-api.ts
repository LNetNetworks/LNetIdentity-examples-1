/**
 * Thin client for the Wallet API (Verifiable Credentials).
 *
 * The OpenAPI document declares `/wallet` as the server base path, so every
 * path here is relative to that. See https://dev-identity-dwallet.l-net.io/
 */

export const API_BASE_URL = (
  process.env.IDENTITY_API_BASE_URL ??
  "https://dev-identity-dwallet.l-net.io/wallet"
).replace(/\/+$/, "");

/** `TokenResponse` in the OpenAPI document. */
export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  did?: string;
};

/** `APIError` in the OpenAPI document. */
type ApiErrorBody = {
  code?: number;
  message?: string;
  status?: number;
};

export class IdentityApiError extends Error {
  readonly status: number;
  readonly code?: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = "IdentityApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new IdentityApiError(
      "No se pudo contactar al servicio de identidad.",
      0,
    );
  }

  const raw = await response.text();
  const body: unknown = raw ? safeJsonParse(raw) : null;

  if (!response.ok) {
    const error = (body ?? {}) as ApiErrorBody;
    throw new IdentityApiError(
      error.message ?? `La API respondió ${response.status}.`,
      error.status ?? response.status,
      error.code,
    );
  }

  return body as T;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** `POST /login` — exchanges credentials for an access + refresh token pair. */
export function login(user: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ user, password }),
  });
}

/** `POST /logout` — invalidates the refresh token server-side. */
export function logout(
  accessToken: string,
  refreshToken: string,
): Promise<unknown> {
  return request<unknown>("/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
