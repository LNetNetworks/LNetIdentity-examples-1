import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDebug } from '../context/debug-context';
import { SettingsModal } from './SettingsModal';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { enabled: debugEnabled, setEnabled: setDebugEnabled } = useDebug();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-10 bg-indigo-600 text-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="font-semibold leading-tight">VC Issuer</p>
            <p className="text-xs text-indigo-100 truncate max-w-[60vw]" title={user?.did}>
              {user?.did}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={debugEnabled}
              onClick={() => setDebugEnabled(!debugEnabled)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                debugEnabled
                  ? 'bg-amber-300 text-amber-950'
                  : 'bg-indigo-500 text-indigo-100 hover:bg-indigo-400'
              }`}
              title={debugEnabled ? 'Desactivar modo Debug' : 'Activar modo Debug'}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${debugEnabled ? 'bg-amber-700' : 'bg-indigo-200'}`}
              />
              Debug
            </button>
            <button
              aria-label="Configuración"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-indigo-500 active:bg-indigo-700"
            >
              <GearIcon />
            </button>
            <button
              onClick={() => logout()}
              className="text-sm px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-700"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="flex px-2 gap-1 bg-indigo-700/40">
          <TabLink to="/issue">Emitir</TabLink>
          <TabLink to="/credentials">Credenciales</TabLink>
        </nav>
      </header>

      <main className="flex-1 px-4 py-4 max-w-2xl w-full mx-auto">{children}</main>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function TabLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 text-sm font-medium rounded-t-md ${
          isActive ? 'bg-slate-50 text-indigo-700' : 'text-indigo-100'
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
