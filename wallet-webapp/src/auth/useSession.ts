import { useEffect, useSyncExternalStore } from 'react'
import { enforceExpiry, getSession, subscribe, type Session } from './session'

/** Sesión activa (o `null`), reactiva a login/logout desde cualquier punto. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, getSession)
}

/**
 * Cierra la sesión automáticamente cuando el access token vence, incluyendo el
 * caso de volver a la app después de tenerla en segundo plano.
 */
export function useExpiryWatcher(): void {
  useEffect(() => {
    enforceExpiry()

    const interval = window.setInterval(enforceExpiry, 30_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') enforceExpiry()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
