import type { WalletSettings } from '../types';

export function getMissingSettings(settings: WalletSettings): string[] {
  void settings;
  return [];
}

export function getMissingSettingsMessage(missing: string[]): string {
  return `Configuración incompleta. Missing: ${missing.join(', ')}. Completá ${
    missing.length === 1 ? 'este campo' : 'estos campos'
  } en Configuración antes de emitir.`;
}
