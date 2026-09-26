# Feature Request: Add Start.gg as Managed Connector in Vercel Connect

## What

Add **Start.gg** (start.gg) as a **Vercel Managed Connector** so users can run `vercel connect create startgg` without registering their own OAuth app.

## Why

- Largest tournament platform for fighting games/esports (1M+ users, 500K+ tournaments/year)
- Standard OAuth 2.0 + PKCE (RFC 7636), refresh tokens, `expires_in` — all supported
- Currently requires Custom OAuth (manual Client ID/Secret, redirect URI config)
- Perfect fit alongside GitHub, Linear, Slack, Snowflake managed connectors

## OAuth Details

```
Authorization: https://api.start.gg/oauth/authorize
Token:         https://api.start.gg/oauth/access_token
GraphQL API:   https://api.start.gg/gql/alpha
Scopes:        user.identity, user.email, tournament.manager, tournament.reporter
PKCE:          S256 required
Refresh:       Supported
```

## Service Metadata (for registry)

```json
{
  "service": "startgg",
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

## Branding

- Logo: https://assets.start.gg/logo.svg
- Background: `#1a1a2e`
- Accent: `#f9a825`

## Current Workaround

Users must create Custom OAuth connector with manual credentials. See: https://github.com/0xABADBABE-ops/startgg-oauth2-full/blob/main/VERCEL_CONNECT_STARTGG.md

## References

- Start.gg OAuth Docs: https://start.gg/docs/oauth2
- Existing TS SDK: https://github.com/0xABADBABE-ops/startgg-oauth2-full (5 examples, full PKCE)

## Acceptance

- `vercel connect create startgg` works zero-config
- Branded consent screen
- Tokens work with GraphQL API (`Authorization: Bearer`)
- Auto-refresh via refresh tokens

---

Happy to help test in staging or coordinate with Start.gg team.
