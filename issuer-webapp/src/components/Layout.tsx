import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDebug } from '../context/debug-context';
import { SettingsModal } from './SettingsModal';

export function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { enabled: debugEnabled, setEnabled: setDebugEnabled } = useDebug();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-[520px] flex-col">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0f19]/85 text-white backdrop-blur-xl">
        <div className="flex min-h-14 items-center justify-between gap-2 px-4 py-2">
          <div>
            <p className="font-semibold leading-tight">Issuer | Identity</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Emisor de credenciales</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400">Debug</span>
              <button
                type="button"
                role="switch"
                aria-label="Modo Debug"
                aria-checked={debugEnabled}
                onClick={() => setDebugEnabled(!debugEnabled)}
                className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  debugEnabled
                    ? 'border-emerald-400 bg-emerald-500'
                    : 'border-white/15 bg-white/10'
                }`}
                title={debugEnabled ? 'Desactivar modo Debug' : 'Activar modo Debug'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${
                    debugEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <button
              aria-label="Configuración"
              onClick={() => setSettingsOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <GearIcon />
            </button>
            <button
              onClick={() => logout()}
              className="min-h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="flex gap-1 px-2">
          <TabLink to="/issue">Emitir</TabLink>
          <TabLink to="/credentials">Credenciales</TabLink>
          <TabLink to="/profile">Mi perfil</TabLink>
        </nav>
      </header>

      <main className="w-full flex-1 px-4 py-5">{children}</main>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function TabLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `border-b-2 px-4 py-2.5 text-sm font-medium transition ${
          isActive ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-500'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
