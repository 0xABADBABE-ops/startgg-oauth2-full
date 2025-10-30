# Vite Demo

This example shows how to use `startgg-oauth2-full` inside a Vite application to build PKCE-capable authorize URLs.

## Getting Started

```bash
cd examples/vite
npm install
npm run dev
```

The dev server opens on `http://localhost:5174`. Provide your Start.gg OAuth client credentials, submit the form, and copy the generated authorize URL into your browser. The console prints the matching `code_verifier` and `code_challenge` for use during the token exchange.

## Build & Preview

```bash
npm run build
npm run preview
```

`npm run build` produces a production bundle under `dist/`, and `npm run preview` serves it locally for smoke testing.
