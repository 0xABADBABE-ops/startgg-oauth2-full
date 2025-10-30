import { buildAuthorizeUrl, StartGGScope } from 'startgg-oauth2-full/src/auth/StartGGOAuth2';

const form = document.querySelector<HTMLFormElement>('#auth-form');
const urlOutput = document.querySelector<HTMLPreElement>('#authorize-url');
const verifierOutput = document.querySelector<HTMLPreElement>('#code-verifier');
const challengeOutput = document.querySelector<HTMLPreElement>('#code-challenge');

if (!form || !urlOutput || !verifierOutput || !challengeOutput) {
  throw new Error('Demo markup not found');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(form);
  const clientId = String(data.get('clientId') ?? '');
  const authEndpoint = String(data.get('authEndpoint') ?? '');
  const redirectUri = String(data.get('redirectUri') ?? '');

  try {
    const result = await buildAuthorizeUrl(
      { clientId, authEndpoint, redirectUri },
      {
        scopes: [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL],
        state: crypto.randomUUID(),
        extras: { prompt: 'consent' },
      }
    );

    urlOutput.textContent = result.url;
    verifierOutput.textContent = result.codeVerifier;
    challengeOutput.textContent = result.codeChallenge;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    urlOutput.textContent = `Failed to build URL: ${message}`;
    verifierOutput.textContent = '—';
    challengeOutput.textContent = '—';
  }
});
