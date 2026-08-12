import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/client';

export function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/issue', { replace: true });
    } catch {
      // error is surfaced via auth context
    }
  }

  return (
    <div className="issuer-login relative z-[1] flex min-h-dvh items-center justify-center px-[22px] py-8 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-[420px] space-y-7">
        <div className="text-center">
          <div className="mx-auto mb-3.5 flex h-[74px] w-[74px] items-center justify-center rounded-[22px] bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_18px_40px_-18px_rgba(16,185,129,0.9)]">
            <IssuerIcon />
          </div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-white">Issuer | Identity</h1>
          <p className="mt-2 text-sm text-[#93a1b8]">
            Emití credenciales verificables con confianza.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="issuer-username" className="text-sm font-semibold text-slate-300">
            Usuario
          </label>
          <input
            id="issuer-username"
            className="min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] px-3.5 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:bg-[#121829]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario@ejemplo.com"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="issuer-password" className="text-sm font-semibold text-slate-300">
            Contraseña
          </label>
          <input
            id="issuer-password"
            type="password"
            className="min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] px-3.5 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:bg-[#121829]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-mono text-xs leading-relaxed text-red-300">
            {error}
          </pre>
        )}

        <button
          type="submit"
          disabled={loading || !username.trim() || !password}
          className="min-h-[50px] w-full rounded-[14px] bg-emerald-500 px-5 font-semibold text-white shadow-[0_10px_24px_-14px_#10b981] transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <div className="pt-3 text-center text-xs leading-relaxed text-slate-600">
          <p>Conectado a</p>
          <p className="mt-1 break-all font-mono text-slate-500">{API_BASE}</p>
        </div>
      </form>
    </div>
  );
}

function IssuerIcon() {
  return (
    <svg
      aria-hidden="true"
      width="42"
      height="42"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 7h14l7 7v25a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3Z" />
      <path d="M28 7v8h8" />
      <path d="M18 26h12M18 32h8" />
      <path d="M18 20h4" />
    </svg>
  );
}
