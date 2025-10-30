import {
  BearerToken,
  StartGGScope,
  buildAuthorizeUrl,
  createStartGGAuth2Handler,
} from 'startgg-oauth2-full/src/auth/StartGGOAuth2';

const form = document.querySelector<HTMLFormElement>('#config')!;
const outputUrl = document.querySelector<HTMLPreElement>('#output-url')!;
const outputVerifier = document.querySelector<HTMLPreElement>('#output-verifier')!;
const outputChallenge = document.querySelector<HTMLPreElement>('#output-challenge')!;
const callbackStatus = document.querySelector<HTMLParagraphElement>('#callback-status')!;
const tokenPreview = document.querySelector<HTMLPreElement>('#token-preview')!;

let lastVerifier: string | null = null;
let lastConfig: {
  clientId: string;
  authEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
} | null = null;

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(form);

  const cfg = {
    clientId: String(data.get('clientId') ?? ''),
    authEndpoint: String(data.get('authEndpoint') ?? ''),
    tokenEndpoint: String(data.get('tokenEndpoint') ?? ''),
    redirectUri: String(data.get('redirectUri') ?? ''),
  };

  try {
    const { url, codeVerifier, codeChallenge } = await buildAuthorizeUrl(cfg, {
      scopes: [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL],
      state: crypto.randomUUID(),
      prompt: 'consent',
    });

    lastVerifier = codeVerifier;
    lastConfig = cfg;

    sessionStorage.setItem('startgg:lastVerifier', codeVerifier);
    sessionStorage.setItem('startgg:lastConfig', JSON.stringify(cfg));

    outputUrl.textContent = url;
    outputVerifier.textContent = codeVerifier;
    outputChallenge.textContent = codeChallenge;
    callbackStatus.textContent = 'Waiting for authorization code…';
    tokenPreview.textContent = 'Token preview appears here after callback.';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputUrl.textContent = `Failed to generate authorize URL: ${message}`;
    outputVerifier.textContent = '—';
    outputChallenge.textContent = '—';
  }
});

async function handleCallbackIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return;

  if (!lastVerifier || !lastConfig) {
    lastVerifier = sessionStorage.getItem('startgg:lastVerifier');
    const stored = sessionStorage.getItem('startgg:lastConfig');
    lastConfig = stored ? JSON.parse(stored) : null;
  }

  if (!lastVerifier || !lastConfig) {
    callbackStatus.textContent = 'Missing verifier/config in session storage; restart the flow.';
    return;
  }

  try {
    const handler = createStartGGAuth2Handler(lastConfig);
    const tokenResponse = await handler.exchangeToken(code, lastVerifier, [
      StartGGScope.USER_IDENTITY,
      StartGGScope.USER_EMAIL,
    ]);

    const bearer = BearerToken.fromOAuthResponse(tokenResponse);
    callbackStatus.textContent = 'Authorization complete!';
    tokenPreview.textContent = JSON.stringify(
      {
        accessTokenPreview: `${bearer.accessToken.slice(0, 8)}…`,
        expiresIn: tokenResponse.expires_in ?? null,
        scope: tokenResponse.scope ?? null,
        refreshTokenPresent: Boolean(tokenResponse.refresh_token),
      },
      null,
      2
    );
  } catch (error) {
    console.error('[browser example] Token exchange failed', error);
    const message = error instanceof Error ? error.message : String(error);
    callbackStatus.textContent = `Token exchange failed: ${message}`;
  }
}

handleCallbackIfPresent().catch(err => {
  console.error('[browser example] Failed to process callback', err);
});
