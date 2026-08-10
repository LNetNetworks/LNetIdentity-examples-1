/**
 * Interpretación del contenido del QR del verificador.
 *
 * El QR puede traer la URL completa publicada por el servicio, por ejemplo:
 *   http://dev-identity-dwallet.l-net.io/wallet/shareverify/did:lac:openprotest:0x1975…
 * o directamente el DID del verificador.
 *
 * En ambos casos solo se extrae el DID: la VP se envía siempre contra la API
 * configurada en `VITE_API_BASE_URL`. Esto evita que un QR pueda redirigir la
 * credencial a un host arbitrario y también evita el bloqueo por mixed content
 * cuando el QR trae una URL `http://` y la PWA corre sobre HTTPS.
 */

/** Sintaxis DID: `did:<method>:<method-specific-id>`, donde el id admite `:`. */
const DID_PATTERN = /did:[a-zA-Z0-9]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._%-]/

export type QrParseResult =
  | { ok: true; verifierDid: string; source: string }
  | { ok: false; error: string; source: string }

export function parseVerifierQr(raw: string): QrParseResult {
  const source = raw.trim()
  if (!source) {
    return { ok: false, error: 'El código QR está vacío.', source }
  }

  const match = source.match(DID_PATTERN)
  if (!match) {
    return {
      ok: false,
      error: 'El código escaneado no contiene un DID de verificador.',
      source,
    }
  }

  // Un DID puede venir URL-encodeado dentro de la ruta.
  let verifierDid = match[0]
  try {
    verifierDid = decodeURIComponent(verifierDid)
  } catch {
    /* Se conserva el valor original si el decode falla. */
  }

  return { ok: true, verifierDid, source }
}

export function isDid(value: string): boolean {
  const trimmed = value.trim()
  const match = trimmed.match(DID_PATTERN)
  return match?.[0] === trimmed
}
