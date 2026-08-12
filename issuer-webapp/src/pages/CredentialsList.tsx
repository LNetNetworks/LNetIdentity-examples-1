import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCredentials } from '../api/vc';
import { useAuth } from '../context/AuthContext';
import type { CredentialSummary } from '../types';

export function CredentialsList() {
  const { user } = useAuth();
  const [items, setItems] = useState<CredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listCredentials(user.did)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar las credenciales'))
      .finally(() => setLoading(false));
  }, [user?.did]);

  if (loading) return <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>;
  if (error) return <pre className="whitespace-pre-wrap rounded-[10px] border border-red-400/30 bg-red-400/15 p-3.5 font-mono text-xs text-red-200">{error}</pre>;
  if (items.length === 0) return <p className="py-12 text-center text-sm text-slate-400">Todavía no emitiste credenciales.</p>;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={`/credentials/${encodeURIComponent(item.id)}`}
            className="block rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 transition hover:bg-white/[0.08] active:scale-[0.985]"
          >
            <p className="font-semibold text-slate-100">{item.type}</p>
            <p className="mt-1 truncate font-mono text-xs text-slate-400">{item.did_holder}</p>
            <p className="truncate font-mono text-xs text-slate-600">{item.id}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
