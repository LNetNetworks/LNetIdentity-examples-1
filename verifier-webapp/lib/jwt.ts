/**
 * Minimal JWT payload reader.
 *
 * The signature is deliberately *not* verified: the token is read only to gate
 * the UI, and it reaches us over TLS straight from the API inside a
 * server-side fetch. Every actual authorization decision stays with the Wallet
 * API, which validates the token on each call.
 */

export type JwtPayload = {
  /** Expiry, in seconds since the epoch. */
  exp?: number;
  /** Keycloak realm-wide roles. */
  realm_access?: { roles?: string[] };
  /** Keycloak per-client roles, keyed by client id (e.g. `d-wallet-cli`). */
  resource_access?: Record<string, { roles?: string[] }>;
  preferred_username?: string;
  [claim: string]: unknown;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;

  try {
    const json = Buffer.from(segments[1], "base64url").toString("utf8");
    const payload: unknown = JSON.parse(json);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

function asRoleList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((role): role is string => typeof role === "string");
}

/**
 * Every role in the token, from both realm and client scopes.
 *
 * This deployment puts the interesting ones under the `d-wallet-cli` client
 * (`resource_access["d-wallet-cli"].roles`), but the client id is not treated
 * as load-bearing here — collecting across all of them keeps the check working
 * if the API is pointed at a different Keycloak client.
 */
export function rolesFrom(payload: JwtPayload): string[] {
  const roles = new Set<string>();

  for (const role of asRoleList(payload.realm_access?.roles)) {
    roles.add(role.toLowerCase());
  }

  const resourceAccess = payload.resource_access;
  if (resourceAccess && typeof resourceAccess === "object") {
    for (const client of Object.values(resourceAccess)) {
      for (const role of asRoleList(client?.roles)) {
        roles.add(role.toLowerCase());
      }
    }
  }

  return [...roles];
}
