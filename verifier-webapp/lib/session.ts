import { cookies } from "next/headers";

import type { TokenResponse } from "./identity-api";
import { decodeJwtPayload, rolesFrom } from "./jwt";

/** Role required to use this portal. Keycloak reports it lower-cased. */
export const VERIFIER_ROLE = "verifier";

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
  /** Epoch milliseconds, or null when the token carried no expiry. */
  expiresAt: number | null;
  roles: string[];
};

/** Roles carried by an access token, or `[]` if it cannot be read. */
export function rolesOf(accessToken: string): string[] {
  const payload = decodeJwtPayload(accessToken);
  return payload ? rolesFrom(payload) : [];
}

/** Whether an access token grants the verifier role. */
export function hasVerifierRole(accessToken: string): boolean {
  return rolesOf(accessToken).includes(VERIFIER_ROLE);
}

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

  // The token's own `exp` beats `expires_in`, which is only relative to a
  // request whose round-trip time we do not know.
  const exp = decodeJwtPayload(tokens.access_token)?.exp;
  const expiresAt =
    typeof exp === "number"
      ? exp * 1000
      : typeof tokens.expires_in === "number"
        ? Date.now() + tokens.expires_in * 1000
        : null;

  if (expiresAt !== null) {
    store.set(EXPIRES_AT_COOKIE, String(expiresAt), cookieOptions);
  }
}

/**
 * Reads the session. Returns null when there is no access token, when the one
 * we hold has already expired, or when it lacks the verifier role.
 *
 * Re-checking the role here rather than only at login keeps `/` and `/login`
 * on one definition of "logged in" — otherwise a role-less session would make
 * them redirect at each other forever.
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

  const roles = rolesOf(accessToken);
  if (!roles.includes(VERIFIER_ROLE)) return null;

  return {
    accessToken,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
    did: store.get(DID_COOKIE)?.value ?? null,
    expiresAt: expiresAt && Number.isFinite(expiresAt) ? expiresAt : null,
    roles,
  };
}

/** Drops every session cookie. Server Function / Route Handler only. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  for (const name of SESSION_COOKIES) {
    store.delete(name);
  }
}
