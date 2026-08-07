"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/auth-actions";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="user"
          className="text-xs font-medium uppercase tracking-widest text-muted"
        >
          Usuario
        </label>
        <input
          id="user"
          name="user"
          type="text"
          autoComplete="username"
          required
          placeholder="alice@example.com"
          className="rounded-lg border border-line bg-ink px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-brand-bright focus:outline-none focus:ring-1 focus:ring-brand-bright"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-xs font-medium uppercase tracking-widest text-muted"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="rounded-lg border border-line bg-ink px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-brand-bright focus:outline-none focus:ring-1 focus:ring-brand-bright"
        />
      </div>

      <div aria-live="polite" className="min-h-5">
        {state.error ? (
          <p className="text-sm text-red-400">{state.error}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
