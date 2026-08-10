import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar · Verifier Webapp",
};

export default async function LoginPage() {
  if (await getSession()) {
    redirect("/");
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-ink px-6 py-16 font-sans">
      {/* Ambient blue glow behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(31,111,235,0.28),transparent_70%)]"
      />

      <header className="relative mb-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">
          LNet Identity
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Ingresar al verificador
        </h1>
        <p className="mt-3 text-sm text-muted">
          Autenticate para verificar credenciales presentadas.
        </p>
      </header>

      <main className="relative w-full max-w-sm rounded-2xl border border-line/70 bg-surface/60 p-6 shadow-2xl shadow-brand/10 sm:p-8">
        <LoginForm />
      </main>
    </div>
  );
}
