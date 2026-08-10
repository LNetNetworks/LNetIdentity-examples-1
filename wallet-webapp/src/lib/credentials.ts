import type { VCDetail } from './types'

/** Tipo genérico que toda VC incluye y que nunca sirve como título. */
const GENERIC_TYPES = new Set(['verifiablecredential', 'verifiablepresentation'])

/** Devuelve el tipo específico de la credencial (descarta `VerifiableCredential`). */
export function specificType(type: string | string[] | undefined): string | undefined {
  const list = Array.isArray(type) ? type : type ? [type] : []
  return list.find((item) => item && !GENERIC_TYPES.has(item.toLowerCase())) ?? list[0]
}

/** `UniversityDegreeCredential` -> `University Degree`. */
export function humanizeType(type: string | string[] | undefined): string {
  const specific = specificType(type)
  if (!specific) return 'Credencial verificable'

  const words = specific
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)

  // "Credential" al final es ruido: el contexto ya dice que es una credencial.
  if (words.length > 1 && /^credentials?$/i.test(words[words.length - 1])) {
    words.pop()
  }
  return words.join(' ')
}

export function issuerDid(vc: VCDetail | undefined): string | undefined {
  if (!vc) return undefined
  const { issuer } = vc
  if (typeof issuer === 'string') return issuer
  if (issuer && typeof issuer === 'object' && typeof issuer.id === 'string') return issuer.id
  return undefined
}

export function validFrom(vc: VCDetail | undefined): string | undefined {
  return vc?.validFrom ?? vc?.issuanceDate
}

export function validUntil(vc: VCDetail | undefined): string | undefined {
  return vc?.validUntil ?? vc?.expirationDate
}

export type CredentialStatus = 'valid' | 'expired' | 'not-yet-valid' | 'unknown'

export function credentialStatus(vc: VCDetail | undefined): CredentialStatus {
  if (!vc) return 'unknown'
  const now = Date.now()

  const until = validUntil(vc)
  if (until) {
    const untilTime = Date.parse(until)
    if (!Number.isNaN(untilTime) && untilTime < now) return 'expired'
  }

  const from = validFrom(vc)
  if (from) {
    const fromTime = Date.parse(from)
    if (!Number.isNaN(fromTime) && fromTime > now) return 'not-yet-valid'
  }

  return until || from ? 'valid' : 'unknown'
}

export const STATUS_LABEL: Record<CredentialStatus, string> = {
  valid: 'Vigente',
  expired: 'Vencida',
  'not-yet-valid': 'Aún no vigente',
  unknown: 'Sin vigencia declarada',
}

/** `did:lac:openprotest:0x1975b634…2535ed9d` */
export function shortDid(did: string | undefined, edge = 8): string {
  if (!did) return '—'
  const lastColon = did.lastIndexOf(':')
  if (lastColon === -1 || did.length - lastColon - 1 <= edge * 2 + 1) return did
  const prefix = did.slice(0, lastColon + 1)
  const id = did.slice(lastColon + 1)
  return `${prefix}${id.slice(0, edge)}…${id.slice(-edge)}`
}

export function formatDate(value: string | undefined): string {
  if (!value) return '—'
  const time = Date.parse(value)
  if (Number.isNaN(time)) return value
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(time)
}

export function formatDateTime(value: string | undefined): string {
  if (!value) return '—'
  const time = Date.parse(value)
  if (Number.isNaN(time)) return value
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(time)
}

export interface Claim {
  key: string
  label: string
  value: string
}

/** Aplana `credentialSubject` en pares etiqueta/valor listos para render. */
export function flattenClaims(subject: Record<string, unknown> | undefined): Claim[] {
  if (!subject) return []
  const claims: Claim[] = []

  const walk = (value: unknown, path: string[]) => {
    // `id` en la raíz es el DID del holder, que ya se muestra aparte.
    if (path.length === 1 && path[0] === 'id') return

    if (value === null || value === undefined) {
      claims.push({ key: path.join('.'), label: labelFor(path), value: '—' })
      return
    }
    if (Array.isArray(value)) {
      if (value.every((item) => typeof item !== 'object' || item === null)) {
        claims.push({
          key: path.join('.'),
          label: labelFor(path),
          value: value.map(String).join(', ') || '—',
        })
        return
      }
      value.forEach((item, index) => walk(item, [...path, String(index + 1)]))
      return
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
      if (entries.length === 0) {
        claims.push({ key: path.join('.'), label: labelFor(path), value: '—' })
        return
      }
      for (const [key, child] of entries) walk(child, [...path, key])
      return
    }
    claims.push({ key: path.join('.'), label: labelFor(path), value: String(value) })
  }

  for (const [key, value] of Object.entries(subject)) walk(value, [key])
  return claims
}

function labelFor(path: string[]): string {
  return path
    .map((segment) =>
      segment
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^\w/, (char) => char.toUpperCase()),
    )
    .join(' · ')
}

/** Índice de paleta estable a partir del tipo, para que cada credencial tenga su color. */
export function accentIndex(seed: string | undefined, buckets = 6): number {
  if (!seed) return 0
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % buckets
}
