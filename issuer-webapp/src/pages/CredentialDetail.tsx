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

  if (loading) return <p className="text-slate-500 text-sm">Cargando…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!credential) return null;

  return (
    <div className="space-y-4">
      <Link to="/credentials" className="text-sm text-indigo-600">
        ← Volver
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-medium text-slate-500 mb-1">Verifiable Credential</p>
        <pre className="text-xs overflow-x-auto">{JSON.stringify(credential, null, 2)}</pre>
      </div>

      {verifyResult && (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
          <ResultRow label="Válida" ok={verifyResult.validacionVc} />
          {verifyResult.trustChain !== undefined && (
            <ResultRow label="Trust chain" ok={verifyResult.trustChain} />
          )}
        </div>
      )}
      {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex-1 rounded-md bg-indigo-600 text-white py-2.5 font-medium disabled:opacity-60"
        >
          {verifying ? 'Verificando…' : 'Verify'}
        </button>
        <button
          disabled
          title="No disponible en este ambiente"
          className="flex-1 rounded-md border border-slate-300 py-2.5 font-medium text-slate-400 cursor-not-allowed"
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
      <span className="text-slate-500">{label}</span>
      <span className={ok ? 'text-emerald-600' : 'text-red-600'}>{ok ? 'Sí' : 'No'}</span>
    </div>
  );
}
