# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Early scaffold. `verifier-webapp/` is a Next.js 16 app with login against the Wallet API and a QR panel that encodes the real verification URL from `GET /verifier/verification-url`; consuming the resulting presentation (`POST /verify`) is not wired up yet. The other three roles have no code at all.

There is **no test framework configured** in any app; `npm run lint` and `npm run build` are currently the only verification available. Add the test command here once a runner is set up.

## Commands

Run from the app directory (e.g. `verifier-webapp/`), not the repo root — each example has its own `package.json`:

```bash
npm install
npm run dev    # dev server on http://localhost:3000
npm run build  # production build (also the fastest full typecheck)
npm run lint   # eslint
npm start      # serve the production build
```

## What is being built

A decentralized identity system (see `Readme.md`) modeling four roles:

1. **Trusted List Manager** — a higher-level entity that governs a trust list and admits sub-entities as credential issuers.
2. **Credential Issuer** — admitted via the trust list; issues credentials as "virtual certificates."
3. **User** — receives credentials into a wallet and presents them.
4. **Verifier** — a verification portal that reads a QR code or a unique presentation code to verify a presented credential.

The trust chain is the core architectural constraint: a Verifier's decision depends on the credential's issuer being present in the trust list managed by the Trusted List Manager. Expect any implementation to be organized around this chain (trust list → issuance → wallet/presentation → verification) rather than around a single app.

## Repository layout convention

This is an examples/multi-app repository (`LNetIdentity-examples-1`). Each role-specific example lives in its own top-level directory, self-contained with its own `package.json` — `verifier-webapp/` is the first, corresponding to role 4 (Verifier). Add new examples as sibling directories rather than nesting them. There is no workspace/monorepo tooling tying them together.

## Next.js version caveat

`verifier-webapp/` runs **Next.js 16**, which has breaking changes relative to most training data. `verifier-webapp/CLAUDE.md` is a one-line `@AGENTS.md` import, and that `AGENTS.md` is generated and re-added by `next dev` — do not hand-edit either; commit the regenerated block along with your work to keep the tree clean. Consult `verifier-webapp/node_modules/next/dist/docs/` before writing non-trivial Next.js code.

Two things already differ from older conventions and are load-bearing here: layouts receive generated route types (`LayoutProps<"/">` in `app/layout.tsx`) rather than a hand-written props interface, and `next.config.ts` pins `turbopack.root` to the app directory — without it Turbopack walks up past the repo looking for a lockfile and finds a stray one in the home directory.

## Wallet API

`verifier-webapp/` talks to the Wallet API documented at https://dev-identity-dwallet.l-net.io/. Two things the Swagger UI hides: the OpenAPI document declares **`/wallet` as the server base path**, so `post_login` is really `POST /wallet/login`; and the spec is served from `/swagger-ui-init.js` (there is no `/openapi.json` or `/swagger.json`) — parse the `swaggerDoc` object out of that file to read it.

The spec documents 401 for bad credentials, but the deployment actually returns **500** with `{"code":1,"message":"ERR_KEYCLOAK_GENERATE_TOKEN: ... Invalid user credentials"}`. Anything mapping API errors to user-facing messages has to handle both.

Override the base URL with `IDENTITY_API_BASE_URL` (see `.env.example`); `lib/identity-api.ts` falls back to the dev URL.

## Git conventions

Work happens on a branch named after the example being built (currently `verifier-webapp`); `main` is the default branch and the usual PR target.
