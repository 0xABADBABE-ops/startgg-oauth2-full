import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { URL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import {
  buildAuthorizeUrl,
  createStartGGAuth2Handler,
  StartGGScope,
  BearerToken,
} from 'startgg-oauth2-full/src/auth/StartGGOAuth2';

const PORT = Number(process.env.PORT ?? 3000);
const REDIRECT = `http://localhost:${PORT}/callback`;

const cfg = {
  clientId: process.env.STARTGG_CLIENT_ID ?? 'YOUR_CLIENT_ID',
  authEndpoint: process.env.STARTGG_AUTH_URL ?? 'https://api.start.gg/oauth/authorize',
  tokenEndpoint: process.env.STARTGG_TOKEN_URL ?? 'https://api.start.gg/oauth/token',
  redirectUri: REDIRECT,
};

const REQUIRED_SCOPES = [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL];

function openInBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    else if (platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref();
    else spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
  } catch {
    console.log('Please open this URL manually:\\n', url);
  }
}

async function main() {
  const state = randomUUID();
  const { url: authorizeUrl, codeVerifier } = await buildAuthorizeUrl(
    { clientId: cfg.clientId, authEndpoint: cfg.authEndpoint, redirectUri: cfg.redirectUri },
    { scopes: REQUIRED_SCOPES, state, extras: { access_type: 'offline' } }
  );

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '', `http://localhost:${PORT}`);
      if (reqUrl.pathname !== '/callback') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
      }

      const code = reqUrl.searchParams.get('code');
      const gotState = reqUrl.searchParams.get('state');

      if (!code || !gotState || gotState !== state) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid OAuth callback (missing/invalid code or state).');
        console.error('Invalid callback:', { code, state: gotState });
        server.close();
        process.exitCode = 1;
        return;
      }

      const handler = createStartGGAuth2Handler(cfg);

      try {
        const tokenResponse = await handler.exchangeToken(code, codeVerifier, REQUIRED_SCOPES);
        const bearer = BearerToken.fromOAuthResponse(tokenResponse);
        const masked = (t?: string) => (t ? `${t.slice(0, 6)}…${t.slice(-4)}` : undefined);
        console.log('\\n✅ OAuth2 token exchange successful!\\n');
        console.log('access_token:', masked(tokenResponse.access_token));
        console.log('refresh_token:', masked(tokenResponse.refresh_token));
        console.log('token_type:', tokenResponse.token_type);
        console.log('expires_in:', tokenResponse.expires_in);
        console.log('scope:', tokenResponse.scope ?? '(omitted → unchanged)');
        console.log('\\nAuthorization header:', bearer.toAuthHeader());

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!doctype html>
<title>OAuth Success</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<body style="font-family: system-ui; margin: 2rem;">
  <h1>Success ✅</h1>
  <p>You can close this window and return to the terminal.</p>
</body>`);

        server.close(() => process.exit(0));
      } catch (err) {
        console.error('Token exchange failed:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Token exchange failed</h1><pre>${String(err)}</pre>`);
        server.close(() => process.exit(1));
      }
    } catch (err) {
      console.error('Callback error:', err);
      try {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal error');
      } catch {}
      server.close(() => process.exit(1));
    }
  });

  server.listen(PORT, () => {
    console.log(`\\nListening on http://localhost:${PORT}`);
    console.log('\\nOpening browser for OAuth authorization…');
    console.log('(If this does not open automatically, paste this URL manually.)\\n');
    console.log(authorizeUrl, '\\n');
    openInBrowser(authorizeUrl);
  });
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((e) => {
    console.error('Fatal:', e);
    process.exit(1);
  });
}
