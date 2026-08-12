import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCredential, verifyCredential } from '../api/vc';
import { useAuth } from '../context/AuthContext';
import type { VCDetail, VerifyResponse } from '../types';

export function CredentialDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [credential, setCredential] = useState<VCDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    getCredential(user.did, id)
      .then(setCredential)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la credencial'))
      .finally(() => setLoading(false));
  }, [user?.did, id]);

  async function handleVerify() {
    if (!credential) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      setVerifyResult(await verifyCredential(credential));
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : 'No se pudo verificar la credencial');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>;
  if (error) return <pre className="whitespace-pre-wrap rounded-[10px] border border-red-400/30 bg-red-400/15 p-3.5 font-mono text-xs text-red-200">{error}</pre>;
  if (!credential) return null;

  return (
    <div className="space-y-4">
      <Link to="/credentials" className="text-sm font-medium text-emerald-300">
        ← Volver
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Verifiable Credential</p>
        <pre className="max-h-[340px] overflow-auto rounded-[10px] border border-white/10 bg-[#080c15] p-3.5 text-xs leading-relaxed text-slate-300">{JSON.stringify(credential, null, 2)}</pre>
      </div>

      {verifyResult && (
        <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] text-sm">
          <ResultRow label="Válida" ok={verifyResult.validacionVc} />
          {verifyResult.trustChain !== undefined && (
            <ResultRow label="Trust chain" ok={verifyResult.trustChain} />
          )}
        </div>
      )}
      {verifyError && <pre className="whitespace-pre-wrap rounded-[10px] border border-red-400/30 bg-red-400/15 p-3.5 font-mono text-xs text-red-200">{verifyError}</pre>}

      <div className="flex gap-2">
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="min-h-[50px] flex-1 rounded-[14px] bg-emerald-500 px-5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {verifying ? 'Verificando…' : 'Verify'}
        </button>
        <button
          disabled
          title="No disponible en este ambiente"
          className="min-h-[50px] flex-1 cursor-not-allowed rounded-[14px] border border-white/10 bg-white/[0.04] px-5 font-semibold text-slate-600"
        >
          Revoke
        </button>
      </div>
    </div>
  );
}

function ResultRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={ok ? 'text-emerald-400' : 'text-red-400'}>{ok ? 'Sí' : 'No'}</span>
    </div>
  );
}
