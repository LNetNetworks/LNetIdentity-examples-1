# LNetIdentity examples

This repository contains example apps. They show how to build a decentralized identity
system with the **LNet identity stack** and the **D-Wallet** service. Each app has one role
of the assignment below. Together, the apps show the full life of a credential: a trust list
admits an issuer, the issuer issues a verifiable credential, a holder keeps the credential in
a wallet, and a verifier checks the credential against the trust list.

The apps do not implement identity functions again. The LNet stack contains the DIDs, the
credential proofs and the trust list. The apps are thin clients of its HTTP APIs. The primary
API is the **D-Wallet API** (`https://dev-identity-dwallet.l-net.io/`). It gives a custodial
wallet to each user. It also issues, delivers and verifies credentials for the users.

The exercise has one goal: do one basic flow through the full stack. Thus the team learns the
stack, and finds the problems early. Write each problem in the README of the related app.

## Environment

All apps use the shared dev deployment. You do not install a local stack.

| Service | Base URL |
| --- | --- |
| D-Wallet API | `https://dev-identity-dwallet.l-net.io/` |
| PKD / governance API | `https://dev-identity-governance-api.l-net.io/` |
| SSI-VC API | `https://dev-identity-api.l-net.io/` |
| Keycloak (realm `d-wallet`) | `https://dev-auth.l-net.io/` |

The network is `openprotest`. The RPC URL is `https://testnet-writer1.l-net.io`. These
contracts are already deployed:

- Credential registry: `0x46e50D29e8eE1BEbc025F4Ed8aDa39e0A6ab4827`
- Claims verifier: `0xf61aA3e9Ff67c53Adc47f2c02dE7545aDfB9c0B4`

The test users (the issuers and the verifier) are in that Keycloak realm. This repository is
public. Thus it does not contain the credentials or the API keys — ask the team for them. Put
them in `.env.local`. Each app has an `.env.example` file with the necessary variables.

## The LNet identity stack

The apps use the components in the table below. Most components are in the `LNetNetworks`
organization and are internal. Thus some links do not open without access.

The three hosted services (D-Wallet, SSI-VC and the PKD API) are developed on GitLab, in
`lacnet/agroweb3`, branch `develop`. GitHub has a mirror of them. If the dev deployment is
different from the mirror, look at the GitLab code.

