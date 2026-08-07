"use server";

import { redirect } from "next/navigation";

import {
  IdentityApiError,
  login as apiLogin,
  logout as apiLogout,
} from "@/lib/identity-api";
import { clearSession, createSession, getSession } from "@/lib/session";

export type LoginState = {
  error: string | null;
};

/**
 * The API answers bad credentials with a 500 carrying an
 * `ERR_KEYCLOAK_GENERATE_TOKEN: ... Invalid user credentials` message rather
 * than the 401 the OpenAPI document advertises, so both are folded into the
 * same user-facing message.
 */
function messageFor(error: IdentityApiError): string {
  if (error.status === 401 || /invalid user credentials/i.test(error.message)) {
    return "Usuario o contraseña incorrectos.";
  }
  if (error.status === 0) {
    return error.message;
  }
  return `No se pudo iniciar sesión (${error.status}).`;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const user = String(formData.get("user") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!user || !password) {
    return { error: "Ingresá usuario y contraseña." };
  }

  try {
    const tokens = await apiLogin(user, password);
    if (!tokens?.access_token) {
      return { error: "La API no devolvió un token de acceso." };
    }
    await createSession(tokens);
  } catch (error) {
    if (error instanceof IdentityApiError) {
      return { error: messageFor(error) };
    }
    throw error;
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();

  // Best effort: a failed server-side logout must not strand the user in a
  // logged-in UI, so the local session is cleared either way.
  if (session?.refreshToken) {
    try {
      await apiLogout(session.accessToken, session.refreshToken);
    } catch (error) {
      if (!(error instanceof IdentityApiError)) throw error;
    }
  }

  await clearSession();
  redirect("/login");
}
