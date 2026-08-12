export interface AuthUser {
  username: string;
  did: string;
  accessToken: string;
  refreshToken?: string;
}

export interface WalletSettings {
  walletPrivateKey: string;
  claimsVerifier: string;
  trustedList: string;
  mediatorKey: string;
}

export interface CredentialTypeOption {
  type: string;
  label: string;
  schemaUrl: string;
  localSchema: JsonSchema;
}

export interface JsonSchema {
  $id?: string;
  title?: string;
  type: string;
  required?: string[];
  properties: {
    credentialSubject: {
      type: string;
      required?: string[];
      properties: Record<string, JsonSchemaProperty>;
    };
  };
}

export interface JsonSchemaProperty {
  type: string;
  format?: string;
  enum?: string[];
  minLength?: number;
  minimum?: number;
}

export interface CredentialSummary {
  id: string;
  did_holder: string;
  type: string;
}

export interface VCDetail {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  validFrom?: string;
  validUntil?: string;
  credentialSubject: Record<string, unknown>;
  proof?: Record<string, unknown>;
}

export interface VerifyResponse {
  validacionVc: boolean;
  trustChain?: boolean;
}

export class APIError extends Error {
  code?: unknown;
  status: number;
  statusText: string;
  method: string;
  endpoint: string;
  response: unknown;

  constructor({
    code,
    status,
    statusText,
    method,
    endpoint,
    response,
  }: {
    code?: unknown;
    status: number;
    statusText: string;
    method: string;
    endpoint: string;
    response: unknown;
  }) {
    const statusLine = `HTTP ${status}${statusText ? ` ${statusText}` : ''}`;
    const codeLine = code === undefined ? [] : [`Code: ${String(code)}`];
    const responseText = typeof response === 'string'
      ? response
      : JSON.stringify(response, null, 2);

    super([
      `${method} ${endpoint}`,
      statusLine,
      ...codeLine,
      `Response:\n${responseText}`,
    ].join('\n'));
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.statusText = statusText;
    this.method = method;
    this.endpoint = endpoint;
    this.response = response;
  }
}
