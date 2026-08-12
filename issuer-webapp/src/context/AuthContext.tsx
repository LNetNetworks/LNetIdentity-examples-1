import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import { setAccessToken, setUnauthorizedHandler } from '../api/client';
import type { AuthUser } from '../types';

const STORAGE_KEY = 'vc-issuer:auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: AuthUser = JSON.parse(stored);
      setAccessToken(parsed.accessToken);
      setUser(parsed);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem(STORAGE_KEY);
      setAccessToken(null);
      setUser(null);
      setError('Tu sesión expiró. Iniciá sesión nuevamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    async login(username, password) {
      setLoading(true);
      setError(null);
      try {
        const authUser = await apiLogin(username, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        setUser(authUser);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al iniciar sesión');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    async logout() {
      try {
        await apiLogout(user?.refreshToken);
      } finally {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
    },
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
