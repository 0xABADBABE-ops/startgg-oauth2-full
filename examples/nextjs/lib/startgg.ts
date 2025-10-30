import { createStartGGAuth2Handler } from 'startgg-oauth2-full/src/auth/StartGGOAuth2';

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`[nextjs example] Missing required environment variable: ${name}`);
  }
  return value;
}

const clientId = readEnv('STARTGG_CLIENT_ID', process.env.NEXT_PUBLIC_STARTGG_CLIENT_ID);
const authEndpoint = readEnv('STARTGG_AUTH_ENDPOINT', 'https://api.start.gg/oauth/authorize');
const tokenEndpoint = readEnv('STARTGG_TOKEN_ENDPOINT', 'https://api.start.gg/oauth/token');
const redirectUri = readEnv('STARTGG_REDIRECT_URI', 'http://localhost:3000/api/startgg/callback');

export const startggConfig = {
  clientId,
  authEndpoint,
  tokenEndpoint,
  redirectUri,
};

export const startggHandler = createStartGGAuth2Handler({
  clientId,
  authEndpoint,
  tokenEndpoint,
  redirectUri,
});
