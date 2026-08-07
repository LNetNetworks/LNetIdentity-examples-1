"use server";

import {
  IdentityApiError,
  listReceivedPresentations,
  type CredentialSummary,
} from "@/lib/identity-api";
import { getSession } from "@/lib/session";

/** How many of the most recent presentations the panel shows. */
const RECENT_LIMIT = 5;

export type ReceivedCredential = {
  id: string;
  holder: string | null;
  type: string | null;
  /** Epoch milliseconds recovered from the id, or null if it carried none. */
  receivedAt: number | null;
};

export type CredentialsState =
  | { status: "idle" }
  | { status: "ready"; credentials: ReceivedCredential[] }
  | { status: "error"; error: string };

/**
 * `GET /verifier/{did}` returns every presentation ever received, with no
 * timestamp and no documented ordering. The ids are MongoDB ObjectIds, whose
 * leading four bytes are the creation time in seconds — so when every id parses
 * we sort newest-first and can show when each one arrived. Otherwise we fall
 * back to the API's own ordering, read as oldest-first.
 */
export async function listRecentCredentialsAction(): Promise<CredentialsState> {
  const session = await getSession();
  if (!session) {
    return {
      status: "error",
      error: "Tu sesión expiró. Iniciá sesión otra vez.",
    };
  }
  if (!session.did) {
    return {
      status: "error",
      error: "La sesión no tiene un DID de verificador asociado.",
    };
  }

  let received: CredentialSummary[];
  try {
    received = await listReceivedPresentations(session.accessToken, session.did);
  } catch (error) {
    if (error instanceof IdentityApiError) {
      return { status: "error", error: messageFor(error) };
    }
    throw error;
  }

  if (!Array.isArray(received)) {
    return { status: "ready", credentials: [] };
  }

  const credentials: ReceivedCredential[] = received.map((summary, index) => ({
    id: summary.id ?? `sin-id-${index}`,
    holder: summary.did_holder ?? null,
    type: summary.type ?? null,
    receivedAt: objectIdTimestamp(summary.id),
  }));

  const newestFirst = credentials.every((c) => c.receivedAt !== null)
    ? [...credentials].sort((a, b) => b.receivedAt! - a.receivedAt!)
    : [...credentials].reverse();

  return { status: "ready", credentials: newestFirst.slice(0, RECENT_LIMIT) };
}

function objectIdTimestamp(id: string | undefined): number | null {
  if (!id || !/^[0-9a-f]{24}$/i.test(id)) return null;
  const seconds = Number.parseInt(id.slice(0, 8), 16);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

function messageFor(error: IdentityApiError): string {
  if (error.status === 0) return error.message;
  if (error.status === 401) {
    return "Tu sesión expiró. Iniciá sesión otra vez.";
  }
  if (error.status === 403) {
    return "Tu usuario no tiene el rol Verifier.";
  }
  return `No se pudieron listar las credenciales (${error.status}).`;
}
