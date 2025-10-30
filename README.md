<!-- Badges -->
<p align="left">
  <a href="https://github.com/0xabadbabe-ops/startgg-oauth2-full/actions/workflows/ci.yml">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/0xabadbabe-ops/startgg-oauth2-full/ci.yml?branch=main">
  </a>
  <a href="https://www.npmjs.com/package/startgg-oauth2-pkce">
    <img alt="npm" src="https://img.shields.io/npm/v/startgg-oauth2-pkce">
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

## Installation

```bash
npm i startgg-oauth2-pkce
# or copy src/auth/StartGGOAuth2.ts into your project
```

---

## Requirements
- Browser: `window.crypto.subtle`, `window.crypto.getRandomValues`, `fetch`
- Node: **18+** (built-in WebCrypto + `fetch`)

---

## Quick Start

### Browser (PKCE → Exchange)

```ts
import { buildAuthorizeUrl, StartGGScope } from './src/auth/StartGGOAuth2';

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
import { createStartGGAuth2Handler, BearerToken, StartGGScope } from './src/auth/StartGGOAuth2';

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
npm run dev:browser   # serve examples/browser at http://localhost:5174
npm run dev:node      # Node example (Node 18+)
npm run dev:node:server # Local redirect catcher
npm run build         # tsc build
npm test              # Jest tests
```

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

- Browser: `examples/browser/index.html`
- Node: `examples/node/index.ts`
- Node redirect catcher: `examples/node/server.ts`

---

## CI

GitHub Actions runs TypeScript build + Jest on push/PR (Node 18 & 20). See `.github/workflows/ci.yml`.

---

## Repository Tree

```text
startgg-oauth2-full/
├── README.md
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
│   ├── browser/
│   │   └── index.html
│   └── node/
│       ├── index.ts
│       └── server.ts
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

MIT © 0xabadbabe-ops# startgg-oauth2-full
