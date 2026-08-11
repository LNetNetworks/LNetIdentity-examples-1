import { apiFetch } from './client';
import type { CredentialSummary, VCDetail, VerifyResponse } from '../types';

export interface IssueVCParams {
  issuerDid: string;
  subjectDid: string;
  type: string;
  contextUrl: string;
  trustedList?: string;
  validUntil: string;
  data: Record<string, unknown>;
}

export async function issueVC(params: IssueVCParams): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    did: params.issuerDid,
    subject: params.subjectDid,
    type: params.type,
    context: params.contextUrl,
    validUntil: params.validUntil,
    data: params.data,
  };
  if (params.trustedList) body.trustedlist = params.trustedList;

  return apiFetch<{ id: string }>('/vc', { method: 'POST', body: JSON.stringify(body) });
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
