# Node CLI Demo

This example demonstrates how to use the Start.gg OAuth helpers from a plain Node.js environment. It includes two scripts:

- `npm run dev` — prints an authorize URL and is designed for quick, manual testing.
- `npm run oauth-server` — hosts a callback server, opens the authorize URL in your browser, exchanges the code automatically, and logs masked tokens.

## Setup
```bash
cd examples/node
cp .env.example .env # optional
npm install
```

Populate `STARTGG_CLIENT_ID` in `.env` or your shell. Override the endpoints with `STARTGG_AUTH_URL` and `STARTGG_TOKEN_URL` if you target a non-production Start.gg environment. `PORT` controls the callback server for `npm run oauth-server` (default `3000`).

## Manual Flow (`npm run dev`)
1. Run the script to generate an authorize URL.
2. Visit the URL, approve Start.gg, and capture the `code` from the redirected address.
3. Paste the code into the placeholder in `src/index.ts` (or extend the script to prompt for it) to exchange tokens.

## Browser-Assisted Flow (`npm run oauth-server`)
1. Run the script; it starts an HTTP listener on `http://localhost:3000/callback`.
2. Your default browser opens to Start.gg. Complete the OAuth consent.
3. The callback handler exchanges the code using `exchangeToken`, logs masked credentials, and exits the process.

Persist tokens securely when adapting this approach to production services.
