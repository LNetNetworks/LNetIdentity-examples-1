# LNetIdentity examples

This repository is a compilation of example projects showing how to assemble a
decentralized identity system on top of the **LNet identity stack** and the **D-Wallet**
service. Each example plays one of the roles of the assignment below, so together they
walk a credential through its whole life: a trust list admits an issuer, the issuer mints
a verifiable credential, a holder keeps it in a wallet, and a verifier checks it against
that trust list.

None of the examples reimplement identity primitives. DIDs, credential proofs and the
trust list all live in the LNet stack; these apps are thin clients over its HTTP APIs —
mainly the hosted **D-Wallet API** (`https://dev-identity-dwallet.l-net.io/`), which gives
each user a custodial wallet and issues, delivers and verifies credentials on their behalf.

The exercise behind it is deliberate: run one basic circuit through the entire stack, so the
team learns it hands-on and any friction it has surfaces early enough to be written down.
Findings belong in each app's own README, next to the code that hit them.

## Environment

Everything runs against the shared dev deployment; there is no local stack to stand up.

| Service | Base URL |
| --- | --- |
| D-Wallet API | `https://dev-identity-dwallet.l-net.io/` |
| PKD / governance API | `https://dev-identity-governance-api.l-net.io/` |
| SSI-VC API | `https://dev-identity-api.l-net.io/` |
| Keycloak (realm `d-wallet`) | `https://dev-auth.l-net.io/` |

Network `openprotest`, RPC `https://testnet-writer1.l-net.io`. The contracts the examples verify
against are already deployed: credential registry `0x46e50D29e8eE1BEbc025F4Ed8aDa39e0A6ab4827`,
claims verifier `0xf61aA3e9Ff67c53Adc47f2c02dE7545aDfB9c0B4`.

Test users (issuers and verifier) live in that Keycloak realm — this repository is public, so
ask the team for credentials and API keys rather than looking for them here. Keep them in
`.env.local`; every app ships an `.env.example` listing what it needs.

## The LNet identity stack

The pieces the examples sit on top of. Most live in the `LNetNetworks` organization and are
internal, so some links may not resolve without access. The three hosted services — D-Wallet,
SSI-VC and the PKD API — are developed on GitLab under `lacnet/agroweb3`, branch `develop`, and
mirrored to the GitHub repositories below; check the GitLab side when something in the dev
deployment does not match the mirror.

