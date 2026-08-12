import { useState } from 'react';
import type { IssueVCParams } from '../../api/vc';
import { IssueDebugModal } from '../../components/IssueDebugModal';
import { useDebug } from '../../context/debug-context';

export function Step4Review({
  typeLabel,
  recipientDid,
  schemaUrl,
  expirationISO,
  data,
  issueParams,
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
  issueParams: IssueVCParams;
  issuing: boolean;
  error: string | null;
  result: { id: string } | null;
  onEmit: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const { enabled: debugEnabled } = useDebug();

  if (result) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400/35 bg-emerald-400/15 text-2xl text-emerald-400">
          ✓
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Credential emitted successfully</h2>
        <div className="break-all rounded-[10px] border border-white/10 bg-[#080c15] px-3.5 py-3 text-left font-mono text-sm text-slate-300">
          {result.id}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(result.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="min-h-[50px] rounded-[14px] bg-emerald-500 px-5 font-semibold text-white transition hover:bg-emerald-400"
        >
          {copied ? 'Copiado ✓' : 'Copiar Credential ID'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-slate-100">4. Emitir</h2>

      <dl className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] text-sm">
        <Row label="Credential Type" value={typeLabel} />
        <Row label="Recipient DID" value={recipientDid} mono />
        <Row label="Schema" value={schemaUrl} mono />
        <Row label="Expiration Date" value={expirationISO} mono />
      </dl>

      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Datos de la credencial</p>
        <pre className="max-h-80 overflow-auto rounded-[10px] border border-white/10 bg-[#080c15] p-3.5 text-xs leading-relaxed text-slate-300">{JSON.stringify(data, null, 2)}</pre>
      </div>

      {debugEnabled && (
        <button
          type="button"
          onClick={() => setDebugModalOpen(true)}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border border-amber-300/30 bg-amber-300/15 px-5 font-semibold text-amber-200 hover:bg-amber-300/20"
        >
          <span className="rounded bg-amber-300/20 px-1.5 py-0.5 text-xs font-semibold">DEBUG</span>
          Ver llamada completa
        </button>
      )}

      {error && (
        <pre
          role="alert"
          className="whitespace-pre-wrap break-words rounded-[10px] border border-red-400/30 bg-red-400/15 px-3.5 py-3 font-mono text-xs leading-relaxed text-red-200"
        >
          {error}
        </pre>
      )}

      <button
        onClick={onEmit}
        disabled={issuing}
        className="min-h-[50px] w-full rounded-[14px] bg-emerald-500 px-5 font-semibold text-white shadow-[0_10px_24px_-14px_#10b981] transition hover:bg-emerald-400 active:scale-[0.985] disabled:opacity-50"
      >
        {issuing ? 'Emitiendo…' : 'Emit Credential'}
      </button>

      {debugEnabled && debugModalOpen && (
        <IssueDebugModal params={issueParams} onClose={() => setDebugModalOpen(false)} />
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`break-all text-right text-slate-100 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
