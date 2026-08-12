# CLAUDE.md

Guidance for Claude Code when working in this directory. See `../CLAUDE.md` and `../Readme.md`
for the system-wide picture (roles, trust chain, other apps).

## Status

Functional: login/logout, 4-step issuance wizard, credentials list/detail, verify. Revoke is
wired in the UI but calls into stubs (`src/api/vc.ts`) since the backend doesn't expose it yet.
See `README.md`'s "Known issues" for the full list — keep that section up to date as things on
the backend change, rather than duplicating it here.

There is no test framework configured; `npm run build` (runs `tsc -b` first) is the fastest way
to catch a broken change.

## Wallet API — verified quirks

Don't trust the Swagger UI at `https://dev-identity-dwallet.l-net.io/` at face value; several
things only became clear by calling the live deployment directly:

- Real base path is `/wallet` (e.g. `POST /wallet/login`), overridable via
  `VITE_IDENTITY_API_BASE_URL`.
- `/login` returns a raw Keycloak token with no DID. `src/api/auth.ts` calls `POST /wallet-id`
  (idempotent get-or-create, empty body) right after login to resolve the issuer's own DID —
  don't ask the user for it or try to decode it out of the JWT, it isn't there.
- The issuer integration sends `POST /vc` with
  `{did, claimsVerifier, subject, type, context, trustedlist?, validUntil, data, privatekey,
  mediatorKey}`. Although transmitting signing secrets is not desirable, `privatekey` and
  `mediatorKey` are currently required by the backend implementation; keep them until that
  backend contract is corrected.
- `context` is dereferenced server-side as JSON-LD, not just stored — pointing it at a plain
  JSON Schema URL that 404s (or isn't valid JSON-LD) fails issuance with `ERR_SCHEMA_INVALID`.
  This is expected right now for 3 of the 4 ticket schema types (see README).
- `GET /issuer/{did}` lists, `GET /issuer/{did}/id/{id}` gets one, `POST /verify` verifies with
  `{vc: {credential}}`. No `GET /vc`, `GET /vc/:id`, `DELETE /vc/:id`, or `POST /vc/messages` —
  those are ticket/spec paths that don't exist on this deployment.

## Repo conventions

Branch name matches the folder name (`issuer-webapp`), per `../CLAUDE.md`. Run commands from
this directory, not the repo root — this app has its own `package.json` and no shared
workspace tooling ties it to the sibling apps.
