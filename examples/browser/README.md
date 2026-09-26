# Browser Demo

This example runs the Start.gg OAuth helpers in a plain browser application with no framework. Vite serves a single page that builds PKCE authorize URLs, displays the verifier/challenge pair, and exchanges the authorization code after Start.gg redirects back.

## Getting Started
```bash
cd examples/browser
cp .env.example .env   # fill in your Start.gg client ID + secret
npm install
npm run dev
```

The dev server opens at `http://localhost:3000` — the port and the default
redirect URI (`http://localhost:3000/api/auth/startgg/callback`) are chosen to
match the callback registered on the Start.gg app; the SPA history fallback
serves this page again at that path after the redirect.

Fill in your Start.gg client ID and click **Generate Authorize URL**. Open the
generated link **in the same tab** — the PKCE verifier lives in that tab's
`sessionStorage`, which is per-tab. After you approve on Start.gg and are
redirected back, the page exchanges the code and prints a masked token preview.

## The token relay (`/startgg/token`)

Start.gg's token endpoint requires `client_secret` and sends no CORS headers,
so a browser page can never call it directly. The dev server includes a
middleware relay: the page POSTs to `/startgg/token` on its own origin, the
relay adds the secret from `.env` server-side, and forwards the request. The
secret never reaches the browser. (In production, do the exchange on your own
backend instead.)

## Production Build
```bash
npm run build
npm run preview
```

`npm run build` writes static assets to `dist/`, and `npm run preview` serves them locally. Note that the relay is dev-server-only — a deployed SPA needs a real backend endpoint for the exchange.
