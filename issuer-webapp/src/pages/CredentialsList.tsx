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

  if (loading) return <p className="text-slate-500 text-sm">Cargando…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (items.length === 0) return <p className="text-slate-500 text-sm">Todavía no emitiste credenciales.</p>;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={`/credentials/${encodeURIComponent(item.id)}`}
            className="block bg-white rounded-lg border border-slate-200 px-4 py-3"
          >
            <p className="font-medium text-slate-900">{item.type}</p>
            <p className="text-xs text-slate-500 font-mono truncate">{item.did_holder}</p>
            <p className="text-xs text-slate-400 font-mono truncate">{item.id}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
