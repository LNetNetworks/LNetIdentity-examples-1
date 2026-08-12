import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import type { WalletSettings } from '../types';
import { getMissingSettings, getMissingSettingsMessage } from '../utils/settings';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = useSettings();
  const [form, setForm] = useState<WalletSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [showMediator, setShowMediator] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const missing = getMissingSettings(form);
  const error = showValidationError && missing.length > 0
    ? getMissingSettingsMessage(missing)
    : null;

  function save() {
    if (missing.length > 0) {
      setShowValidationError(true);
      return;
    }

    setSettings(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-xl sm:rounded-xl shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900">Configuración del Issuer</h2>

        <SecretField
          label="Wallet Private Key"
          hint="Private key de la wallet del issuer. Se configura una vez y se reutiliza en todas las emisiones."
          value={form.walletPrivateKey}
          visible={showKey}
          onToggleVisible={() => setShowKey((v) => !v)}
          onChange={(v) => setForm({ ...form, walletPrivateKey: v })}
        />

        <div className="space-y-1">
          <label htmlFor="claims-verifier" className="text-sm font-medium text-slate-700">
            Claims Verifier Smart Contract
          </label>
          <input
            id="claims-verifier"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0x…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={form.claimsVerifier}
            onChange={(e) => setForm({ ...form, claimsVerifier: e.target.value })}
          />
          <p className="text-xs text-slate-500">
            Dirección del contrato ClaimsVerifier usado al emitir.
          </p>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Trusted List
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Opcional
            </span>
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0x… (contrato de trusted list, opcional)"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={form.trustedList}
            onChange={(e) => setForm({ ...form, trustedList: e.target.value })}
          />
          <p className="text-xs text-slate-500">
            Si está vacío, Trusted List no se incluye en la solicitud de emisión.
          </p>
        </div>

        <SecretField
          label="Encryption / Mediator Key"
          hint="Clave usada para cifrado e intercambio de mensajes. Se configura una vez por wallet."
          value={form.mediatorKey}
          visible={showMediator}
          onToggleVisible={() => setShowMediator((v) => !v)}
          onChange={(v) => setForm({ ...form, mediatorKey: v })}
        />

        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-slate-300 py-2.5 font-medium text-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-md bg-indigo-600 text-white py-2.5 font-medium"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function SecretField({
  label,
  hint,
  value,
  visible,
  onToggleVisible,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  visible: boolean;
  onToggleVisible: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="px-3 rounded-md border border-slate-300 text-sm text-slate-600 shrink-0"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}
