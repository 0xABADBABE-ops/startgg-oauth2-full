import { createStartGGAuth2Handler, STARTGG_ENDPOINTS } from 'startgg-oauth2-full';

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`[nextjs example] Missing required environment variable: ${name}`);
  }
  return value;
}

export function getStartggConfig() {
  const clientId = readEnv('STARTGG_CLIENT_ID', process.env.NEXT_PUBLIC_STARTGG_CLIENT_ID);
  const authEndpoint = readEnv('STARTGG_AUTH_ENDPOINT', STARTGG_ENDPOINTS.authorize);
  const tokenEndpoint = readEnv('STARTGG_TOKEN_ENDPOINT', STARTGG_ENDPOINTS.token);
  const redirectUri = readEnv('STARTGG_REDIRECT_URI', 'http://localhost:3000/api/startgg/callback');

  return {
    clientId,
    authEndpoint,
    tokenEndpoint,
    redirectUri,
  };
}

export function getStartggHandler() {
  return createStartGGAuth2Handler(getStartggConfig());
}
