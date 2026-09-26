# Feature Request: Add Start.gg as Managed Connector in Vercel Connect

## TL;DR

Request to add **Start.gg** (start.gg) as a **Vercel Managed Connector** so developers can run `vercel connect create startgg` without registering their own OAuth app or managing credentials.

---

## What is Start.gg?

|              |                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Platform** | Largest tournament management platform for fighting games, esports, and competitive gaming |
| **Users**    | 1M+ registered, 500K+ tournaments/year                                                     |
| **API**      | GraphQL at `https://api.start.gg/gql/alpha`                                                |
| **Auth**     | OAuth 2.0 + PKCE (RFC 7636), refresh tokens, `expires_in`                                  |
| **Docs**     | https://start.gg/docs/oauth2                                                               |

---

## Why This Fits Vercel Connect

### ✅ Technical Compatibility (All Green)

| Feature                      | Supported | Notes                                           |
| ---------------------------- | --------- | ----------------------------------------------- |
| **PKCE (S256)**              | ✅        | Required for public clients                     |
| **Refresh Tokens**           | ✅        | Returned in token response                      |
| **`expires_in`**             | ✅        | Returned in token response                      |
| **Authorization Code Grant** | ✅        | Standard RFC 6749                               |
| **Client Credentials Grant** | ⚠️        | Not yet, but extensible                         |
| **Token Revocation**         | ❌        | Not implemented (ok - same as Linear at launch) |

### ✅ Simpler Than Most Managed Connectors

| Connector               | Scopes | Complexity                        |
| ----------------------- | ------ | --------------------------------- |
| GitHub                  | 20+    | High (installations, orgs, repos) |
| Slack                   | 10+    | High (workspaces, bot/users)      |
| Linear                  | 2      | Low                               |
| **Start.gg (proposed)** | **4**  | **Low**                           |

Only 4 scopes, standard OAuth2 + PKCE, no multi-tenancy complexity.

---

## Current Pain: Custom OAuth Required

Today users must:

```bash
# 1. Create OAuth app at https://start.gg/developer
# 2. Add redirect: https://connect.vercel.com/callback
# 3. Copy Client ID & Secret
# 4. Create connector manually
vercel connect create https://api.start.gg/oauth/authorize --name startgg
# 5. Enter credentials when prompted
# 6. Attach
vercel connect attach oauth/startgg
```

**Pain points:**

- Manual credential management
- No branded consent screen (shows user's app, not Vercel)
- Error-prone redirect URI configuration
- No logo/branding in Vercel dashboard

---

## Desired: Managed Connector

```bash
# One command, zero credentials
vercel connect create startgg --name startgg
vercel connect attach oauth/startgg
```

**Vercel would:**

1. Register a Vercel-owned OAuth app with Start.gg
2. Configure redirect URI: `https://connect.vercel.com/callback`
3. Set branding (logo, colors) for consent screen
4. Publish to service registry at `/v1/connect/services/startgg?schemas=true`

---

## OAuth Details for Registry

```json
{
  "service": "startgg",
  "name": "Start.gg",
  "connectionMethods": [
    {
      "connectionMethod": "oauth",
      "label": "OAuth 2.0 (PKCE)",
      "type": { "type": "oauth" },
      "create": { "managed": true, "manual": false },
      "targets": ["api"],
      "docUrl": "https://start.gg/docs/oauth2",
      "settingsUrl": "https://start.gg/developer"
    }
  ],
  "targets": [{ "target": "api", "label": "Start.gg GraphQL API" }],
  "scopes": [
    "user.identity",
    "user.email",
    "tournament.manager",
    "tournament.reporter"
  ],
  "grantTypes": ["authorization_code", "refresh_token"],
  "codeChallengeMethods": ["S256"],
  "tokenEndpointAuthMethods": ["client_secret_post"],
  "authorizationEndpoint": "https://api.start.gg/oauth/authorize",
  "tokenEndpoint": "https://api.start.gg/oauth/access_token"
}
```

**Branding:**

- Logo: https://assets.start.gg/logo.svg
- Background: `#1a1a2e` (dark navy)
- Accent: `#f9a825` (gold/amber)

---

## Use Cases Enabled

### 1. Tournament Automation Bots

```ts
// Discord bot creates brackets, reports scores
const token = await getToken("oauth/startgg", {
  subject: { type: "app" },
  scopes: ["tournament.manager"],
});
await fetch("https://api.start.gg/gql/alpha", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ query: "mutation { createTournament(...) }" }),
});
```

### 2. AI Agents (Vercel AI SDK)

```ts
import { createVercelConnectTools } from "@vercel/connect/ai-sdk";

const { tools } = createVercelConnectTools({
  connectors: ["oauth/startgg"],
  subject: { type: "user", id: "user_123" },
});

// Agent can: create tournaments, fetch brackets, report scores
```

### 3. Next.js Dashboard Apps

```ts
// Server action gets user's tournaments
const token = await getTokenResponse("oauth/startgg", {
  subject: { type: "user", id: userId },
  scopes: ["user.identity", "tournament.manager"],
});
```

---

## Existing Ecosystem

| Resource                 | Link                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **TypeScript SDK**       | https://github.com/0xABADBABE-ops/startgg-oauth2-full                                                                  |
| **NPM Package**          | `startgg-oauth2-full` (5 examples: Node, Next.js, Discord.js, Vite, Browser)                                           |
| **Vercel Connect Guide** | [VERCEL_CONNECT_STARTGG.md](https://github.com/0xABADBABE-ops/startgg-oauth2-full/blob/main/VERCEL_CONNECT_STARTGG.md) |
| **Helper Package**       | `startgg-vercel-connect` (typed config, scope helpers)                                                                 |

All examples work **today** with Custom OAuth. A managed connector removes the friction.

---

## Community Demand

- **FGC/Esports developers** building tournament tools
- **Discord bot authors** (hundreds of Start.gg bots exist)
- **AI agent builders** wanting to automate bracket operations
- **Next.js developers** building tournament management UIs

---

## Acceptance Criteria

- [ ] `vercel connect create startgg` works without `--data` flag
- [ ] Connector appears in dashboard with Start.gg branding
- [ ] Consent screen shows Vercel-branded app
- [ ] Supports `user` subject (authorization_code + PKCE)
- [ ] Supports `app` subject (client_credentials) when available
- [ ] Refresh tokens work automatically
- [ ] Tokens usable against `https://api.start.gg/gql/alpha` with `Authorization: Bearer`
- [ ] Documented at https://vercel.com/docs/connect/browse

---

## Happy to Help

- ✅ Test managed connector in staging
- ✅ Provide GraphQL query/mutation examples for AI SDK integration
- ✅ Coordinate with Start.gg team (they're developer-friendly)
- ✅ Contribute example apps to Vercel templates

**GitHub**: @0xABADBABE-ops  
**Repo**: https://github.com/0xABADBABE-ops/startgg-oauth2-full  
**Contact**: Open to DM or tag in this thread

---

## Attachments

- `VERCEL_CONNECT_STARTGG.md` — Complete setup guide for Custom OAuth (current workaround)
- `VERCEL_CONNECT_FR_STARTGG.md` — This feature request (detailed)
- `packages/startgg-vercel-connect/` — Ready-to-publish helper package

---

**Vote 👍 if you'd use a Start.gg managed connector!**
