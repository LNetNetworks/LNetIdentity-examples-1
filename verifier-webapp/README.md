# verifier-webapp

Verification portal for the LNetIdentity example system — the **Verifier** role (4). It will verify
credentials presented by users, read via QR code or a unique presentation code, checking the issuer
against the trust list. See the [assignment spec](../Readme.md) for the full role model.

Currently a scaffolded Next.js app serving a hello-world page.

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
npm run lint   # eslint
npm start      # serve the production build
```

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4.
