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
- `STARTGG_CLIENT_ID` – Start.gg OAuth client ID (public).
- `STARTGG_REDIRECT_URI` – defaults to `http://localhost:3000/api/startgg/callback`.
- Optional overrides: `STARTGG_AUTH_ENDPOINT`, `STARTGG_TOKEN_ENDPOINT`.
- `NEXT_PUBLIC_STARTGG_CLIENT_ID` mirrors the client ID for client-side display.
- `NEXT_PUBLIC_STARTGG_REDIRECT_URI` mirrors the redirect URI for helpful UI messaging.

## Development
```bash
npm run dev
```

Navigate to `http://localhost:3000`, click **Authorize with Start.gg**, and approve in the Start.gg window. The callback route exchanges the authorization code and displays the token payload for demo purposes.

## Production Build
```bash
npm run build
npm start
```

`npm run build` compiles the app, and `npm start` serves the production bundle. Adapt the in-memory PKCE store to persistent storage before deploying to serverless environments.
