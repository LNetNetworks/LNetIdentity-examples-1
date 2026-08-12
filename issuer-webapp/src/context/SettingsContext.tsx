import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WalletSettings } from '../types';
import { useAuth } from './AuthContext';

export const DEFAULT_CLAIMS_VERIFIER = '0xAa9f4b97789Aabcd4fD4f3dF35C2112B868c7471';

const DEFAULT_SETTINGS: WalletSettings = {
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettingsState] = useState<WalletSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(storageKey(user.username));
    setSettingsState(stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS);
  }, [user?.username]);

  function setSettings(next: WalletSettings) {
    setSettingsState(next);
    if (user) localStorage.setItem(storageKey(user.username), JSON.stringify(next));
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
