import { createContext, useContext } from 'react';

export interface DebugContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const DebugContext = createContext<DebugContextValue | null>(null);

export function useDebug() {
  const context = useContext(DebugContext);
  if (!context) throw new Error('useDebug must be used within DebugProvider');
  return context;
}
