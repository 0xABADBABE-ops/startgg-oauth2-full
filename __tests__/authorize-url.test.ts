import { buildAuthorizeUrl, StartGGScope } from '../src/auth/StartGGOAuth2';

describe('Authorize URL', () => {
  test('includes required params and scopes', async () => {
    const cfg = {
      clientId: 'abc',
      authEndpoint: 'https://example.com/authorize',
      redirectUri: 'https://app/callback',
    };
    const { url, codeVerifier, codeChallenge } = await buildAuthorizeUrl(cfg, {
      scopes: [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL],
      state: 'xyz',
      prompt: 'consent',
      extras: { access_type: 'offline' },
    });

    const u = new URL(url);
    expect(u.searchParams.get('response_type')).toBe('code');
    expect(u.searchParams.get('client_id')).toBe('abc');
    expect(u.searchParams.get('redirect_uri')).toBe('https://app/callback');
    expect(u.searchParams.get('scope')).toContain('user.identity');
    expect(u.searchParams.get('scope')).toContain('user.email');
    expect(u.searchParams.get('state')).toBe('xyz');
    expect(u.searchParams.get('prompt')).toBe('consent');
    expect(u.searchParams.get('access_type')).toBe('offline');
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeChallenge.length).toBeGreaterThan(20);
  });

  test('throws when codeChallenge provided without matching codeVerifier', async () => {
    const cfg = {
      clientId: 'abc',
      authEndpoint: 'https://example.com/authorize',
      redirectUri: 'https://app/callback',
    };
    await expect(
      buildAuthorizeUrl(cfg, {
        scopes: [],
        codeChallenge: 'custom-challenge',
      })
    ).rejects.toThrow(/codeVerifier is required/);
  });

  test('accepts externally provided PKCE pair when consistent', async () => {
    const cfg = {
      clientId: 'abc',
      authEndpoint: 'https://example.com/authorize',
      redirectUri: 'https://app/callback',
    };
    const verifier = 'test-verifier-1234567890_-=.~';
    const expectedChallenge = 'xPCddgBLJpr4TYXpjK5OM51rAX0xrMyIOiVyy18DPQ8';
    const result = await buildAuthorizeUrl(cfg, {
      scopes: [],
      codeVerifier: verifier,
      codeChallenge: expectedChallenge,
    });

    expect(result.codeVerifier).toBe(verifier);
    expect(result.codeChallenge).toBe(expectedChallenge);
  });
});
