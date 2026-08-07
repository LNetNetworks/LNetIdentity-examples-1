import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import type { CredentialSummaryHolder, VCDetail } from '../lib/types'

/**
 * Caché en memoria de los detalles ya consultados. El gateway limita a 100
 * requests cada 15 minutos, así que se evita repedir la misma VC al navegar
 * entre el listado, el detalle y el flujo de compartir.
 */
const detailCache = new Map<string, VCDetail>()

const detailKey = (holderDid: string, id: string) => `${holderDid}::${id}`

export function getCachedDetail(holderDid: string, id: string): VCDetail | undefined {
  return detailCache.get(detailKey(holderDid, id))
}

/**
 * El listado se reutiliza durante una ventana corta para que ir de la lista al
 * escáner y a la pantalla de compartir no dispare tres veces el mismo GET.
 * El botón de recargar siempre ignora esta caché.
 */
const LIST_TTL_MS = 60_000

interface ListCacheEntry {
  holderDid: string
  items: CredentialSummaryHolder[]
  fetchedAt: number
}

let listCache: ListCacheEntry | null = null

function readFreshList(holderDid: string | null): CredentialSummaryHolder[] | null {
  if (!holderDid || listCache?.holderDid !== holderDid) return null
  return Date.now() - listCache.fetchedAt < LIST_TTL_MS ? listCache.items : null
}

export function clearCredentialCache(): void {
  detailCache.clear()
  listCache = null
}

function messageFor(error: unknown): string {
  if (error instanceof api.ApiError) return error.message
  return 'Ocurrió un error inesperado.'
}

/* -------------------------------------------------------------------------- */
/* Listado                                                                     */
/* -------------------------------------------------------------------------- */

interface CredentialsListState {
  credentials: CredentialSummaryHolder[]
  loading: boolean
  error: string | null
  /** `true` mientras se recarga con datos ya en pantalla. */
  refreshing: boolean
  reload: () => void
}

export function useHolderCredentials(holderDid: string | null): CredentialsListState {
  const cached = readFreshList(holderDid)

  const [credentials, setCredentials] = useState<CredentialSummaryHolder[]>(cached ?? [])
  const [loading, setLoading] = useState(Boolean(holderDid) && !cached)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  useEffect(() => {
    if (!holderDid) {
      setCredentials([])
      setLoading(false)
      return
    }

    // Solo la carga inicial aprovecha la caché; recargar siempre va a la red.
    if (nonce === 0) {
      const fresh = readFreshList(holderDid)
      if (fresh) {
        setCredentials(fresh)
        setLoading(false)
        return
      }
    }

    const controller = new AbortController()
    let active = true

    // La primera carga muestra skeletons; las recargas mantienen la lista visible.
    if (nonce === 0) setLoading(true)
    else setRefreshing(true)
    setError(null)

    api
      .listHolderCredentials(holderDid, controller.signal)
      .then((items) => {
        listCache = { holderDid, items, fetchedAt: Date.now() }
        if (!active) return
        setCredentials(items)
      })
      .catch((cause) => {
        if (!active || controller.signal.aborted) return
        setError(messageFor(cause))
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
        setRefreshing(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [holderDid, nonce])

  return { credentials, loading, error, refreshing, reload }
}

/* -------------------------------------------------------------------------- */
/* Detalle                                                                     */
/* -------------------------------------------------------------------------- */

interface CredentialDetailState {
  detail: VCDetail | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useCredentialDetail(
  holderDid: string | null,
  id: string | undefined,
): CredentialDetailState {
  const cached = holderDid && id ? getCachedDetail(holderDid, id) : undefined

  const [detail, setDetail] = useState<VCDetail | null>(cached ?? null)
  const [loading, setLoading] = useState(Boolean(holderDid && id) && !cached)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  useEffect(() => {
    if (!holderDid || !id) return

    const fromCache = getCachedDetail(holderDid, id)
    if (fromCache && nonce === 0) {
      setDetail(fromCache)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let active = true

    setLoading(true)
    setError(null)

    api
      .getHolderCredential(holderDid, id, controller.signal)
      .then((result) => {
        if (!active) return
        detailCache.set(detailKey(holderDid, id), result)
        setDetail(result)
      })
      .catch((cause) => {
        if (!active || controller.signal.aborted) return
        setError(messageFor(cause))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [holderDid, id, nonce])

  return { detail, loading, error, reload }
}
