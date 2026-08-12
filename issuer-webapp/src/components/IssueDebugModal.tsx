import { useEffect, useState } from 'react';
import { buildIssueVCRequest, type IssueVCParams } from '../api/vc';

export function IssueDebugModal({
  params,
  onClose,
}: {
  params: IssueVCParams;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const request = buildIssueVCRequest(params);
  const visibleParams = showSecrets
    ? params
    : { ...params, privateKey: '<hidden>', mediatorKey: '<hidden>' };
  const visiblePayload = showSecrets
    ? request.payload
    : { ...request.payload, privatekey: '<hidden>', mediatorKey: '<hidden>' };
  const callExample = `await fetch(${JSON.stringify(request.endpoint)}, {
  method: ${JSON.stringify(request.method)},
  headers: ${JSON.stringify(request.headers, null, 2)},
  body: JSON.stringify(${JSON.stringify(visiblePayload, null, 2)})
});`;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-debug-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[22px] border border-white/10 bg-[#121829] shadow-2xl sm:max-w-3xl sm:rounded-[22px]"
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-white/10 bg-[#121829]/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-2 py-0.5 text-xs font-semibold text-amber-200">
                DEBUG
              </span>
              <h2 id="issue-debug-title" className="text-lg font-semibold text-slate-100">
                Vista previa de la emisión
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Esta es la llamada que se realizará al emitir la credencial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista de debug"
            className="rounded-xl border border-white/15 bg-white/[0.08] px-3 py-1.5 text-sm text-slate-300 hover:bg-white/[0.12]"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-5 p-5">
          <dl className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm sm:grid-cols-[7rem_1fr]">
            <dt className="font-medium text-slate-500">Endpoint</dt>
            <dd className="break-all font-mono text-xs text-slate-200">{request.endpoint}</dd>
            <dt className="font-medium text-slate-500">Método</dt>
            <dd className="font-mono text-xs font-semibold text-slate-200">{request.method}</dd>
            <dt className="font-medium text-slate-500">Autenticación</dt>
            <dd className="text-slate-300">Bearer token (oculto)</dd>
          </dl>

          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-red-400/30 bg-red-400/15 px-3.5 py-3">
            <p className="text-xs text-red-200">
              Wallet Private Key y Mediator Key están {showSecrets ? 'visibles' : 'ocultas'}.
            </p>
            <button
              type="button"
              onClick={() => setShowSecrets((visible) => !visible)}
              className="shrink-0 rounded-xl border border-red-300/30 bg-red-300/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-300/20"
            >
              {showSecrets ? 'Ocultar secretos' : 'Mostrar secretos'}
            </button>
          </div>

          <DebugBlock title="Parámetros de emisión" value={visibleParams} />
          <DebugBlock title="Payload enviado" value={visiblePayload} />

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-200">Ejemplo completo</h3>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(callExample);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-xl border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.12]"
              >
                {copied ? 'Copiado ✓' : 'Copiar llamada'}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
              <code>{callExample}</code>
            </pre>
          </section>

          <p className="rounded-[10px] border border-amber-300/30 bg-amber-300/15 px-3.5 py-3 text-xs text-amber-200">
            El access token siempre se oculta. Wallet Private Key y Encryption / Mediator Key
            forman parte del payload: no compartas ni captures esta vista mientras estén visibles.
          </p>
        </div>
      </div>
    </div>
  );
}

function DebugBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </section>
  );
}
