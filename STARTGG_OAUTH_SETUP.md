# Start.gg OAuth Setup

## 1) Create an OAuth app
- In the Start.gg developer console, create an OAuth app.
- Copy the **Client ID** and the **Client Secret** from the app settings page.
- Start.gg registers every app as a confidential client: the token endpoint
  requires `client_secret` even when PKCE is used. An exchange without it
  fails with `Invalid client`.

## 2) Register redirect URIs
Add exact matches for the flows you will use:
- Node catcher (`dev:node:server`): the URI from `STARTGG_REDIRECT_URI`
  (default `http://localhost:3000/callback`).
- Browser / Vite demos: `http://localhost:3000/api/auth/startgg/callback`
  (both dev servers bind port 3000 and answer that path via SPA fallback).
- Next.js demo: `http://localhost:3000/api/auth/startgg/callback`.
- Discord bot: the URI from `STARTGG_REDIRECT_URI` — the Express callback
  binds the port/path parsed from it.

> Redirect URIs must match exactly (scheme/host/port/path).

## 3) Scopes
Common scopes:
- `user.identity`
- `user.email` (requires `user.identity`)
- `tournament.manager`
- `tournament.reporter`

## 4) Environment variables (Node catcher)
```bash
export STARTGG_CLIENT_ID=your_client_id
export STARTGG_CLIENT_SECRET=your_client_secret
export STARTGG_AUTH_ENDPOINT=https://api.start.gg/oauth/authorize
export STARTGG_TOKEN_ENDPOINT=https://api.start.gg/oauth/access_token
npm run dev:node:server
```

## 5) Test the flow
1. Ensure your exact redirect URI is registered on the app.
2. Run the server script.
3. A browser opens the Start.gg consent page. If the authorize URL redirects
   to `api.start.gg/login` and shows "Not found", open the printed URL with
   the `start.gg` host instead — the parameters are identical.
4. Approve; Start.gg redirects back to the local callback.
5. The terminal prints masked tokens and a masked `Authorization` header
   shape; full tokens are never logged.

## 6) Production notes
- Always HTTPS for redirects.
- Persist and validate `state` (CSRF).
- Keep `code_verifier` private (session/server).
- Send `client_secret` only from server-side code; never ship it to a browser.
- Never log raw tokens in prod.
- Plan for refresh token storage/rotation.
