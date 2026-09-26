# Next.js OAuth Demo

This example integrates `startgg-oauth2-full` into a Next.js App Router project. It renders a page that generates a Start.gg authorize URL with PKCE, stores the verifier server-side, and exchanges the authorization code in an API route.

## Setup
```bash
cd examples/nextjs
cp .env.example .env.local
# Edit the file with your Start.gg client settings
npm install
```

Required values:
- `STARTGG_CLIENT_ID` – Start.gg OAuth client ID.
- `STARTGG_CLIENT_SECRET` – required by Start.gg's token endpoint (the exchange fails with `Invalid client` without it, even with PKCE). Sent only from the server-side callback route.
- `STARTGG_REDIRECT_URI` – defaults to `http://localhost:3000/api/auth/startgg/callback` (must match the callback registered on your Start.gg app exactly).
- Optional overrides: `STARTGG_AUTH_ENDPOINT`, `STARTGG_TOKEN_ENDPOINT`.
- `NEXT_PUBLIC_STARTGG_CLIENT_ID` mirrors the client ID for client-side display.
- `NEXT_PUBLIC_STARTGG_REDIRECT_URI` mirrors the redirect URI for helpful UI messaging.

## Development
```bash
npm run dev
```

Navigate to `http://localhost:3000`, click **Authorize with Start.gg**, and approve in the Start.gg window. The callback route (`/api/auth/startgg/callback`) exchanges the authorization code with the client secret server-side and displays a masked token preview — full tokens are only ever logged masked.

## Production Build
```bash
npm run build
npm start
```

`npm run build` compiles the app, and `npm start` serves the production bundle. Adapt the in-memory PKCE store to persistent storage before deploying to serverless environments.
