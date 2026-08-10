/**
 * Tipos derivados del contrato OpenAPI del servicio D-Wallet
 * (https://dev-identity-dwallet.l-net.io/).
 */

export interface LoginRequest {
  user: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
  /** DID de la wallet del usuario. Puede faltar si aún no creó la wallet. */
  did?: string
}

export interface WalletResponse {
  did?: string
  address?: string
  created_at?: string
}

/** Item del listado `GET /holder/{did}`. */
export interface CredentialSummaryHolder {
  id: string
  did_issuer?: string
  type?: string
}

/** Objeto W3C Verifiable Credential devuelto por `GET /holder/{did}/id/{id}`. */
export interface VCDetail {
  '@context'?: string | string[]
  id?: string
  type?: string | string[]
  issuer?: string | { id?: string; [k: string]: unknown }
  validFrom?: string
  validUntil?: string
  issuanceDate?: string
  expirationDate?: string
  trustedList?: string
  credentialSubject?: Record<string, unknown>
  proof?: Record<string, unknown>
  [k: string]: unknown
}

export interface ShareVCResponse {
  message?: string
}

export interface IssueRequest {
  /** DID del issuer. */
  did: string
  /** DID del holder (subject). */
  subject: string
  type: string
  context: string | string[]
  trustedlist?: string
  validUntil?: string
  data: Record<string, unknown>
}

export interface IssueResponse {
  id?: string
}

export interface APIErrorBody {
  code?: number
  message?: string
  status?: number
}

/** Estado local de una solicitud de emisión hecha desde la wallet. */
export interface CredentialRequestRecord {
  localId: string
  createdAt: string
  issuerDid: string
  holderDid: string
  type: string
  context: string
  data: Record<string, unknown>
  status: 'issued' | 'pending' | 'error'
  /** Id de la VC emitida, si la API la creó en el acto. */
  vcId?: string
  message?: string
}
