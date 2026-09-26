# Vite Demo

This example shows how to use `startgg-oauth2-full` inside a Vite application: build PKCE-capable authorize URLs and complete the full authorization-code flow in the page.

## Getting Started

```bash
cd examples/vite
cp .env.example .env   # fill in your Start.gg client ID + secret
npm install
npm run dev
```

The dev server opens at `http://localhost:3000` — the port and the default
redirect URI (`http://localhost:3000/api/auth/startgg/callback`) are chosen to
match the callback registered on the Start.gg app; the SPA history fallback
serves this page again at that path after the redirect.

Provide your Start.gg client ID, submit the form, and open the generated link
**in the same tab** — the PKCE verifier lives in that tab's `sessionStorage`,
which is per-tab. After you approve on Start.gg and are redirected back, the
page exchanges the code and prints a masked token preview.

## The token relay (`/startgg/token`)

Start.gg's token endpoint requires `client_secret` and sends no CORS headers,
so a browser page can never call it directly. The dev server includes a
middleware relay: the page POSTs to `/startgg/token` on its own origin, the
relay adds the secret from `.env` server-side, and forwards the request. The
secret never reaches the browser. (In production, do the exchange on your own
backend instead.)

## Build & Preview

```bash
npm run build
npm run preview
```

`npm run build` produces a production bundle under `dist/`, and `npm run preview` serves it locally for smoke testing. Note that the relay is dev-server-only — a deployed SPA needs a real backend endpoint for the exchange.