| Repository | Layer | What it provides |
| --- | --- | --- |
| [did-registry-contracts](https://github.com/LNetNetworks/did-registry-contracts) | On-chain | Solidity DID Registry for the `did:lac` method, based on [ERC-1056](https://github.com/ethereum/EIPs/issues/1056). Any address becomes a self-managed DID; the contracts hold controllers, key rotation and recovery, verification methods and services — the material a DID Document is resolved from. |
| [ssi-contracts](https://github.com/LNetNetworks/ssi-contracts) | On-chain | `TrustedRegistry` — the trust list itself: which entities are admitted and may therefore act as credential issuers. This is the substrate for role 1. *(Sources live on the `development` branch.)* |
| [vc-contracts](https://github.com/LNetNetworks/vc-contracts) | On-chain | `CredentialRegistry` and `ClaimsVerifier` — credential proofs registered on-chain, issuer roles, revocation, and the verification a verifier ultimately relies on. Ships gas and gasless (meta-transaction) variants. *(Sources live on the `development` branch.)* |
| [lnet-did-js](https://github.com/LNetNetworks/lnet-did-js) | Library | Node.js implementation of the DID method: create and update a DID Document, rotate or recover keys, and resolve a DID without calling the contracts directly. |
| [did-cli](https://github.com/LNetNetworks/did-cli) | Tooling | Command line over that library — create DIDs, register and revoke verification methods, controllers and services, and resolve DID Documents against a configured network and registry. |
| [ssi-vc](https://github.com/LNetNetworks/ssi-vc) | Service | The SSI-VC API: issues and revokes W3C verifiable credentials, registers their proofs on-chain, persists the documents, deploys the credential registry and claims verifier, and delivers credentials through a DIDComm mailbox. |
| [ssi-pkd-api](https://github.com/LNetNetworks/ssi-pkd-api) | Service | PKD and Trusted List REST API — the governance side: deploy a PKD and register the entities that populate the trust list. |
| [vc-repository](https://github.com/LNetNetworks/vc-repository) | Schemas | Public repository where the JSON schemas of the issued credential types are defined and published. |
| [digital-identity-bootstrap](https://github.com/LNetNetworks/digital-identity-bootstrap) | Harness | Chained script runner against the real APIs: deploy the PKD, register entities, log into D-Wallet, issue credentials, deploy the registry and claims verifier, grant issuer roles. The fastest way to watch the whole flow end to end without any UI. |

The trust chain is what ties them together, and it is the core constraint every example
inherits: a verifier accepts a credential only if its issuer is in the trust list governed
by the trusted list manager.

## The challenge

These examples do not start from a product spec. They start from a challenge: take one
concrete use case and solve it end to end with the LNet stack, turning its roles into running
apps — see [Repository layout](#repository-layout) for which ones exist so far. The assignment,
as it was handed over:

> Given the following roles:
>
> - 1 - Trusted List Manager
> - 2 - Credential Issuer
> - 3 - User
> - 4 - Verifier
>
> Create a decentralized identity system that allows a higher-level entity to manage the governance of a trust list, adding sub-entities that fulfill the role of credential issuers.
>
> These issuers will be able to generate credentials in the form of "virtual certificates," which users will receive in their wallets.
>
> These users will also be able to present the credentials on a verification portal that supports the reading of a QR code or a unique presentation code.

## How the case is solved

In two phases: a **setup** that establishes governance and trust on-chain, done once by the
trusted list manager, and a **runtime** flow that the apps in this repository act out, from
issuance to verification.

### Setup — governance and permissions

1. **Deploy the PKD** — `POST /pki/pkd/deploy` on the PKD API. The root of governance, owned by the Trusted List Manager (role 1); every address downstream hangs off this one.
2. **Deploy a trusted list and register entities in it** — `POST /pki/pkd/{pkd}/register` and the `/pki/tl/…` endpoints. This is where an organization is admitted as a credential issuer (role 2). Admission is revocable (`DELETE /pki/tl/{tl}/revoke/{entity}`), and revoking it is what later invalidates everything that issuer signed.
3. **Create the DIDs** — each participant gets a `did:lac:<network>:<address>`, either through D-Wallet (`POST /login`, then `POST /`) or with `did-cli` / `lnet-did-js` straight against the DID Registry.
4. **Deploy the credential registry** — `POST /registry/credentials/deploy` on SSI-VC. The contract where credential proofs are anchored and revocations recorded.
5. **Deploy the claims verifier** — `POST /registry/verifier/deploy`, bound to that registry. It is what a verifier consults to decide whether a proof holds.
6. **Grant the issuer permissions** — `PUT /registry/verifier/{address}/issuer`. Only addresses holding `ISSUER_ROLE` can anchor credentials; until this step the issuer is admitted but cannot emit anything.

Steps 1–6 are scripted end to end in
[digital-identity-bootstrap](https://github.com/LNetNetworks/digital-identity-bootstrap), and the
order matters: each scenario consumes the address the previous one produced.

**Where this currently stands:** the PKD leg — steps 1 and 2 — is parked for now, and the
circuit is being exercised from step 3 onwards against the already deployed registry and claims
verifier. Membership in the trusted list is therefore assumed rather than enforced end to end;
what actually gates issuance today is the `ISSUER_ROLE` of step 6. The three issuer identities
and the verifier exist as Keycloak users with a D-Wallet already generated, so step 3 is done
for them too.

### Runtime — issuance, custody, presentation, verification

7. **Issue the credential** — `POST /vc`. The issuer emits a W3C verifiable credential for a subject DID, with its type, JSON-LD context, expiry and the trusted list it answers to, shaped by a schema published in `vc-repository` ([`test_reference.json`](https://github.com/LNetNetworks/vc-repository/blob/main/schemas/test_reference.json) is the one used for these tests). The proof is registered on-chain and the credential delivered to the holder's wallet.
8. **Hold it** — `GET /holder/{did}`. The user (role 3) logs into the wallet and finds the credential waiting; `wallet-webapp` and `wallet-flutter-app` are two takes on this same role.
9. **Present it** — the verification portal (role 4) displays a QR encoding its own verification URL (`GET /verifier/verification-url`). The wallet scans it, the holder chooses which credential to present, and the wallet sends the presentation (`POST /shareverify/{did}`).
10. **Verify it** — `GET /verifier/{did}`. The portal reads the presentations it has received, and the operator picks one to verify. Two outcomes have to be told apart on screen: **valid**, and **invalid or expired**. The verdict rests on the whole chain holding at once: a valid signature, a proof anchored and not revoked in the credential registry, and an issuer still listed in the trusted list from step 2.

The mirror image of step 9 — a holder scanning a QR to *request* a credential, sending their DID
to an issuer URL that mints one back — is part of the same design but **is not implemented**, on
either side.

## Which app solves each step

Every step above belongs to exactly one app, and every app to one role. Following the
convention of this repository, each one lives in its own top-level folder and is developed on
a branch of the same name.

| Step | App | Role | Folder / branch | Status |
| --- | --- | --- | --- | --- |
| 1, 2, 4, 5, 6 | Trusted list backoffice | 1 — Trusted List Manager | `trustlist-webapp/` | To build |
| 3, 7 | Issuer backoffice | 2 — Credential Issuer | `issuer-webapp/` | To build |
| 3, 8, 9 | Holder wallet | 3 — User | `wallet-webapp/`, `wallet-flutter-app/` | Built |
| 9, 10 | Verification portal | 4 — Verifier | `verifier-webapp/` | Built |

Until the two backoffices exist, steps 1–7 are covered headlessly by the scripts in
`digital-identity-bootstrap` — that harness is the reference for what those UIs have to do.

### `trustlist-webapp/` — Trusted List Manager backoffice · to build

The governance console, and the most privileged app of the set. It should offer, in this order:
a one-time **PKD deploy** that surfaces the resulting address; an **entities** screen listing
who is registered in the trusted list, with register and revoke as the two write actions; and a
**permissions** screen that deploys the credential registry and the claims verifier and grants
`ISSUER_ROLE` to an admitted entity — the moment an organization stops being merely listed and
becomes able to emit.

It talks to the PKD API (`/pki/pkd/*`, `/pki/tl/*`) and to SSI-VC (`/registry/*`). It is the one
app that handles an admin private key, so every call belongs on the server — server actions or
route handlers, never a key reaching the browser. Revocation deserves a confirmation step: it
invalidates every credential that issuer signed.

### `issuer-webapp/` — Credential Issuer backoffice · to build

Where a "virtual certificate" is actually minted. It needs a **login** for the issuing
organization, a **new credential** form that picks a type from the schemas published in
`vc-repository` and fills the subject's data, expiry and JSON-LD context, and an **issued
credentials** list with revocation (`DELETE /vc/:id`). Issuing is `POST /vc`, which anchors the
proof on-chain and delivers the credential to the holder's wallet — so the form needs the
holder's DID as input, and the UI should show the on-chain hash it got back as the receipt.

Login is the D-Wallet one (`POST /login`) with the issuer users that exist in Keycloak; the
access token carries the issuer role, so the app never picks the issuing DID by hand. It only
works if step 6 already ran for that issuer — a clear error when the role is missing is worth
more here than any other validation. A QR that lets a holder *request* a credential is part of
the design but not implemented anywhere yet.

There is already a platform-side issuer front at `https://dev-identity-app.l-net.io/`. It is
worth a look before starting: this example is meant to be the minimal version of that flow, and
the rough edges found while using it (credential type and schema deserve dropdowns fed by the
backend, not free text; retrieving a VC does not work) are the ones worth not repeating.

### `wallet-webapp/`, `wallet-flutter-app/` — Holder wallet · built

Two implementations of the same role, one Vite PWA and one Flutter app, both against the same
D-Wallet API: onboarding that creates the user's DID, the credential list (`GET /holder/{did}`)
and detail view, the QR scanner, and the screen that picks a credential and sends the
presentation (`POST /shareverify/{did}`). Both are installable on a phone, since scanning a QR
from a desktop browser defeats the point.

### `verifier-webapp/` — Verification portal · built

The screen a verifier puts in front of a person: it logs in, requests its verification URL
(`GET /verifier/verification-url`), renders it as a QR for the wallet to scan, and lists the
presentations it has received (`GET /verifier/{did}`). What is still missing is the verdict
itself — selecting one of those presentations, verifying it, and showing **valid** or **invalid
or expired** unambiguously. That last screen is what turns the list into an actual verification
portal, and reading a unique presentation code instead of a QR should reach the same result.

## Repository layout

Each example is a self-contained app in its own top-level directory. There is no
workspace or monorepo tooling tying them together — install and run each one from its
own directory.

| Directory | Role | Stack |
| --- | --- | --- |
| `verifier-webapp/` | 4 — Verifier | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| `wallet-webapp/` | 3 — User (holder) | Vite + React PWA, TypeScript |
| `wallet-flutter-app/` | 3 — User (holder) | Flutter (web and macOS targets) |

Roles 1 (Trusted List Manager) and 2 (Credential Issuer) have no app yet; `trustlist-webapp/`
and `issuer-webapp/` are the folders reserved for them.

## Branches

One branch per example, named exactly after its directory. `main` is the default branch
and the usual PR target; it integrates every example, so it is the only branch where the
full system is present at once.

| Branch | App | State |
| --- | --- | --- |
| `main` | All examples, integrated | Default branch, PR target |
| `verifier-webapp` | Verification portal (role 4) | Merged into `main` |
| `wallet-webapp` | Vite PWA wallet (role 3) | Merged into `main` |
| `wallet-flutter-app` | Flutter wallet (role 3) | In sync with `main` |

The two apps still to build follow the same rule: branch `trustlist-webapp` and
`issuer-webapp` off `main`, one folder each, and merge back when they work.

**Deployment caveat:** `wallet-flutter-app` is the *production* branch of its Vercel
project, not `main`. Pushing to it deploys straight to production, with no preview step
in between.
