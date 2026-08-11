import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">VC Issuer</h1>
          <p className="text-sm text-slate-500">Emisión y gestión de credenciales verificables</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Usuario</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 text-white font-medium py-2.5 disabled:opacity-60 active:bg-indigo-700"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
