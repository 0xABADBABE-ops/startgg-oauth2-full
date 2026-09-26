# Feature Request: Add Start.gg as Managed Connector in Vercel Connect

## Summary

Request to add **Start.gg** (start.gg) as a **Vercel Managed Connector** in Vercel Connect, enabling zero-config OAuth for tournament organizers, developers, and AI agents building on the Start.gg platform.

---

## Why Start.gg?

| Metric        | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Platform**  | Largest tournament management platform for fighting games, esports, and competitive gaming |
| **API**       | GraphQL (GQL) at `https://api.start.gg/gql/alpha`                                          |
| **Auth**      | OAuth 2.0 + PKCE (RFC 7636), refresh tokens supported                                      |
| **Community** | 1M+ users, 500K+ tournaments/year, major FGC/esports events                                |
| **Use Cases** | Tournament automation, bracket bots, player analytics, Discord bots, AI agents             |

---

## OAuth Configuration (Ready for Vercel)

### Endpoints

```
Authorization: https://api.start.gg/oauth/authorize
Token:         https://api.start.gg/oauth/access_token
GraphQL API:   https://api.start.gg/gql/alpha
```

### Scopes

| Scope                 | Description                          | Requires        |
| --------------------- | ------------------------------------ | --------------- |
| `user.identity`       | Read user profile (id, name, avatar) | —               |
| `user.email`          | Read user email                      | `user.identity` |
| `tournament.manager`  | Manage tournaments you own           | `user.identity` |
| `tournament.reporter` | Report scores for tournaments        | `user.identity` |

### Technical Compatibility

| Feature                         | Supported | Notes                                        |
| ------------------------------- | --------- | -------------------------------------------- |
| **PKCE (S256)**                 | ✅ Yes    | Required for public clients                  |
| **Refresh Tokens**              | ✅ Yes    | Returned in token response                   |
| **`expires_in`**                | ✅ Yes    | Returned in token response                   |
| **Discovery Document**          | ❌ No     | Not published (requires manual config today) |
| **Dynamic Client Registration** | ❌ No     | Not supported                                |
| **Token Revocation**            | ❌ No     | Not implemented                              |

---

## Current Workaround (Custom OAuth)

Today, users must create a **Customer Managed Connector**:

```bash
# Manual steps required
vercel connect create https://api.start.gg/oauth/authorize --name startgg
# Prompts for: Client ID, Client Secret, Scopes
vercel connect attach oauth/startgg
```

**Pain points:**

- User must register OAuth app at https://start.gg/developer
- Must copy/paste Client ID & Secret
- Must add `https://connect.vercel.com/callback` as redirect URI
- No logo/branding in consent screen

---

## Proposed: Vercel Managed Connector

With a managed connector, users would simply run:

```bash
# Zero credentials needed!
vercel connect create startgg --name startgg
vercel connect attach oauth/startgg
```

**Vercel would:**

1. Register a Vercel-owned OAuth app with Start.gg
2. Configure redirect URI: `https://connect.vercel.com/callback`
3. Set logo, background color, accent color for branded consent screen
4. Publish service metadata to `/v1/connect/services/startgg?schemas=true`

---

## Service Metadata for Vercel Registry

```json
{
  "name": "Start.gg",
  "service": "startgg",
  "connectionMethods": [
    {
      "connectionMethod": "oauth",
      "label": "OAuth 2.0 (PKCE)",
      "type": { "type": "oauth" },
      "create": { "managed": true, "manual": false },
      "templateFields": [],
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
  "tokenEndpoint": "https://api.start.gg/oauth/access_token",
  "revocationEndpoint": null,
  "userinfoEndpoint": null
}
```

---

## Branding Assets

| Asset                | Value                                         |
| -------------------- | --------------------------------------------- |
| **Name**             | Start.gg                                      |
| **Logo**             | https://assets.start.gg/logo.svg (or provide) |
| **Background Color** | `#1a1a2e` (dark navy)                         |
| **Accent Color**     | `#f9a825` (gold/amber)                        |
| **Website**          | https://start.gg                              |

---

## Comparison with Existing Managed Connectors

| Connector               | Type        | Scopes | PKCE   | Refresh |
| ----------------------- | ----------- | ------ | ------ | ------- |
| GitHub                  | Managed     | 20+    | ✅     | ✅      |
| Linear                  | Managed     | 2      | ✅     | ✅      |
| Slack                   | Managed     | 10+    | ✅     | ✅      |
| **Start.gg (proposed)** | **Managed** | **4**  | **✅** | **✅**  |

Start.gg is simpler than most — only 4 scopes, standard OAuth2 + PKCE, perfect fit.

---

## Community Demand

- **Discord bots** for tournament automation (see: `examples/discordjs` in startgg-oauth2-full)
- **Next.js apps** for tournament management dashboards
- **AI agents** that create brackets, report scores, fetch player data
- **Existing library**: `startgg-oauth2-full` (npm) with 5 examples, full PKCE support

---

## References

- Start.gg OAuth Docs: https://start.gg/docs/oauth2
- Start.gg Developer Console: https://start.gg/developer
- GraphQL Schema: https://api.start.gg/gql/alpha
- Existing TS SDK: https://github.com/0xABADBABE-ops/startgg-oauth2-full
- Vercel Connect Custom OAuth Guide: [VERCEL_CONNECT_STARTGG.md](https://github.com/0xABADBABE-ops/startgg-oauth2-full/blob/main/VERCEL_CONNECT_STARTGG.md)

---

## Acceptance Criteria

- [ ] `vercel connect create startgg` works without `--data` flag
- [ ] Connector shows in dashboard with Start.gg branding
- [ ] Consent screen shows Vercel-branded app (not user's app)
- [ ] Supports `user` subject type (authorization_code + PKCE)
- [ ] Supports `app` subject type (client_credentials) if Start.gg adds support
- [ ] Refresh tokens work automatically
- [ ] Tokens usable against `https://api.start.gg/gql/alpha` with `Authorization: Bearer`
- [ ] Documentation updated at https://vercel.com/docs/connect/browse

---

## Contact

Happy to assist with:

- Testing the managed connector in staging
- Providing GraphQL query examples for AI SDK integration
- Coordinating with Start.gg team if needed (they're developer-friendly)

**GitHub**: @0xABADBABE-ops  
**Repo**: https://github.com/0xABADBABE-ops/startgg-oauth2-full
