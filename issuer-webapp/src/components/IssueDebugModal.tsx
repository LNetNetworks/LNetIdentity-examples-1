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
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-debug-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white shadow-xl sm:max-w-3xl sm:rounded-xl"
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                DEBUG
              </span>
              <h2 id="issue-debug-title" className="text-lg font-semibold text-slate-900">
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
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-5 p-5">
          <dl className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-[7rem_1fr]">
            <dt className="font-medium text-slate-500">Endpoint</dt>
            <dd className="break-all font-mono text-xs text-slate-900">{request.endpoint}</dd>
            <dt className="font-medium text-slate-500">Método</dt>
            <dd className="font-mono text-xs font-semibold text-slate-900">{request.method}</dd>
            <dt className="font-medium text-slate-500">Autenticación</dt>
            <dd className="text-slate-700">Bearer token (oculto)</dd>
          </dl>

          <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-800">
              Wallet Private Key y Mediator Key están {showSecrets ? 'visibles' : 'ocultas'}.
            </p>
            <button
              type="button"
              onClick={() => setShowSecrets((visible) => !visible)}
              className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900"
            >
              {showSecrets ? 'Ocultar secretos' : 'Mostrar secretos'}
            </button>
          </div>

          <DebugBlock title="Parámetros de emisión" value={visibleParams} />
          <DebugBlock title="Payload enviado" value={visiblePayload} />

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Ejemplo completo</h3>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(callExample);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {copied ? 'Copiado ✓' : 'Copiar llamada'}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
              <code>{callExample}</code>
            </pre>
          </section>

          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
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
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </section>
  );
}
