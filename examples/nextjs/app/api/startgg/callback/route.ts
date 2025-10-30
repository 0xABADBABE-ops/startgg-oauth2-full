import { NextResponse } from 'next/server';
import { BearerToken } from 'startgg-oauth2-full/src/auth/StartGGOAuth2';
import { consumePending } from '../../../../lib/pendingStore';
import { startggHandler } from '../../../../lib/startgg';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    console.warn('[nextjs example] Authorization error from Start.gg', error, errorDescription);
    return NextResponse.json(
      { error, errorDescription: errorDescription ?? null },
      { status: 400 }
    );
  }

  if (!state || !code) {
    return NextResponse.json(
      { error: 'Missing state or code.' },
      { status: 400 }
    );
  }

  const pending = consumePending(state);
  if (!pending) {
    return NextResponse.json(
      { error: 'State has expired or is invalid. Generate a new authorize URL.' },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await startggHandler.exchangeToken(code, pending.codeVerifier, pending.scopes);
    const bearer = BearerToken.fromOAuthResponse(tokenResponse);

    console.log('[nextjs example] Token response', tokenResponse);

    return NextResponse.json({
      message: 'Authorization complete!',
      scope: tokenResponse.scope ?? null,
      expiresIn: tokenResponse.expires_in ?? null,
      accessTokenPreview: `${bearer.accessToken.slice(0, 8)}…`,
    });
  } catch (err) {
    console.error('[nextjs example] Token exchange failed', err);
    return NextResponse.json(
      { error: 'Token exchange failed. Inspect server logs for details.' },
      { status: 500 }
    );
  }
}
