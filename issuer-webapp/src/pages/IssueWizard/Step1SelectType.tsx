import { CREDENTIAL_TYPES } from '../../data/credentialTypes';
import type { CredentialTypeOption } from '../../types';

export function Step1SelectType({
  selected,
  onSelect,
}: {
  selected: CredentialTypeOption | null;
  onSelect: (option: CredentialTypeOption) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight text-slate-100">1. Tipo de credencial</h2>
      <div className="grid gap-2">
        {CREDENTIAL_TYPES.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option)}
            className={`rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.985] ${
              selected?.type === option.type
                ? 'border-emerald-400/40 bg-emerald-400/15'
                : 'border-white/10 bg-white/[0.045] hover:bg-white/[0.08]'
            }`}
          >
            <p className="font-semibold text-slate-100">{option.label}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{option.schemaUrl.split('/').pop()}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
