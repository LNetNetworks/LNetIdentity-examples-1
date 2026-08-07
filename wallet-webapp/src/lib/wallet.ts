import * as api from './api'

/**
 * Crea la wallet DID del usuario autenticado.
 *
 * El servicio expone dos caminos: `POST /` (creación completa) y la secuencia
 * `POST /wallet-id` + `POST /wallet-document`. Se intenta primero el camino
 * completo; solo si ese endpoint falla se recurre a la secuencia en dos pasos,
 * para no arriesgar la creación de una segunda wallet cuando el primero ya
 * funcionó.
 */
export async function provisionWallet(): Promise<string> {
  const wallet = await api.createWallet().catch((error: unknown) => {
    if (error instanceof api.ApiError && (error.isUnauthorized || error.isForbidden)) {
      throw error
    }
    return null
  })

  if (wallet?.did) return wallet.did

  if (wallet) {
    // La wallet se creó pero no vino el DID: pedirlo de nuevo podría duplicarla.
    throw new api.ApiError(
      'La wallet se creó pero el servicio no devolvió el DID. Cerrá sesión y volvé a ingresar para obtenerlo.',
      500,
    )
  }

  const pending = await api.createWalletId()
  const document = await api.createWalletDocument()

  const did = document?.did ?? pending?.did
  if (!did) {
    throw new api.ApiError('El servicio no devolvió el DID de la wallet creada.', 500)
  }
  return did
}
