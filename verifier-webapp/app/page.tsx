import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import SessionBar from "./session-bar";
import VerifierPanel from "./verifier-panel";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden bg-ink font-sans">
      {/* Ambient blue glow behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(31,111,235,0.28),transparent_70%)]"
      />

      <SessionBar did={session.did} />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
        <header className="relative mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
            LNet Identity
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Verificador de credenciales
          </h1>
        </header>

        <div className="relative flex w-full flex-col items-center">
          <VerifierPanel />
        </div>
      </div>
    </div>
  );
}
