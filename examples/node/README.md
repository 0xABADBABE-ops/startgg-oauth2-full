# Node CLI Demo

This example demonstrates how to use the Start.gg OAuth helpers from a plain Node.js environment. It includes two scripts:

- `npm run dev` — prints an authorize URL, prompts for the `code` on stdin, then exchanges it for tokens. Best for quick, manual testing.
- `npm run oauth-server` — hosts a callback server, opens the authorize URL in your browser, exchanges the code automatically, and logs masked tokens.

## Setup

The library dependency resolves to the build output at the repository root (`file:../..` → `dist/`), so build it first:

```bash
npm install          # repository root
npm run build        # repository root — required before installing this example
cd examples/node
npm install
cp .env.example .env
```

Set `STARTGG_CLIENT_ID` and `STARTGG_CLIENT_SECRET` in `.env` (loaded automatically at startup via `dotenv`) or export them in your shell. Override the endpoints with `STARTGG_AUTH_ENDPOINT` and `STARTGG_TOKEN_ENDPOINT` if you target a non-production Start.gg environment.

Both scripts print the `redirect_uri` they will send. **That exact value must be registered on your Start.gg OAuth app.** Start.gg's token endpoint requires the client secret even with PKCE; the library stays spec-pure and the example code sends `client_secret` from server-side code only.

- `npm run dev` uses `http://localhost:3000/callback` (nothing actually listens there; you copy the code by hand, but the URI must still be registered).
- `npm run oauth-server` derives the URI from `PORT` (default `3000`), so changing `PORT` means registering `http://localhost:${PORT}/callback` too — or set `STARTGG_REDIRECT_URI` explicitly.

## Manual Flow (`npm run dev`)

Runnable from the repository root as `npm run dev:node`.

1. Run the script to generate an authorize URL.
2. Visit the URL, approve Start.gg, and capture the `code` query parameter from the redirected address.
3. Paste the code at the prompt — the script exchanges it and prints the masked tokens plus a masked `Authorization` header shape.

## Browser-Assisted Flow (`npm run oauth-server`)

Runnable from the repository root as `npm run dev:node:server`.

1. Run the script; it starts an HTTP listener at your redirect URI's path (default `http://localhost:3000/callback`; set `STARTGG_REDIRECT_URI` to your registered callback, e.g. `http://localhost:3000/api/auth/startgg/callback`).
2. Your default browser opens to Start.gg. Complete the OAuth consent.
3. The callback handler validates `state`, exchanges the code with the client secret added server-side (`exchangeTokenWithSecret` in `src/exchange.ts`), logs masked credentials, and exits the process.

## Troubleshooting

### Start.gg shows `Invalid client`

The authorize or token endpoint returns this when `client_id`, `redirect_uri`, or the client secret does not match a registered app:

1. `STARTGG_CLIENT_ID` is missing or still the `.env.example` placeholder. The scripts detect this and exit before contacting Start.gg — if you see the remote error instead, the ID is being sent but is not valid.
2. You copied the wrong identifier. The developer console shows a numeric **app ID** alongside the OAuth **Client ID** — only the latter belongs in `STARTGG_CLIENT_ID`. A short or numeric value is warned about at startup.
3. `STARTGG_CLIENT_SECRET` is missing or wrong. The token endpoint rejects secretless exchanges with `Invalid client` even when PKCE and the redirect URI are correct.
4. `redirect_uri` is not registered exactly. Compare the `redirect_uri` line printed at startup against your app settings — scheme, host, port, and path must all match.

### `Invalid OAuth callback (missing/invalid code or state)`

The `state` returned by Start.gg did not match the one sent, or the callback had no `code`. Start the flow over rather than reusing an old redirect URL.

Persist tokens securely when adapting this approach to production services.

