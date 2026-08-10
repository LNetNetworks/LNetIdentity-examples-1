"use client";

import { useState, useTransition } from "react";

import {
  listRecentCredentialsAction,
  type CredentialsState,
} from "./credential-actions";
import { generateQrAction, type QrState } from "./qr-actions";

export default function VerifierPanel() {
  const [qr, setQr] = useState<QrState>({ status: "idle" });
  const [credentials, setCredentials] = useState<CredentialsState>({
    status: "idle",
  });
  const [isPending, startTransition] = useTransition();
  const [isListing, startListing] = useTransition();

  function generateQr() {
    startTransition(async () => {
      setQr(await generateQrAction());
    });
  }

  function listCredentials() {
    startListing(async () => {
      setCredentials(await listRecentCredentialsAction());
    });
  }

  return (
    <>
      {/* QR panel */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-6 rounded-3xl bg-brand/20 blur-2xl"
        />
        <div className="relative rounded-2xl border border-line bg-white p-5 shadow-2xl shadow-brand/20">
          <div className="size-52 sm:size-60">
            {qr.status === "ready" ? (
              <div
                role="img"
                aria-label="Código QR con la URL de verificación"
                className="size-full [&>svg]:size-full"
                // The SVG is produced server-side by `qrcode` from the URL the
                // Wallet API returned: markup we generate, not markup we were
                // handed.
                dangerouslySetInnerHTML={{ __html: qr.svg }}
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-lg border-2 border-dashed border-black/15 px-6 text-center text-sm text-black/50">
                {isPending
                  ? "Generando…"
                  : "Generá un QR para que la wallet presente una credencial."}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={generateQr}
        disabled={isPending}
        className="mt-8 rounded-full bg-brand px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Generando…" : "Generar QR"}
      </button>

      {qr.status === "error" && (
        <p
          role="alert"
          className="mt-4 max-w-md text-center text-sm text-red-400"
        >
          {qr.error}
        </p>
      )}

      {qr.status === "ready" && (
        <a
          href={qr.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 max-w-md break-all text-center font-mono text-xs text-muted underline-offset-4 hover:text-brand-bright hover:underline"
        >
          {qr.url}
        </a>
      )}

      <hr className="mt-12 w-full max-w-md border-line/70" />

      <section aria-live="polite" className="mt-8 w-full max-w-md">
        <button
          type="button"
          onClick={listCredentials}
          disabled={isListing}
          className="w-full rounded-full border border-line px-6 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:border-brand-bright hover:text-brand-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isListing
            ? "Buscando…"
            : "Listar las últimas 5 credenciales recibidas"}
        </button>

        {credentials.status === "error" && (
          <p role="alert" className="mt-4 text-center text-sm text-red-400">
            {credentials.error}
          </p>
        )}

        {credentials.status === "ready" && (
          <div className="mt-4 rounded-xl border border-line/70 bg-surface/60 p-4">
            {credentials.credentials.length === 0 ? (
              <p className="text-sm text-muted">
                Todavía no se recibió ninguna credencial.
              </p>
            ) : (
              <ul className="space-y-3">
                {credentials.credentials.map((credential) => (
                  <li key={credential.id} className="text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-foreground/90">
                        {credential.type ?? "Credencial"}
                      </span>
                      {credential.receivedAt !== null && (
                        <time
                          dateTime={new Date(
                            credential.receivedAt,
                          ).toISOString()}
                          className="shrink-0 font-mono text-xs text-muted"
                        >
                          {new Date(credential.receivedAt).toLocaleString(
                            "es-AR",
                          )}
                        </time>
                      )}
                    </div>
                    <p className="mt-0.5 break-all font-mono text-xs text-muted">
                      {credential.holder ?? "Titular desconocido"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </>
  );
}
