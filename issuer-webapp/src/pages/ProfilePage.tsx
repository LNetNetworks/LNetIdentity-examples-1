import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type CopyStatus = 'idle' | 'copied' | 'error';

export function ProfilePage() {
  const { user } = useAuth();
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  if (!user) return null;

  async function copyDid() {
    if (!user) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(user.did);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = user.did;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_14px_30px_-16px_rgba(16,185,129,0.9)]">
          <ProfileIcon />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Mi perfil</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Activo
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Información de tu sesión e identidad emisora.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]">
        <ProfileRow label="Usuario" value={user.username} />

        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            DID del issuer
          </p>
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-white/10 bg-[#080c15] p-3">
            <p className="min-w-0 flex-1 break-all font-mono text-sm leading-relaxed text-slate-200">
              {user.did}
            </p>
            <button
              type="button"
              onClick={copyDid}
              aria-label="Copiar DID"
              title="Copiar DID"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                copyStatus === 'copied'
                  ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
                  : 'border-white/10 bg-white/[0.06] text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {copyStatus === 'copied' ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
          <p
            role="status"
            className={`mt-2 min-h-4 text-xs ${
              copyStatus === 'error' ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {copyStatus === 'copied' && 'DID copiado al portapapeles.'}
            {copyStatus === 'error' && 'No se pudo copiar el DID.'}
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 break-all text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
