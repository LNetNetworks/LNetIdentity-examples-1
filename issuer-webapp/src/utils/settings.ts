import type { WalletSettings } from '../types';

const REQUIRED_SETTINGS = [
  ['walletPrivateKey', 'Wallet Private Key'],
  ['claimsVerifier', 'Claims Verifier Smart Contract'],
  ['mediatorKey', 'Encryption / Mediator Key'],
] as const satisfies ReadonlyArray<readonly [keyof WalletSettings, string]>;

export function getMissingSettings(settings: WalletSettings): string[] {
  return REQUIRED_SETTINGS
    .filter(([key]) => !settings[key].trim())
    .map(([, label]) => label);
}

export function getMissingSettingsMessage(missing: string[]): string {
  return `Configuración incompleta. Missing: ${missing.join(', ')}. Completá ${
    missing.length === 1 ? 'este campo' : 'estos campos'
  } en Configuración antes de emitir.`;
}
