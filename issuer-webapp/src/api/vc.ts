import { API_BASE, apiFetch } from './client';
import type { CredentialSummary, VCDetail, VerifyResponse } from '../types';

export interface IssueVCParams {
  subjectDid: string;
  claimsVerifier: string;
  privateKey: string;
  mediatorKey: string;
  type: string;
  context: string;
  trustedList?: string;
  validUntil: string;
  data: Record<string, unknown>;
}

export interface IssueVCRequestPreview {
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  payload: Record<string, unknown>;
}

export function buildIssueVCRequest(params: IssueVCParams): IssueVCRequestPreview {
  const payload: Record<string, unknown> = {
    claimsVerifier: params.claimsVerifier,
    subject: params.subjectDid,
    type: params.type,
    context: params.context,
    validUntil: params.validUntil,
    data: params.data,
    privatekey: params.privateKey,
    mediatorKey: params.mediatorKey,
  };
  if (params.trustedList) payload.trustedlist = params.trustedList;

  return {
    endpoint: `${API_BASE}/vc`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <access-token>',
    },
    payload,
  };
}

export async function issueVC(params: IssueVCParams): Promise<{ id: string }> {
  const request = buildIssueVCRequest(params);

  return apiFetch<{ id: string }>('/vc', {
    method: request.method,
    body: JSON.stringify(request.payload),
  });
}

export async function listCredentials(issuerDid: string): Promise<CredentialSummary[]> {
  return apiFetch<CredentialSummary[]>(`/issuer/${encodeURIComponent(issuerDid)}`);
}

export async function getCredential(issuerDid: string, id: string): Promise<VCDetail> {
  return apiFetch<VCDetail>(`/issuer/${encodeURIComponent(issuerDid)}/id/${encodeURIComponent(id)}`);
}

export async function verifyCredential(credential: VCDetail): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>('/verify', {
    method: 'POST',
    body: JSON.stringify({ vc: { credential } }),
  });
}

// Not implemented by the current dev-identity-dwallet.l-net.io deployment
// (DELETE /wallet/vc/:id and POST /wallet/vc/messages both 404). Kept here,
// unused, so wiring them up later is a one-line change once the backend adds them.
export async function revokeVC(_id: string, _privateKey: string): Promise<{ hash: string }> {
  throw new Error('Revoke no está disponible en este ambiente todavía.');
}

export async function getMailbox(_params: {
  subjectDid: string;
  privKeyMsg: string;
  privateKey: string;
  encrypKeyPrivate: string;
}): Promise<{ messages: unknown[] }> {
  throw new Error('El buzón de mensajes no está disponible en este ambiente todavía.');
}
