import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import type { WalletSettings } from '../types';
import { getMissingSettings, getMissingSettingsMessage } from '../utils/settings';
import { PasswordVisibilityButton } from './PasswordVisibilityButton';

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
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-[22px] border border-white/10 bg-[#121829] p-5 shadow-2xl sm:max-w-md sm:rounded-[22px]">
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Configuración del Issuer</h2>

        <SecretField
          label="Wallet Private Key"
          hint="Private key de la wallet del issuer. Se configura una vez y se reutiliza en todas las emisiones."
          value={form.walletPrivateKey}
          visible={showKey}
          onToggleVisible={() => setShowKey((v) => !v)}
          onChange={(v) => setForm({ ...form, walletPrivateKey: v })}
        />

        <div className="space-y-1">
          <label htmlFor="claims-verifier" className="text-sm font-semibold text-slate-400">
            Claims Verifier Smart Contract
          </label>
          <input
            id="claims-verifier"
            type="text"
            className="min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] px-3.5 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:bg-[#0b0f19]"
            placeholder="0x…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={form.claimsVerifier}
            onChange={(e) => setForm({ ...form, claimsVerifier: e.target.value })}
          />
          <p className="text-xs leading-relaxed text-slate-500">
            Dirección del contrato ClaimsVerifier usado al emitir.
          </p>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-400">
            Trusted List
            <span className="rounded-full border border-white/10 bg-white/[0.08] px-2 py-0.5 text-xs font-medium text-slate-400">
              Opcional
            </span>
          </label>
          <input
            className="min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] px-3.5 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:bg-[#0b0f19]"
            placeholder="0x… (contrato de trusted list, opcional)"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={form.trustedList}
            onChange={(e) => setForm({ ...form, trustedList: e.target.value })}
          />
          <p className="text-xs leading-relaxed text-slate-500">
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
          <div role="alert" className="rounded-[10px] border border-red-400/30 bg-red-400/15 px-3.5 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="min-h-[50px] flex-1 rounded-[14px] border border-white/15 bg-white/[0.08] px-5 font-semibold text-slate-100 transition hover:bg-white/[0.12]"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="min-h-[50px] flex-1 rounded-[14px] bg-emerald-500 px-5 font-semibold text-white transition hover:bg-emerald-400"
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
      <label className="text-sm font-semibold text-slate-400">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className="min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] py-3 pl-3.5 pr-12 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:bg-[#0b0f19]"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <PasswordVisibilityButton visible={visible} onToggle={onToggleVisible} />
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}
