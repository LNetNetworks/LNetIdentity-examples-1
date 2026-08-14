import { useMemo, useState, type ReactNode } from 'react';
import { DebugContext, type DebugContextValue } from './debug-context';

const STORAGE_KEY = 'vc-issuer:debug';

export function DebugProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  );

  const value = useMemo<DebugContextValue>(() => ({
    enabled,
    setEnabled(next) {
      setEnabledState(next);
      localStorage.setItem(STORAGE_KEY, String(next));
    },
  }), [enabled]);

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
}
