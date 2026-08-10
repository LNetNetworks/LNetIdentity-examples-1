"use server";

import QRCode from "qrcode";

import { IdentityApiError, getVerificationUrl } from "@/lib/identity-api";
import { getSession } from "@/lib/session";

export type QrState =
  | { status: "idle" }
  | { status: "ready"; url: string; svg: string }
  | { status: "error"; error: string };

/**
 * The QR is rendered here rather than in the browser so the access token never
 * leaves the server: the client only ever receives the finished SVG plus the
 * URL it encodes.
 */
export async function generateQrAction(): Promise<QrState> {
  const session = await getSession();
  if (!session) {
    return { status: "error", error: "Tu sesión expiró. Iniciá sesión otra vez." };
  }

  let url: string | undefined;
  try {
    const response = await getVerificationUrl(session.accessToken);
    url = response?.url;
  } catch (error) {
    if (error instanceof IdentityApiError) {
      return { status: "error", error: messageFor(error) };
    }
    throw error;
  }

  if (!url) {
    return { status: "error", error: "La API no devolvió una URL de verificación." };
  }

  // `margin: 0` because the card around the QR already provides the quiet zone,
  // and the colors match the panel the SVG is dropped into.
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#04060eff", light: "#ffffffff" },
  });

  return { status: "ready", url, svg };
}

function messageFor(error: IdentityApiError): string {
  if (error.status === 0) return error.message;
  if (error.status === 401) {
    return "Tu sesión expiró. Iniciá sesión otra vez.";
  }
  if (error.status === 403) {
    return "Tu usuario no tiene el rol Verifier.";
  }
  return `No se pudo generar el QR (${error.status}).`;
}
