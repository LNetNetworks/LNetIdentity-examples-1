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

## The LNet identity stack

The pieces the examples sit on top of. Most live in the `LNetNetworks` organization and are
internal, so some links may not resolve without access.

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

## Example Challenge Assignment

Given the following roles:

- 1 - Trusted List Manager
- 2 - Credential Issuer
- 3 - User
- 4 - Verifier

Create a decentralized identity system that allows a higher-level entity to manage the governance of a trust list, adding sub-entities that fulfill the role of credential issuers. 

These issuers will be able to generate credentials in the form of "virtual certificates," which users will receive in their wallets. 

These users will also be able to present the credentials on a verification portal that supports the reading of a QR code or a unique presentation code.

## Repository layout

Each example is a self-contained app in its own top-level directory. There is no
workspace or monorepo tooling tying them together — install and run each one from its
own directory.

| Directory | Role | Stack |
| --- | --- | --- |
| `verifier-webapp/` | 4 — Verifier | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| `wallet-webapp/` | 3 — User (holder) | Vite + React PWA, TypeScript |
| `wallet-flutter-app/` | 3 — User (holder) | Flutter (web and macOS targets) |

Roles 1 (Trusted List Manager) and 2 (Credential Issuer) have no example app yet.

## Branches

One branch per example, named exactly after its directory. `main` is the default branch
and the usual PR target; it integrates every example, so it is the only branch where the
full system is present at once.

| Branch | Contents | State |
| --- | --- | --- |
| `main` | All examples, integrated | Default branch, PR target |
| `verifier-webapp` | Verifier portal only | Merged into `main` |
| `wallet-webapp` | Vite PWA wallet only | Merged into `main` |
| `wallet-flutter-app` | Flutter wallet only | Ahead of `main` (web build config and PWA install button) |

Each feature branch keeps only the directory it is named after, plus `Readme.md`,
`LICENSE`, and `CLAUDE.md`; the merge into `main` is what brings the examples together.

**Deployment caveat:** `wallet-flutter-app` is the *production* branch of its Vercel
project, not `main`. Pushing to it deploys straight to production, with no preview step
in between.
