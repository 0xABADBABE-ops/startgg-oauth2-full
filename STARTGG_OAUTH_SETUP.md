# Start.gg OAuth Setup

## 1) Create an OAuth app
- In Start.gg developer console, create a **Public** OAuth app (PKCE).
- Copy **Client ID**.

## 2) Register redirect URIs
Add exact matches you will use:
- Browser demo: `http://localhost:5174/index.html` (or the exact URL you open)
- Node catcher: `http://localhost:3000/callback`

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
export STARTGG_AUTH_URL=https://api.start.gg/oauth/authorize
export STARTGG_TOKEN_URL=https://api.start.gg/oauth/token
npm run dev:node:server
```

## 5) Test the flow
1. Ensure `http://localhost:3000/callback` is registered.
2. Run the server script above.
3. Browser opens Start.gg consent.
4. Approve; you’re redirected to `/callback`.
5. Terminal prints masked tokens + `Authorization` header.

## 6) Production notes
- Always HTTPS for redirects.
- Persist and validate `state` (CSRF).
- Keep `code_verifier` private (session/server).
- Never log raw tokens in prod.
- Plan for refresh token storage/rotation.