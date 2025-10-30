import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { StartGGScope, buildAuthorizeUrl } from 'startgg-oauth2-full/src/auth/StartGGOAuth2';
import { startggConfig } from '../../../../lib/startgg';
import { savePending } from '../../../../lib/pendingStore';

export async function POST() {
  try {
    const state = randomUUID();
    const scopes = [StartGGScope.USER_IDENTITY];

    const { url, codeVerifier } = await buildAuthorizeUrl(startggConfig, {
      scopes,
      state,
      prompt: 'consent',
    });

    savePending(state, { codeVerifier, scopes });

    return NextResponse.json<AuthUrlResponse>({
      url,
    });
  } catch (error) {
    console.error('[nextjs example] Failed to generate authorize URL', error);
    return NextResponse.json(
      {
        error: 'Unable to generate authorize URL. Check server logs for details.',
      },
      { status: 500 }
    );
  }
}

type AuthUrlResponse = {
  url: string;
};
