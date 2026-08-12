# issuer-webapp

Issuer backoffice for the LNetIdentity example system — the **Credential Issuer** role (2). It
issues Verifiable Credentials to a holder DID via the Wallet API, lists what it has issued, and
verifies a credential. See the [assignment spec](../Readme.md) for the full role model.

Login, dynamic issuance form (schema-driven), credentials list/detail and verification are
implemented. Revocation is in the UI but disabled (see Known issues). Installable PWA
(manifest, icons, standalone mode).

## Development

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # production build (also the fastest full typecheck)
```

## Stack

Vite, React 19, TypeScript, Tailwind CSS 4, react-router-dom, `qr-scanner`, `vite-plugin-pwa`.
No server component — a pure client SPA against the Wallet API (CORS is open there).

## Configuration

No secrets are stored in environment variables. The issuer logs in through the UI with their
Keycloak user; the Wallet Private Key / Claims Verifier / Trusted List / Mediator Key used
during issuance are configured from the app itself (gear icon → Settings) and persisted in
`localStorage` per user. `VITE_IDENTITY_API_BASE_URL` (see `.env.example`) overrides the Wallet
API base URL if you need to point at a different environment; it defaults to the dev deployment.

## Known issues

Found while wiring this up against the real deployment rather than the Swagger doc alone —
listed here per the root README's ask to log problems in the related app.

- **`POST /vc` only works once the issuer has `ISSUER_ROLE`.** Per the root README's
  "Current condition", this is currently the only control on issuance. Without it the backend
  returns `ERR_CREDENTIAL_REGISTER: ... Caller is not a issuer`, which the app surfaces as-is —
  confirmed live against `issuertest1`. This is not something the frontend can fix.
- **Only `test_reference.json` currently exists in `vc-repository`.** The 4 schemas from the
  ticket (`education_schema.json`, `skills_schema.json`, `health_schema.json`,
  `default_schema.json`) 404 on `raw.githubusercontent.com`. They're bundled locally
  (`src/data/credentialTypes.ts`) as a fallback so Step 2's form still renders; `fetchSchema`
  tries the real URL first and will pick it up automatically once published. The exact files to
  upload are staged locally in `schemas/` (not committed here — they belong in `vc-repository`).
- **No revoke or mailbox endpoints are deployed.** `DELETE /vc/:id` and `POST /vc/messages` both
  404 today even though the root README describes revocation as part of this app's scope. The
  Revoke button is present but disabled with a "not available in this environment" notice;
  `revokeVC`/`getMailbox` in `src/api/vc.ts` are written against the documented shape and just
  need the endpoint to exist.
- **Claims Verifier address mismatch.** The ticket's default (`0x2a574Fc01ccdFEa384577E8Cea6f0F8768D03aE8`,
  used as the Settings default) differs from the one the root README lists as already deployed
  (`0xf61aA3e9Ff67c53Adc47f2c02dE7545aDfB9c0B4`). The configured value is sent as
  `claimsVerifier` in `POST /vc`, so the correct address must be confirmed for each environment.
- **Not yet compared against the reference issuer front-end** at
  `https://dev-identity-app.l-net.io/` that the root README points to, including whether the
  backend can drive the credential type / schema dropdowns instead of the hardcoded list in
  `credentialTypes.ts`.
- The Swagger UI at the documented URL hides the real server base path (`/wallet`) and doesn't
  match the live DTOs in a few places (e.g. `POST /vc`'s real shape, `/login`'s response, and
  the fact that `/wallet-id` is needed to resolve the issuer's own DID) — the code follows what
  was verified live, not the Swagger doc.