| Repository | Layer | Function |
| --- | --- | --- |
| [did-registry-contracts](https://github.com/LNetNetworks/did-registry-contracts) | On-chain | Solidity DID Registry for the `did:lac` method, based on [ERC-1056](https://github.com/ethereum/EIPs/issues/1056). Each address becomes a self-managed DID. The contracts keep the controllers, the key rotation and recovery, the verification methods and the services. A DID Document is resolved from this data. |
| [ssi-contracts](https://github.com/LNetNetworks/ssi-contracts) | On-chain | `TrustedRegistry` — the trust list. It records which entities are admitted and thus can be credential issuers. It is the base for role 1. *(The sources are on the `development` branch.)* |
| [vc-contracts](https://github.com/LNetNetworks/vc-contracts) | On-chain | `CredentialRegistry` and `ClaimsVerifier` — credential proofs on-chain, issuer roles and revocation. A verifier uses them for the final decision. There is a gas variant and a gasless (meta-transaction) variant. *(The sources are on the `development` branch.)* |
| [lnet-did-js](https://github.com/LNetNetworks/lnet-did-js) | Library | Node.js implementation of the DID method. Use it to create and update a DID Document, to rotate or recover keys, and to resolve a DID. You do not call the contracts directly. |
| [did-cli](https://github.com/LNetNetworks/did-cli) | Tooling | Command line for that library. Use it to create DIDs, to register and revoke verification methods, controllers and services, and to resolve DID Documents. You set the network and the registry. |
| [ssi-vc](https://github.com/LNetNetworks/ssi-vc) | Service | The SSI-VC API. It issues and revokes W3C verifiable credentials, registers their proofs on-chain, keeps the documents, deploys the credential registry and the claims verifier, and delivers credentials through a DIDComm mailbox. |
| [ssi-pkd-api](https://github.com/LNetNetworks/ssi-pkd-api) | Service | The PKD and Trusted List REST API. Use it to deploy a PKD and to register the entities of the trust list. |
| [vc-repository](https://github.com/LNetNetworks/vc-repository) | Schemas | Public repository of the JSON schemas of the credential types. |
| [digital-identity-bootstrap](https://github.com/LNetNetworks/digital-identity-bootstrap) | Harness | Scripts that run against the real APIs. They deploy the PKD, register the entities, log in to D-Wallet, issue credentials, deploy the registry and the claims verifier, and give the issuer roles. It is the fastest way to see the full flow without a UI. |

The trust chain connects these components. It is also the primary constraint of each app: a
verifier accepts a credential only if the trust list contains its issuer. The trusted list
manager controls that list.

## The challenge

The apps do not start from a product specification. They start from a challenge: solve one
use case from end to end with the LNet stack, and make one app for each role. The section
[Repository layout](#repository-layout) shows which apps exist now. This is the assignment:

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

There are two phases. In the **setup** phase, the trusted list manager makes the governance
and the trust on-chain. This phase occurs one time. In the **runtime** phase, the apps of this
repository do the flow from issuance to verification.

### Setup — governance and permissions

1. **Deploy the PKD** — `POST /pki/pkd/deploy` on the PKD API. The PKD is the root of the
   governance. The Trusted List Manager (role 1) is its owner. All subsequent addresses depend
   on it.
2. **Register the entities** — `POST /pki/pkd/{pkd}/register` and the `/pki/tl/…` endpoints.
   In this step you admit an organization as a credential issuer (role 2). Each admitted
   entity also receives an identity: a Keycloak user with a D-Wallet. The D-Wallet gives the
   entity a `did:lac:<network>:<address>` for its signatures. You can revoke the admission
   with `DELETE /pki/tl/{tl}/revoke/{entity}`. The revocation invalidates all the credentials
   of that issuer.
3. **Deploy the credential registry** — `POST /registry/credentials/deploy` on SSI-VC. This
   contract keeps the credential proofs and the revocations.
4. **Deploy the claims verifier** — `POST /registry/verifier/deploy`, with a link to that
   registry. A verifier uses this contract to know if a proof is correct.
5. **Give the issuer permissions** — `PUT /registry/verifier/{address}/issuer`. Only an
   address with the `ISSUER_ROLE` can record credentials. Before this step, the issuer is
   admitted but cannot issue.

The scripts in
[digital-identity-bootstrap](https://github.com/LNetNetworks/digital-identity-bootstrap) do
steps 1 to 5. Do the steps in this sequence, because each step uses the address from the
previous step.

**Current condition:** the PKD part (step 1 and the trusted list part of step 2) is on hold.
The flow uses the credential registry and the claims verifier that are already deployed.
Thus the system does not enforce the membership in the trusted list — it assumes it. Today the
`ISSUER_ROLE` of step 5 is the only control on issuance. The three issuer identities and the
verifier exist as Keycloak users, and their D-Wallets are ready.

### Runtime — onboarding, issuance, custody, presentation, verification

6. **Create the wallet of the holder** — the user makes an account in the wallet app. D-Wallet
   makes the identity immediately (`POST /`, `POST /wallet-id`, `POST /wallet-document`). The
   result is the `did:lac:<network>:<address>`. An issuer uses this DID as the subject. This
   step occurs one time for each user, when the user arrives.
7. **Issue the credential** — `POST /vc`. The issuer makes a W3C verifiable credential for a
   subject DID. The credential has a type, a JSON-LD context, an expiry date and its trusted
   list. A schema in `vc-repository` gives its structure. These tests use
   [`test_reference.json`](https://github.com/LNetNetworks/vc-repository/blob/main/schemas/test_reference.json).
   The API records the proof on-chain and sends the credential to the wallet of the holder.
8. **Keep the credential** — `GET /holder/{did}`. The user (role 3) logs in to the wallet and
   finds the credential. `wallet-webapp` and `wallet-flutter-app` are two versions of this
   role.
9. **Present the credential** — the verification portal (role 4) shows a QR code with its
   verification URL (`GET /verifier/verification-url`). The wallet reads the QR code. The
   holder selects a credential. Then the wallet sends the presentation
   (`POST /shareverify/{did}`).
10. **Verify the credential** — `GET /verifier/{did}`. The portal shows the presentations that
    it received. The operator selects one presentation and verifies it. The screen must show
    two different results: **valid**, or **invalid or expired**. The result is valid only if
    all these conditions are true at the same time: the signature is correct, the credential
    registry has the proof and the proof is not revoked, and the trusted list of step 2 still
    contains the issuer.

There is an opposite flow of step 9: the holder reads a QR code to *request* a credential and
sends the DID to an issuer URL, and the issuer sends a new credential. This flow is part of
the design, but **no app implements it**.

## The app for each step

Each step has one app, and each app has one role. Each app is in its own top-level folder.
Each app also has a branch with the same name.

| Step | App | Role | Folder / branch | Condition |
| --- | --- | --- | --- | --- |
| 1–5 | Trusted list backoffice | 1 — Trusted List Manager | `trustlist-webapp/` | To build |
| 7 | Issuer backoffice | 2 — Credential Issuer | `issuer-webapp/` | To build |
| 6, 8, 9 | Holder wallet | 3 — User | `wallet-webapp/`, `wallet-flutter-app/` | Built |
| 9, 10 | Verification portal | 4 — Verifier | `verifier-webapp/` | Built |

The two backoffices do not exist yet. Thus the scripts in `digital-identity-bootstrap` do
steps 1 to 5 and step 7. Those scripts show what the two UIs must do.

### `trustlist-webapp/` — Trusted List Manager backoffice · to build

This app is the governance console. It has more permissions than the other apps. It must have
three screens, in this sequence:

- **PKD deploy** — a one-time operation that shows the new address.
- **Entities** — the list of the entities in the trusted list. The two write operations are
  register and revoke.
- **Permissions** — it deploys the credential registry and the claims verifier, and gives the
  `ISSUER_ROLE` to an admitted entity. After this operation, the organization can issue.

The app uses the PKD API (`/pki/pkd/*`, `/pki/tl/*`) and SSI-VC (`/registry/*`). It is the only
app with an admin private key. Thus all its calls must stay on the server — use server actions
or route handlers, and never send the key to the browser. A revocation invalidates all the
credentials of that issuer. Thus the app must ask for a confirmation.

### `issuer-webapp/` — Credential Issuer backoffice · to build

This app makes the "virtual certificates". It needs:

- A **login** for the issuing organization.
- A **new credential** form. The user selects a type from the schemas in `vc-repository`, and
  writes the data of the subject, the expiry date and the JSON-LD context.
- An **issued credentials** list, with revocation (`DELETE /vc/:id`).

`POST /vc` issues the credential. It records the proof on-chain and sends the credential to
the wallet of the holder. Thus the form needs the DID of the holder, and the UI must show the
on-chain hash as the receipt.

The app uses the D-Wallet login (`POST /login`) with the issuer users in Keycloak. The access
token contains the issuer role. Thus the app does not select the DID of the issuer manually.
The app operates only if step 5 was done for that issuer. If the role is not there, show a
clear error — this message is more important than the other validations. A QR code for a
credential request is part of the design, but no app implements it.

The platform has an issuer front end at `https://dev-identity-app.l-net.io/`. Look at it
before you start. This example is the minimal version of that flow. It must not repeat these
problems: the credential type and the schema are free text, but the backend can fill two
dropdown lists; and the function to get a VC does not operate.

### `wallet-webapp/`, `wallet-flutter-app/` — Holder wallet · built

These two apps have the same role and use the same D-Wallet API. One app is a Vite PWA. The
other app is a Flutter app. Each app has the onboarding that creates the DID of the user, the
credential list (`GET /holder/{did}`), the detail screen, the QR code scanner, and the screen
that selects a credential and sends the presentation (`POST /shareverify/{did}`). You can
install both apps on a telephone, because a QR code scan needs a camera.

### `verifier-webapp/` — Verification portal · built

This app is the screen for the verifier. It logs in, requests its verification URL
(`GET /verifier/verification-url`), shows the URL as a QR code for the wallet, and lists the
presentations that it received (`GET /verifier/{did}`). The result screen does not exist yet:
the operator cannot select a presentation, verify it, and see **valid** or **invalid or
expired**. That screen makes the app a verification portal. A unique presentation code must
give the same result as a QR code.

## Repository layout

Each app is complete in its own top-level directory. There is no workspace or monorepo tool.
Install and start each app from its own directory.

| Directory | Role | Stack |
| --- | --- | --- |
| `verifier-webapp/` | 4 — Verifier | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| `wallet-webapp/` | 3 — User (holder) | Vite + React PWA, TypeScript |
| `wallet-flutter-app/` | 3 — User (holder) | Flutter (web and macOS targets) |

Role 1 (Trusted List Manager) and role 2 (Credential Issuer) do not have an app yet. The
folders `trustlist-webapp/` and `issuer-webapp/` are reserved for them.

## Branches

Each app has one branch with the name of its directory. `main` is the default branch and the
usual PR target. `main` integrates all the apps. Thus it is the only branch with the full
system.

| Branch | App | State |
| --- | --- | --- |
| `main` | All examples, integrated | Default branch, PR target |
| `verifier-webapp` | Verification portal (role 4) | Merged into `main` |
| `wallet-webapp` | Vite PWA wallet (role 3) | Merged into `main` |
| `wallet-flutter-app` | Flutter wallet (role 3) | In sync with `main` |

The two new apps use the same rule: make the branch `trustlist-webapp` or `issuer-webapp`
from `main`, use one folder for each app, and merge into `main` when the app operates.

**Deployment warning:** the production branch of the Vercel project is `wallet-flutter-app`,
not `main`. A push to that branch deploys to production immediately. There is no preview step.
