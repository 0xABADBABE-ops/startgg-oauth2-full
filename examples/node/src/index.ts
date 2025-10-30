import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  BearerToken,
  StartGGScope,
  buildAuthorizeUrl,
  createStartGGAuth2Handler,
} from 'startgg-oauth2-full/src/auth/StartGGOAuth2';

async function main() {
  const cfg = {
    clientId: process.env.STARTGG_CLIENT_ID ?? 'YOUR_CLIENT_ID',
    authEndpoint: process.env.STARTGG_AUTH_URL ?? 'https://api.start.gg/oauth/authorize',
    tokenEndpoint: process.env.STARTGG_TOKEN_URL ?? 'https://api.start.gg/oauth/token',
    redirectUri: 'http://localhost:3000/callback',
  };

  const { url, codeVerifier } = await buildAuthorizeUrl(cfg, {
    scopes: [StartGGScope.USER_IDENTITY],
    state: randomUUID(),
  });

  console.log('\nOpen this URL in your browser to authorize:\n');
  console.log(`${url}\n`);

  const rl = createInterface({ input, output });
  const code = (await rl.question('Paste the "code" query parameter once redirected: ')).trim();
  rl.close();

  if (!code) {
    console.error('No code supplied. Exiting.');
    process.exit(1);
  }

  const handler = createStartGGAuth2Handler(cfg);
  const tokenResponse = await handler.exchangeToken(code, codeVerifier, [StartGGScope.USER_IDENTITY]);
  const bearer = BearerToken.fromOAuthResponse(tokenResponse);

  const masked = (t?: string) => (t ? `${t.slice(0, 6)}…${t.slice(-4)}` : undefined);
  console.log('\n✅ Token exchange complete');
  console.log('access_token:', masked(tokenResponse.access_token));
  console.log('refresh_token:', masked(tokenResponse.refresh_token));
  console.log('token_type:', tokenResponse.token_type);
  console.log('expires_in:', tokenResponse.expires_in ?? 'n/a');
  console.log('\nAuthorization header:', bearer.toAuthHeader());
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
