Example Challenge Assignment:

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
