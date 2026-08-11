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
      <h2 className="text-lg font-semibold text-slate-900">1. Tipo de credencial</h2>
      <div className="grid gap-2">
        {CREDENTIAL_TYPES.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option)}
            className={`text-left px-4 py-3 rounded-lg border ${
              selected?.type === option.type
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className="font-medium text-slate-900">{option.label}</p>
            <p className="text-xs text-slate-500">{option.schemaUrl.split('/').pop()}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
