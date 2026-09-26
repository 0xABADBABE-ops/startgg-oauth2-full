# Start.gg Vercel Connect Connector Guide

This guide shows how to connect **Start.gg** to **Vercel Connect** using a **Custom OAuth** connector.

## Prerequisites

- Vercel account with Vercel Connect enabled
- Start.gg OAuth app (create at [Start.gg Developer Console](https://start.gg/developer))
- Node.js 18+

---

## Step 1: Create Start.gg OAuth App

1. Go to [Start.gg Developer Console](https://start.gg/developer)
2. Create a **Public** OAuth app (PKCE required)
3. **Redirect URI**: `https://connect.vercel.com/callback`
4. **Scopes**: Select what you need:
   - `user.identity` (required)
   - `user.email` (requires `user.identity`)
   - `tournament.manager`
   - `tournament.reporter`
5. Save and copy **Client ID** and **Client Secret**

> **Important**: Vercel Connect's callback URL is fixed: `https://connect.vercel.com/callback`
> This must be added as an exact match in your Start.gg OAuth app settings.

---

## Step 2: Create Custom OAuth Connector

### Option A: Via Vercel Dashboard

1. Open [Vercel Connect Dashboard](https://vercel.com/d?to=%2F%5Bteam%5D%2Fconnect)
2. Click **Create Connector**
3. Choose **OAuth** → **Custom** (not Managed)
4. Enter:
   - **Authorization URL**: `https://api.start.gg/oauth/authorize`
   - **Token URL**: `https://api.start.gg/oauth/access_token`
   - **Client ID**: Your Start.gg Client ID
   - **Client Secret**: Your Start.gg Client Secret
   - **Scopes**: `user.identity user.email tournament.manager tournament.reporter`
5. Name: `startgg`
6. Save

### Option B: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Create connector interactively
vercel connect create https://api.start.gg/oauth/authorize --name startgg
```

The CLI will prompt for:
- Connection method: **Custom OAuth**
- Client ID: (your Start.gg Client ID)
- Client Secret: (your Start.gg Client Secret)
- Scopes: `user.identity user.email tournament.manager tournament.reporter`
- Token endpoint: `https://api.start.gg/oauth/access_token`

---

## Step 3: Attach to Project

```bash
# Link your local directory to a Vercel project
vercel link

# Pull OIDC token for local development
vercel env pull

# Attach connector to project (links Production, Preview, Development)
vercel connect attach oauth/startgg
```

---

## Step 4: Use in Your Code

### Install SDK

```bash
npm install @vercel/connect dotenv
```

### Get User Token (Act as Signed-in User)

```ts
// get-startgg-token.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  getTokenResponse,
  UserAuthorizationRequiredError,
  startAuthorization,
} from '@vercel/connect';

const USER_ID = 'user_123'; // Your app's user ID

async function main() {
  try {
    const response = await getTokenResponse('oauth/startgg', {
      subject: { type: 'user', id: USER_ID },
      scopes: ['user.identity', 'user.email'],
    });

    console.log('✅ Got Start.gg token!');
    console.log('Access Token:', response.token.slice(0, 20) + '...');
    console.log('Expires:', new Date(response.expiresAt).toISOString());
    console.log('Scopes:', response.scopes);
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) {
      console.log('🔐 User needs to authorize Start.gg first');
      const { url } = await startAuthorization('oauth/startgg', {
        subject: { type: 'user', id: USER_ID },
        scopes: ['user.identity', 'user.email'],
      });
      console.log('Redirect user to:', url);
      return;
    }
    throw error;
  }
}

main().catch(console.error);
```

### Get App Token (Service-to-Service)

```ts
// get-startgg-app-token.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { getToken } from '@vercel/connect';

async function main() {
  // App token acts as your service, not a specific user
  const token = await getToken('oauth/startgg', {
    subject: { type: 'app' },
    scopes: ['tournament.manager'],
  });

  console.log('🤖 App token:', token.slice(0, 20) + '...');

  // Use with Start.gg GraphQL API
  const response = await fetch('https://api.start.gg/gql/alpha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `query { viewer { id name } }`,
    }),
  });

  const data = await response.json();
  console.log('GraphQL result:', data);
}

main().catch(console.error);
```

---

## Step 5: Run & Test

```bash
# Run locally (uses VERCEL_OIDC_TOKEN from .env.local)
npx tsx get-startgg-token.ts
```

First run will show consent URL. Open it in browser, authorize, then re-run.

---

## Complete Connector Configuration

### For Manual Setup (JSON)

```json
{
  "name": "startgg",
  "type": "oauth",
  "managed": false,
  "config": {
    "authorizationUrl": "https://api.start.gg/oauth/authorize",
    "tokenUrl": "https://api.start.gg/oauth/access_token",
    "scopes": [
      "user.identity",
      "user.email",
      "tournament.manager",
      "tournament.reporter"
    ],
    "pkce": true,
    "tokenEndpointAuthMethod": "client_secret_post"
  }
}
```

### Vercel Connect Discovery Compatibility

Start.gg **does not** publish OAuth discovery documents (RFC 8414). This is why you must use **Custom OAuth** and manually configure endpoints.

| Requirement | Start.gg Status |
|-------------|-----------------|
| Discovery document (`.well-known/oauth-authorization-server`) | ❌ Not published |
| Dynamic Client Registration (DCR) | ❌ Not supported |
| PKCE (S256) | ✅ Supported |
| Refresh tokens | ✅ Supported |
| `expires_in` in token response | ✅ Returned |

---

## Scopes Reference

| Scope | Description | Requires |
|-------|-------------|----------|
| `user.identity` | Read user profile (id, name, avatar) | — |
| `user.email` | Read user email | `user.identity` |
| `tournament.manager` | Manage tournaments you own | `user.identity` |
| `tournament.reporter` | Report scores for tournaments | `user.identity` |

---

## Using with AI SDK / Vercel AI Gateway

```ts
import { createVercelConnectTools } from '@vercel/connect/ai-sdk';
import { streamText } from 'ai';

const { tools, toolSchemas } = createVercelConnectTools({
  connectors: ['oauth/startgg'],
  subject: { type: 'user', id: 'current-user-id' },
});

const result = await streamText({
  model: 'gpt-4',
  tools,
  prompt: 'Create a tournament on Start.gg called "My Tournament"',
});
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `UserAuthorizationRequiredError` | User hasn't authorized. Call `startAuthorization()` and redirect. |
| `ConnectorNotFoundError` | Connector name mismatch. Check `vercel connect list`. |
| `TokenExchangeFailed` | Invalid client secret or redirect URI mismatch. Verify Start.gg app settings. |
| `ScopeNotGrantedError` | Requested scope not in connector config or not granted by user. |

---

## Rate Limits & Pricing

- **Hobby**: 500 token requests/month free
- **Pro**: $3.00 per 1,000 token requests
- **Enterprise**: Negotiated rate

Token requests are cached in-process; only cache misses hit Vercel Connect.

---

## Security Notes

- ✅ Never store tokens in env vars — call `getToken()` at request time
- ✅ SDK caches & auto-refreshes tokens
- ✅ `VERCEL_OIDC_TOKEN` rotates automatically on Vercel
- ✅ Client secret stored encrypted in Vercel Connect
- ✅ PKCE enforced for user flows

---

## Next Steps

- [Vercel Connect Concepts](https://vercel.com/docs/connect/concepts)
- [SDK Reference](https://vercel.com/docs/connect/ts-sdk-reference)
- [CLI Reference](https://vercel.com/docs/cli/connect)
- [Pricing](https://vercel.com/docs/connect/pricing)