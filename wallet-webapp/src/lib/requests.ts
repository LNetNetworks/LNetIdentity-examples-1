import { readJson, writeJson } from './storage'
import type { CredentialRequestRecord } from './types'

/**
 * Historial local de solicitudes de emisión.
 *
 * El servicio D-Wallet no expone un endpoint de "solicitud" del lado del holder:
 * la emisión se hace con `POST /vc` y requiere rol issuer. Guardar el historial
 * localmente permite que el holder vea qué pidió y con qué resultado.
 */

const STORAGE_KEY = 'piw.credential-requests.v1'

export function listRequests(holderDid: string | null): CredentialRequestRecord[] {
  if (!holderDid) return []
  const all = readJson<CredentialRequestRecord[]>(STORAGE_KEY) ?? []
  return all
    .filter((record) => record.holderDid === holderDid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addRequest(record: CredentialRequestRecord): void {
  const all = readJson<CredentialRequestRecord[]>(STORAGE_KEY) ?? []
  // Se conservan las últimas 50 para no dejar crecer el almacenamiento sin límite.
  writeJson(STORAGE_KEY, [record, ...all].slice(0, 50))
}

export function removeRequest(localId: string): void {
  const all = readJson<CredentialRequestRecord[]>(STORAGE_KEY) ?? []
  writeJson(
    STORAGE_KEY,
    all.filter((record) => record.localId !== localId),
  )
}

export function newLocalId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
