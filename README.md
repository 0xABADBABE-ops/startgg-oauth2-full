<!-- Badges -->

<p align="left">
  <a href="https://github.com/0xabadbabe-ops/startgg-oauth2-full/actions/workflows/ci.yml">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/0xabadbabe-ops/startgg-oauth2-full/ci.yml?branch=main">
  </a>
  <a href="https://www.npmjs.com/package/startgg-oauth2-full">
    <img alt="npm" src="https://img.shields.io/npm/v/startgg-oauth2-full">
  </a>
  <a href="./LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg">
  </a>
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D18.0-brightgreen">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue">
</p>

# StartGG OAuth2 + PKCE Toolkit (TypeScript)

Drop-in utilities for **OAuth 2.0 Authorization Code with PKCE** and **Bearer** usage against Start.gg (or any RFC-compliant OAuth2 provider).

- ✅ RFCs: 6749 (OAuth2), 6750 (Bearer), 7636 (PKCE)
- ✅ PKCE S256, high-entropy verifier
- ✅ `application/x-www-form-urlencoded` token requests
- ✅ Scope-safe validation (assume unchanged when `scope` omitted)
- ✅ Robust error surfaces (JSON/text)
- ✅ Skew-aware expiry helper (`BearerToken`)
- ✅ Cross-env: Browser + Node (WebCrypto + `fetch`)
- ✅ **CI**: Jest + TypeScript build on push/PR

---

Cooked for *you* by 0xabadbabe - using a lot of 💜 and few lines of code.
... with hope tha this would help for any dev struggling with oauth2 start.gg specific.

```fish
startgg-oauth2-full@0.1.0 test
> jest --runInBand pkce

 PASS  __tests__/pkce.test.ts
  PKCE helpers
    ✓ generateCodeVerifier length bounds (4 ms)
    ✓ computeCodeChallengeS256 deterministic (3 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.121 s, estimated 2 s
Ran all test suites matching /pkce/i.
```

## Installation

```bash
npm i startgg-oauth2-full
# or copy src/auth/StartGGOAuth2.ts into your project
```

### GitHub Packages (optional)

This library is also mirrored to GitHub Packages if your environment prefers that registry:

```bash
npm set //npm.pkg.github.com/:_authToken=<GH_TOKEN_WITH_PACKAGES_SCOPE>
npm install @0xabadbabe-ops/startgg-oauth2-full
```

---

## Requirements

- Browser: `window.crypto.subtle`, `window.crypto.getRandomValues`, `fetch`
- Node: **18+** (built-in WebCrypto + `fetch`)

---

## Quick Start

### Browser (PKCE → Exchange)

```ts
import { buildAuthorizeUrl, StartGGScope } from 'startgg-oauth2-full';

const cfg = {
  clientId: '<client-id>',
  authEndpoint: 'https://api.start.gg/oauth/authorize',
  redirectUri: 'https://your.app/callback',
};

const { url, codeVerifier } = await buildAuthorizeUrl(cfg, {
  scopes: [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL],
  state: crypto.randomUUID(),
});

sessionStorage.setItem('pkce:verifier', codeVerifier);
sessionStorage.setItem('oauth:state', '<same-state>');
location.href = url;
```

### Callback (Exchange + Bearer)

```ts
import { createStartGGAuth2Handler, BearerToken, StartGGScope } from 'startgg-oauth2-full';

const params = new URLSearchParams(location.search);
const code = params.get('code')!;
const state = params.get('state')!;
if (state !== sessionStorage.getItem('oauth:state')) throw new Error('State mismatch');

const handler = createStartGGAuth2Handler({
  clientId: '<client-id>',
  redirectUri: 'https://your.app/callback',
  authEndpoint: 'https://api.start.gg/oauth/authorize',
  tokenEndpoint: 'https://api.start.gg/oauth/token',
});

const res = await handler.exchangeToken(code, sessionStorage.getItem('pkce:verifier')!, [
  StartGGScope.USER_IDENTITY,
  StartGGScope.USER_EMAIL,
]);

const bearer = BearerToken.fromOAuthResponse(res);
fetch('https://api.start.gg/your-endpoint', { headers: bearer.toAuthHeader() });
```

