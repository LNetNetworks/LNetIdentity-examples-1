import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WalletSettings } from '../types';
import {
  configureApiClient,
  DEFAULT_DWALLET_API_BASE,
  DEFAULT_SSI_VC_API_BASE,
  normalizeApiBaseUrl,
} from '../api/client';
import { useAuth } from './AuthContext';

export const DEFAULT_CLAIMS_VERIFIER = '0xAa9f4b97789Aabcd4fD4f3dF35C2112B868c7471';

const DEFAULT_SETTINGS: WalletSettings = {
  activeBackend: 'dwallet',
  dwalletApiBaseUrl: DEFAULT_DWALLET_API_BASE,
  ssiVcApiBaseUrl: DEFAULT_SSI_VC_API_BASE,
  walletPrivateKey: '',
  claimsVerifier: DEFAULT_CLAIMS_VERIFIER,
  trustedList: '',
  mediatorKey: '',
};

interface SettingsContextValue {
  settings: WalletSettings;
  setSettings: (next: WalletSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function storageKey(username: string) {
  return `vc-issuer:settings:${username}`;
}

function readSettings(username: string): WalletSettings {
  const stored = localStorage.getItem(storageKey(username));
  if (!stored) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(stored) as Partial<WalletSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      activeBackend: parsed.activeBackend === 'ssi-vc' ? 'ssi-vc' : 'dwallet',
      dwalletApiBaseUrl: normalizeApiBaseUrl(parsed.dwalletApiBaseUrl || DEFAULT_SETTINGS.dwalletApiBaseUrl),
      ssiVcApiBaseUrl: normalizeApiBaseUrl(parsed.ssiVcApiBaseUrl || DEFAULT_SETTINGS.ssiVcApiBaseUrl),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const username = user?.username;
  const [settings, setSettingsState] = useState<WalletSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const next = username ? readSettings(username) : DEFAULT_SETTINGS;
    setSettingsState(next);
    configureApiClient(next);

    return () => configureApiClient(DEFAULT_SETTINGS);
  }, [username]);

  function setSettings(next: WalletSettings) {
    const normalized = {
      ...next,
      dwalletApiBaseUrl: normalizeApiBaseUrl(next.dwalletApiBaseUrl),
      ssiVcApiBaseUrl: normalizeApiBaseUrl(next.ssiVcApiBaseUrl),
    };
    setSettingsState(normalized);
    configureApiClient(normalized);
    if (username) localStorage.setItem(storageKey(username), JSON.stringify(normalized));
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
