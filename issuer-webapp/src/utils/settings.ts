import type { WalletSettings } from '../types';

export function getMissingSettings(settings: WalletSettings): string[] {
  const missing: string[] = [];

  if (settings.activeBackend === 'dwallet') {
    if (!settings.dwalletApiBaseUrl.trim()) missing.push('URL de dwallet');
    return missing;
  }

  if (!settings.ssiVcApiBaseUrl.trim()) missing.push('URL de ssi-vc');
  if (!settings.ssiVcApiKey.trim()) missing.push('API Key ssi-vc');
  if (!settings.walletPrivateKey.trim()) missing.push('Wallet Private Key');
  if (!settings.claimsVerifier.trim()) missing.push('Claims Verifier Smart Contract');
  if (!settings.mediatorKey.trim()) missing.push('Encryption / Mediator Key');

  return missing;
}

export function getMissingSettingsMessage(missing: string[]): string {
  return `Configuración incompleta. Missing: ${missing.join(', ')}. Completá ${
    missing.length === 1 ? 'este campo' : 'estos campos'
  } en Configuración antes de emitir.`;
}
