import { cookies } from "next/headers";

import type { TokenResponse } from "./identity-api";

/**
 * The tokens live in httpOnly *session* cookies: no `maxAge`/`expires`, so the
 * browser drops them when it closes and client-side JavaScript can never read
 * them. Tokens are split across cookies instead of packed into one JSON blob
 * because two JWTs can easily blow past the 4KB per-cookie limit.
 */
const ACCESS_TOKEN_COOKIE = "lnid_access_token";
const REFRESH_TOKEN_COOKIE = "lnid_refresh_token";
const DID_COOKIE = "lnid_did";
const EXPIRES_AT_COOKIE = "lnid_expires_at";

const SESSION_COOKIES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  DID_COOKIE,
  EXPIRES_AT_COOKIE,
] as const;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export type Session = {
  accessToken: string;
  refreshToken: string | null;
  did: string | null;
  /** Epoch milliseconds, or null when the API did not report `expires_in`. */
  expiresAt: number | null;
};

/**
 * Persists the token pair. Must be called from a Server Function or Route
 * Handler — Server Components cannot set cookies.
 */
export async function createSession(tokens: TokenResponse): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_TOKEN_COOKIE, tokens.access_token, cookieOptions);

  if (tokens.refresh_token) {
    store.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, cookieOptions);
  }
  if (tokens.did) {
    store.set(DID_COOKIE, tokens.did, cookieOptions);
  }
  if (typeof tokens.expires_in === "number") {
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    store.set(EXPIRES_AT_COOKIE, String(expiresAt), cookieOptions);
  }
}

/**
 * Reads the session. Returns null when there is no access token or when the
 * one we hold has already expired — an expired session is no session.
 *
 * Safe to call from Server Components (it only reads).
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;

  const rawExpiresAt = store.get(EXPIRES_AT_COOKIE)?.value;
  const expiresAt = rawExpiresAt ? Number(rawExpiresAt) : null;
  if (expiresAt && Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    return null;
  }

  return {
    accessToken,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
    did: store.get(DID_COOKIE)?.value ?? null,
    expiresAt: expiresAt && Number.isFinite(expiresAt) ? expiresAt : null,
  };
}

/** Drops every session cookie. Server Function / Route Handler only. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  for (const name of SESSION_COOKIES) {
    store.delete(name);
  }
}
