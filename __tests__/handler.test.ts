import {
  createStartGGAuth2Handler,
  StartGGScope,
  OAuth2Error,
} from '../src/auth/StartGGOAuth2';

describe('StartGGOAuth2Handler', () => {
  const cfg = {
    clientId: 'client',
    redirectUri: 'https://app/callback',
    authEndpoint: 'https://example.com/authorize',
    tokenEndpoint: 'https://example.com/token',
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('exchangeToken success with scope present', async () => {
    const mockBody = {
      access_token: 'at',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'user.identity user.email',
      refresh_token: 'rt',
    };
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce(
      new Response(JSON.stringify(mockBody), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const handler = createStartGGAuth2Handler(cfg);
    const res = await handler.exchangeToken('code', 'verifier', [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL]);
    expect(res.access_token).toBe('at');
    expect(res.refresh_token).toBe('rt');
  });

  test('exchangeToken accepts missing scope (assume unchanged)', async () => {
    const mockBody = {
      access_token: 'at',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'rt',
    };
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce(
      new Response(JSON.stringify(mockBody), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const handler = createStartGGAuth2Handler(cfg);
    const res = await handler.exchangeToken('code', 'verifier', [StartGGScope.USER_IDENTITY]);
    expect(res.access_token).toBe('at');
  });

  test('exchangeToken fails when token_type not Bearer', async () => {
    const mockBody = {
      access_token: 'at',
      token_type: 'MAC',
      expires_in: 3600,
      scope: 'user.identity',
    };
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce(
      new Response(JSON.stringify(mockBody), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const handler = createStartGGAuth2Handler(cfg);
    await expect(handler.exchangeToken('code', 'verifier', [StartGGScope.USER_IDENTITY]))
      .rejects.toThrow(OAuth2Error);
  });

  test('refreshToken preserves previous refresh_token when omitted', async () => {
    const mockBody = {
      access_token: 'at2',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'user.identity',
    };
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce(
      new Response(JSON.stringify(mockBody), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const handler = createStartGGAuth2Handler(cfg);
    const res = await handler.refreshToken('rt-old', [StartGGScope.USER_IDENTITY]);
    expect(res.refresh_token).toBe('rt-old');
  });

  test('refreshToken throws when scope reduced', async () => {
    const mockBody = {
      access_token: 'at3',
      token_type: 'Bearer',
      scope: 'user.identity',
    };
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce(
      new Response(JSON.stringify(mockBody), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const handler = createStartGGAuth2Handler(cfg);
    await expect(
      handler.refreshToken('rt', [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL])
    ).rejects.toThrow('Missing required scopes: user.email');
  });

  test('handles non-JSON error body safely', async () => {
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce(
      // @ts-ignore
      new Response('<html>bad request</html>', { status: 400, headers: { 'Content-Type': 'text/html' } })
    );

    const handler = createStartGGAuth2Handler(cfg);
    await expect(handler.exchangeToken('code', 'verifier', [StartGGScope.USER_IDENTITY]))
      .rejects.toThrow('Token exchange failed');
  });
});