---

## Scripts

```bash
npm run build      # tsc build
npm test           # Jest tests (needs ts-node installed)
```

Examples ship as their own workspaces—hop into each folder, install once, then use the local scripts:

- Browser (Vite): `cd examples/browser && npm install && npm run dev`
- Node CLI/server: `cd examples/node && npm install && npm run dev`
- Discord.js bot: `cd examples/discordjs && npm install && npm run dev`
- Next.js app: `cd examples/nextjs && npm install && npm run dev`
- Frontend Vite demo: `cd examples/vite && npm install && npm run dev`

---

## API (summary)

- `generateCodeVerifier(len?: number): string`
- `computeCodeChallengeS256(verifier: string): Promise<string>`
- `buildAuthorizeUrl(cfg, opts): Promise<{ url, codeVerifier, codeChallenge }>`
- `createStartGGAuth2Handler(cfg): StartGGOAuth2Handler`
  - `exchangeToken(code, codeVerifier, expectedScopes)`
  - `refreshToken(refreshToken, originalScopes)`
- `BearerToken`
  - `fromOAuthResponse(res, nowMs?, skewSeconds?)`
  - `isExpired()`, `willExpireWithin()`, `toAuthHeader()`, `assertUsable()`

### Scopes

```ts
enum StartGGScope {
  USER_IDENTITY = 'user.identity',
  USER_EMAIL = 'user.email',
  TOURNAMENT_MANAGER = 'tournament.manager',
  TOURNAMENT_REPORTER = 'tournament.reporter',
}
```

---

## Scope Semantics

- If response **includes** `scope`, it’s validated; missing required → `ScopeValidationError`.
- If response **omits** `scope`, treat as unchanged (RFC 6749).
- Refresh: preserve prior `refresh_token` if omitted by server.

---

## Error Model

```ts
class OAuth2Error extends Error {
  code?: string;     // e.g., TOKEN_EXCHANGE_FAILED
  details?: unknown; // parsed JSON or { raw: string }
}
```

---

## Examples

- Browser (Vite SPA): `examples/browser/`
- Node CLI + redirect catcher: `examples/node/`
- Discord bot (discord.js v14): `examples/discordjs/`
- Next.js (App Router): `examples/nextjs/`
- Frontend Vite scaffold: `examples/vite/`

---

## CI

GitHub Actions runs TypeScript build + Jest on push/PR (Node 18 & 20). See `.github/workflows/ci.yml`.

---

## Repository Tree

```text
startgg-oauth2-full/
├── README.md
├── AGENTS.md
├── LICENSE
├── package.json
├── tsconfig.json
├── jest.config.ts
├── jest.setup.ts
├── .gitignore
├── .npmrc
├── src/
│   └── auth/
│       └── StartGGOAuth2.ts
├── __tests__/
│   ├── authorize-url.test.ts
│   ├── bearer-token.test.ts
│   ├── handler.test.ts
│   └── pkce.test.ts
├── examples/
│   ├── browser/      # Vanilla browser Vite demo
│   ├── node/         # CLI + local redirect server
│   ├── discordjs/    # Discord bot OAuth flow
│   ├── nextjs/       # Next.js App Router example
│   └── vite/         # Minimal Vite SPA scaffold
└── .github/
    ├── ISSUE_TEMPLATE/
    │   ├── bug_report.md
    │   └── feature_request.md
    └── workflows/
        └── ci.yml
```

---

## Security Notes

- Use and verify `state`.
- Keep `code_verifier` private.
- Never log tokens; always HTTPS.

---

## License

**MIT License**
Copyright © 2025 0xABADBABE-ops

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
