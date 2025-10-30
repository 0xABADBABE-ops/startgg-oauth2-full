import { computeCodeChallengeS256, generateCodeVerifier } from '../src/auth/StartGGOAuth2';

describe('PKCE helpers', () => {
  test('generateCodeVerifier length bounds', () => {
    expect(generateCodeVerifier(10).length).toBeGreaterThanOrEqual(43);
    expect(generateCodeVerifier(200).length).toBeLessThanOrEqual(128);
  });

  test('computeCodeChallengeS256 deterministic', async () => {
    const verifier = 'test-verifier-1234567890_-=.~';
    const ch1 = await computeCodeChallengeS256(verifier);
    const ch2 = await computeCodeChallengeS256(verifier);
    expect(ch1).toEqual(ch2);
    expect(typeof ch1).toBe('string');
    expect(ch1.length).toBeGreaterThan(20);
  });
});