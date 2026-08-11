import { useState } from 'react';

export function Step4Review({
  typeLabel,
  recipientDid,
  schemaUrl,
  expirationISO,
  data,
  issuing,
  error,
  result,
  onEmit,
}: {
  typeLabel: string;
  recipientDid: string;
  schemaUrl: string;
  expirationISO: string;
  data: Record<string, unknown>;
  issuing: boolean;
  error: string | null;
  result: { id: string } | null;
  onEmit: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (result) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Credential emitted successfully</h2>
        <div className="bg-slate-100 rounded-md px-3 py-2 text-sm font-mono break-all text-left">
          {result.id}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(result.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md bg-indigo-600 text-white px-4 py-2 font-medium"
        >
          {copied ? 'Copiado ✓' : 'Copiar Credential ID'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">4. Emitir</h2>

      <dl className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
        <Row label="Credential Type" value={typeLabel} />
        <Row label="Recipient DID" value={recipientDid} mono />
        <Row label="Schema" value={schemaUrl} mono />
        <Row label="Expiration Date" value={expirationISO} mono />
      </dl>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-medium text-slate-500 mb-1">Datos de la credencial</p>
        <pre className="text-xs overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={onEmit}
        disabled={issuing}
        className="w-full rounded-md bg-indigo-600 text-white font-medium py-2.5 disabled:opacity-60"
      >
        {issuing ? 'Emitiendo…' : 'Emit Credential'}
      </button>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 px-3 py-2">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className={`text-right text-slate-900 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
