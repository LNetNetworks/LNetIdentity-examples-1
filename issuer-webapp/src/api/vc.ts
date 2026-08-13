import { getActiveApiBase, getActiveBackend, normalizeApiBaseUrl, apiFetch } from './client';
import type { CredentialSummary, VCDetail, VerifyResponse, WalletBackend, WalletSettings } from '../types';

export interface IssueVCParams {
  issuerDid: string;
  subjectDid: string;
  type: string;
  context: string;
  validUntil: string;
  data: Record<string, unknown>;
}

export interface SsiVCIssueParams extends IssueVCParams {
  claimsVerifier: string;
  privateKey: string;
  mediatorKey: string;
}

export interface IssueVCRequestPreview {
  endpoint: string;
  method: 'POST';
  backend: WalletBackend;
  apiBaseUrl: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
}

function buildDwalletIssuePayload(params: IssueVCParams, settings?: WalletSettings): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    did: params.issuerDid,
    subject: params.subjectDid,
    type: params.type,
    context: params.context,
    validUntil: params.validUntil,
    data: params.data,
    trustedList: settings?.trustedList.trim() || '',
  };

  return payload;
}

export function buildIssueVCRequest(
  params: IssueVCParams,
  settings?: WalletSettings,
): IssueVCRequestPreview {
  const backend = settings?.activeBackend || getActiveBackend();
  const payload = backend === 'ssi-vc'
    ? buildSsiVCIssuePayload({
        ...params,
        claimsVerifier: settings?.claimsVerifier || '',
        privateKey: settings?.walletPrivateKey || '',
        mediatorKey: settings?.mediatorKey || '',
      })
    : buildDwalletIssuePayload(params, settings);

  const apiBaseUrl = settings
    ? normalizeApiBaseUrl(backend === 'dwallet' ? settings.dwalletApiBaseUrl : settings.ssiVcApiBaseUrl)
    : getActiveApiBase();

  return {
    endpoint: `${apiBaseUrl}/vc`,
    method: 'POST',
    backend,
    apiBaseUrl,
    headers: backend === 'ssi-vc'
      ? {
          'Content-Type': 'application/json',
          ...(settings?.ssiVcApiKey ? { apikey: '<api-key>' } : {}),
        }
      : {
          'Content-Type': 'application/json',
          Authorization: 'Bearer <access-token>',
        },
    payload,
  };
}

// Kept beside the dwallet request for a future ssi-vc integration.
export function buildSsiVCIssuePayload(params: SsiVCIssueParams): Record<string, unknown> {
  return {
    claimsVerifier: params.claimsVerifier,
    subject: params.subjectDid,
    context: params.context,
    validUntil: params.validUntil,
    type: params.type,
    data: params.data,
    privatekey: params.privateKey,
    mediatorKey: params.mediatorKey,
  };
}

export async function issueVC(params: IssueVCParams, settings?: WalletSettings): Promise<{ id: string }> {
  const request = buildIssueVCRequest(params, settings);

  return apiFetch<{ id: string }>('/vc', {
    method: request.method,
    headers: request.backend === 'ssi-vc' && settings?.ssiVcApiKey
      ? { apikey: settings.ssiVcApiKey }
      : undefined,
    body: JSON.stringify(request.payload),
  }, request.apiBaseUrl, request.backend !== 'ssi-vc');
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
