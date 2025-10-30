import { BearerToken } from '../src/auth/StartGGOAuth2';

describe('BearerToken', () => {
  test('applies skew and expiry checks', () => {
    const now = 1_000_000;
    const res = {
      access_token: 'at',
      token_type: 'Bearer',
      expires_in: 120,
    };
    const token = BearerToken.fromOAuthResponse(res as any, now, 60);
    expect(token.isExpired(now)).toBe(false);
    expect(token.willExpireWithin(120, now)).toBe(true);
    expect(token.toAuthHeader()).toEqual({ Authorization: 'Bearer at' });
  });

  test('non-expiring when expires_in absent', () => {
    const token = BearerToken.fromOAuthResponse({ access_token: 'at', token_type: 'Bearer' } as any, 0, 60);
    expect(token.isExpired()).toBe(false);
  });
});