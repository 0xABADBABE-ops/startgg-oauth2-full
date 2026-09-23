# startgg-vercel-connect

Type-safe configuration and helpers for using **Start.gg** with **Vercel Connect**.

## Installation

```bash
npm install startgg-vercel-connect @vercel/connect
```

## Quick Start

```ts
import {
  getConnectorUid,
  getLoginScopes,
  createTokenParams,
  STARTGG_VERCEL_CONNECT_CONFIG,
} from 'startgg-vercel-connect';
import { getTokenResponse, UserAuthorizationRequiredError, startAuthorization } from '@vercel/connect';

const USER_ID = 'user_123';

async function getStartggToken() {
  try {
    // Type-safe token request
    const response = await getTokenResponse(
      getConnectorUid(),
      createTokenParams({
        subject: { type: 'user', id: USER_ID },
        scopes: getLoginScopes(true), // ['user.identity', 'user.email']
      })
    );

    return response.token;
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) {
      // User needs to authorize first
      const { url } = await startAuthorization(
        getConnectorUid(),
        createAuthParams({
          subject: { type: 'user', id: USER_ID },
          scopes: getLoginScopes(true),
        })
      );
      // Redirect user to `url`
      throw new Error(`Authorization required: ${url}`);
    }
    throw error;
  }
}
```

## Available Helpers

| Helper | Description |
|--------|-------------|
| `getConnectorUid()` | Returns `'oauth/startgg'` for SDK calls |
| `getLoginScopes(includeEmail?)` | Returns `['user.identity']` or `['user.identity', 'user.email']` |
| `getTournamentScopes()` | Returns scopes for tournament management |
| `getReporterScopes()` | Returns scopes for tournament reporting |
| `createTokenParams()` | Type-safe params for `getToken`/`getTokenResponse` |
| `createAuthParams()` | Type-safe params for `startAuthorization` |
| `isValidStartGGScope()` | Validates scope string |
| `STARTGG_VERCEL_CONNECT_CONFIG` | Full config object with endpoints, scopes, etc. |

## Vercel Connect Setup

See [VERCEL_CONNECT_STARTGG.md](../VERCEL_CONNECT_STARTGG.md) for complete setup instructions:

1. Create Start.gg OAuth app with redirect URI `https://connect.vercel.com/callback`
2. Create Custom OAuth connector in Vercel Connect
3. Attach to your Vercel project
4. Use the SDK to request tokens

## Connector Configuration

The package exports `vercelConnectorConfig` for programmatic connector creation:

```ts
import { vercelConnectorConfig } from 'startgg-vercel-connect';
// Use with Vercel CLI or API
```

## Scopes Reference

```ts
STARTGG_VERCEL_CONNECT_CONFIG.scopes.USER_IDENTITY      // 'user.identity'
STARTGG_VERCEL_CONNECT_CONFIG.scopes.USER_EMAIL         // 'user.email'
STARTGG_VERCEL_CONNECT_CONFIG.scopes.TOURNAMENT_MANAGER // 'tournament.manager'
STARTGG_VERCEL_CONNECT_CONFIG.scopes.TOURNAMENT_REPORTER // 'tournament.reporter'
```

## License

MIT