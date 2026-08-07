import { logoutAction } from "./auth-actions";

/** `did:lac:openprotest:0xABC...` → `did:lac:openprotest:0xABC…F12` */
function shortenDid(did: string): string {
  const identifier = did.slice(did.lastIndexOf(":") + 1);
  if (identifier.length <= 16) return did;
  const prefix = did.slice(0, did.lastIndexOf(":") + 1);
  return `${prefix}${identifier.slice(0, 8)}…${identifier.slice(-4)}`;
}

export default function SessionBar({ did }: { did: string | null }) {
  return (
    <div className="relative flex w-full items-center justify-between gap-4 border-b border-line/60 px-6 py-3">
      <p className="truncate text-xs text-muted">
        {did ? (
          <>
            Sesión activa ·{" "}
            <span className="font-mono text-foreground/80" title={did}>
              {shortenDid(did)}
            </span>
          </>
        ) : (
          "Sesión activa"
        )}
      </p>

      <form action={logoutAction}>
        <button
          type="submit"
          className="shrink-0 rounded-full border border-line px-4 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-brand-bright hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
