// Full RFC-compliant implementation 
// of OAuth2 Authorization Code Flow with PKCE (RFC 6749, RFC 7636)
// for Start.gg API (https://start.gg/docs/oauth2).
// Happy to accept PRs for improvements or fixes!
// (c) 2025 0xabadbabe (jet'aime), Inc. (MIT License)
// Happy coding! <3

export enum StartGGScope {
  USER_IDENTITY = 'user.identity',
  USER_EMAIL = 'user.email',
  TOURNAMENT_MANAGER = 'tournament.manager',
  TOURNAMENT_REPORTER = 'tournament.reporter',
}

export interface IOAuth2HandlerWithPKCE {
  exchangeToken(
    code: string,
    codeVerifier: string,
    expectedScopes: StartGGScope[]
  ): Promise<OAuth2TokenResponse>;

  refreshToken(
    refreshToken: string,
    originalScopes: StartGGScope[]
  ): Promise<OAuth2TokenResponse>;
}

export class OAuth2Error extends Error {
  public readonly code?: string;
  public readonly details?: unknown;
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'OAuth2Error';
    this.code = code;
    this.details = details;
  }
}

interface OAuth2TokenRequestAuthCode {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
  code_verifier: string;
  client_id: string;
}

interface OAuth2TokenRequestRefresh {
  grant_type: 'refresh_token';
  refresh_token: string;
  client_id: string;
  scope?: string;
}

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;        // runtime-validated to Bearer
  expires_in?: number;       // seconds
  refresh_token?: string;
  scope?: string;            // optional space-delimited
  [k: string]: unknown;
}

export class ScopeValidationError extends OAuth2Error {
  constructor(
    message: string,
    public readonly requestedScopes: string[],
    public readonly grantedScopes?: string[]
  ) {
    super(message, 'SCOPE_VALIDATION_FAILED');
  }
}

/** WebCrypto subtle (browser + Node >=18). */
async function getSubtleCrypto(): Promise<SubtleCrypto> {
  const g = globalThis as any;
  if (g.crypto?.subtle) return g.crypto.subtle as SubtleCrypto;
  throw new OAuth2Error('WebCrypto subtle not available; required for PKCE S256', 'CRYPTO_UNAVAILABLE');
}

/** Base64 (Buffer if available, else btoa path). */
function base64Encode(bytes: Uint8Array): string {
  const g = globalThis as any;
  if (typeof g.Buffer?.from === 'function') return g.Buffer.from(bytes).toString('base64');
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  if (typeof g.btoa !== 'function') throw new OAuth2Error('btoa not available for base64 encoding', 'B64_UNAVAILABLE');
  return g.btoa(binary);
}

/** URL-safe Base64 (no padding). */
function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return base64Encode(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Random bytes using WebCrypto. */
function getRandomBytes(length: number): Uint8Array {
  const g = globalThis as any;
  if (!g.crypto?.getRandomValues) throw new OAuth2Error('crypto.getRandomValues unavailable', 'RNG_UNAVAILABLE');
  const bytes = new Uint8Array(length);
  g.crypto.getRandomValues(bytes);
  return bytes;
}

/** x-www-form-urlencoded body. */
function formBody(params: Record<string, string>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) sp.set(k, v);
  return sp.toString();
}

/** Parse non-JSON error bodies safely. */
async function parseJsonSafe(res: Response): Promise<unknown> {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

/** Validate token response + Bearer type. */
function validateTokenResponse(tr: OAuth2TokenResponse): void {
  if (!tr || typeof tr !== 'object') throw new OAuth2Error('Invalid token response shape', 'INVALID_TOKEN_RESPONSE', tr);
  if (!tr.access_token) throw new OAuth2Error('Missing access_token', 'INVALID_TOKEN_RESPONSE', tr);
  if (!tr.token_type || tr.token_type.toLowerCase() !== 'bearer') {
    throw new OAuth2Error('Unsupported token_type', 'UNSUPPORTED_TOKEN_TYPE', tr);
  }
}

/** If scope omitted, assume unchanged (RFC 6749). */
function validateScopesOrAssumePrevious(responseScope: string | undefined, requiredScopes: string[]): void {
  if (!requiredScopes.length) return;
  if (responseScope == null) return;
  const granted = new Set(responseScope.split(/\s+/).filter(Boolean));
  const missing = requiredScopes.filter(s => !granted.has(s));
  if (missing.length > 0) {
    throw new ScopeValidationError(
      `Missing required scopes: ${missing.join(', ')}`,
      requiredScopes,
      Array.from(granted)
    );
  }
}

/** Fetch with timeout to avoid hangs. */
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 15000, ...rest } = init;
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: ac.signal });
  } finally {
    clearTimeout(id);
  }
}

// -------- PKCE (RFC 7636) --------

const PKCE_VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function generateCodeVerifier(length = 64): string {
  const len = Math.min(Math.max(length, 43), 128);
  const alphabet = PKCE_VERIFIER_CHARS;
  const alphabetLength = alphabet.length;
  const maxValue = Math.floor(256 / alphabetLength) * alphabetLength;
  const result: string[] = [];

  while (result.length < len) {
    const randomBytes = getRandomBytes(len - result.length);
    for (const byte of randomBytes) {
      if (byte >= maxValue) continue; // Skip to avoid modulo bias.
      result.push(alphabet.charAt(byte % alphabetLength));
      if (result.length === len) break;
    }
  }

  return result.join('');
}

/** S256 challenge for a verifier. */
export async function computeCodeChallengeS256(codeVerifier: string): Promise<string> {
  const enc = new TextEncoder();
  const subtle = await getSubtleCrypto();
  const hash = await subtle.digest('SHA-256', enc.encode(codeVerifier));
  return base64Url(hash);
}

// -------- Authorize URL (RFC 6749 §4.1) --------

export type AuthorizeUrlOptions = {
  scopes: (StartGGScope | string)[];
  state?: string;
  prompt?: string;
  codeVerifier?: string;
  codeChallenge?: string;
  extras?: Record<string, string | number | boolean | undefined>;
};

export type BuiltAuthorizeUrl = {
  url: string;
  codeVerifier: string;
  codeChallenge: string;
};

/** Build an authorization URL with PKCE (S256). */
export async function buildAuthorizeUrl(
  cfg: { clientId: string; authEndpoint: string; redirectUri: string },
  opts: AuthorizeUrlOptions
): Promise<BuiltAuthorizeUrl> {
  let codeVerifier: string;
  let codeChallenge: string;

  if (opts.codeVerifier && opts.codeChallenge) {
    const expectedChallenge = await computeCodeChallengeS256(opts.codeVerifier);
    if (expectedChallenge !== opts.codeChallenge) {
      throw new OAuth2Error('Provided codeChallenge does not match codeVerifier', 'INVALID_PKCE_PAIR');
    }
    codeVerifier = opts.codeVerifier;
    codeChallenge = opts.codeChallenge;
  } else if (opts.codeVerifier) {
    codeVerifier = opts.codeVerifier;
    codeChallenge = await computeCodeChallengeS256(codeVerifier);
  } else if (opts.codeChallenge) {
    throw new OAuth2Error('codeVerifier is required when providing codeChallenge', 'INVALID_PKCE_PAIR');
  } else {
    codeVerifier = generateCodeVerifier();
    codeChallenge = await computeCodeChallengeS256(codeVerifier);
  }

  const u = new URL(cfg.authEndpoint);
  const params: Record<string, string> = {
    response_type: 'code',
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: opts.scopes.map(String).join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };
  if (opts.state) params.state = opts.state;
  if (opts.prompt) params.prompt = opts.prompt;
  if (opts.extras) {
    for (const [k, v] of Object.entries(opts.extras)) if (v != null) params[k] = String(v);
  }
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

  return { url: u.toString(), codeVerifier, codeChallenge };
}

// -------- Bearer Token Helper (RFC 6750) --------

export class BearerToken {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly refreshToken?: string;
  readonly expiresAt?: number; // epoch ms

  private constructor(init: { accessToken: string; tokenType: 'Bearer'; refreshToken?: string; expiresAt?: number; }) {
    this.accessToken = init.accessToken;
    this.tokenType = init.tokenType;
    this.refreshToken = init.refreshToken;
    this.expiresAt = init.expiresAt;
  }

  static fromOAuthResponse(res: OAuth2TokenResponse, nowMs: number = Date.now(), skewSeconds = 60): BearerToken {
    validateTokenResponse(res);
    const expiresAt =
      typeof res.expires_in === 'number'
        ? nowMs + Math.max(0, (res.expires_in - Math.max(0, skewSeconds)) * 1000)
        : undefined;

    return new BearerToken({
      accessToken: res.access_token,
      tokenType: 'Bearer',
      refreshToken: res.refresh_token,
      expiresAt,
    });
  }

  isExpired(nowMs: number = Date.now()): boolean {
    if (this.expiresAt == null) return false; // unknown → treat as non-expiring
    return nowMs >= this.expiresAt;
  }

  willExpireWithin(seconds: number, nowMs: number = Date.now()): boolean {
    if (this.expiresAt == null) return false;
    return this.expiresAt - nowMs <= seconds * 1000;
  }

  toAuthHeader(): Record<string, string> {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  assertUsable(nowMs: number = Date.now()): void {
    if (this.isExpired(nowMs)) throw new OAuth2Error('Access token expired', 'TOKEN_EXPIRED');
  }
}

// -------- Handler (RFC 6749 §4.1.3, §6) --------

export class StartGGOAuth2Handler implements IOAuth2HandlerWithPKCE {
  constructor(
    private readonly config: {
      clientId: string;
      redirectUri: string;
      authEndpoint: string;  // used by buildAuthorizeUrl
      tokenEndpoint: string;
      fetchTimeoutMs?: number;
    }
  ) {}

  /** Exchange authorization code for tokens (PKCE). */
  async exchangeToken(code: string, codeVerifier: string, expectedScopes: StartGGScope[]): Promise<OAuth2TokenResponse> {
    const tokenRequest: OAuth2TokenRequestAuthCode = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
      client_id: this.config.clientId,
    };

    const res = await fetchWithTimeout(this.config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: formBody(tokenRequest as unknown as Record<string, string>),
      timeoutMs: this.config.fetchTimeoutMs ?? 15000,
    });

    if (!res.ok) {
      const details = await parseJsonSafe(res);
      throw new OAuth2Error('Token exchange failed', 'TOKEN_EXCHANGE_FAILED', details);
    }

    const tokenResponse = (await res.json()) as OAuth2TokenResponse;
    validateTokenResponse(tokenResponse);
    validateScopesOrAssumePrevious(tokenResponse.scope, expectedScopes.map(String));

    return tokenResponse;
  }

  /** Refresh access token; preserve prior refresh token if server omits rotation. */
  async refreshToken(refreshToken: string, originalScopes: StartGGScope[]): Promise<OAuth2TokenResponse> {
    const refreshRequest: OAuth2TokenRequestRefresh = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      scope: originalScopes.length ? originalScopes.join(' ') : undefined,
    };

    const res = await fetchWithTimeout(this.config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: formBody(Object.fromEntries(Object.entries(refreshRequest).filter(([, v]) => v != null)) as Record<string, string>),
      timeoutMs: this.config.fetchTimeoutMs ?? 15000,
    });

    if (!res.ok) {
      const details = await parseJsonSafe(res);
      throw new OAuth2Error('Token refresh failed', 'TOKEN_REFRESH_FAILED', details);
    }

    const tokenResponse = (await res.json()) as OAuth2TokenResponse;
    validateTokenResponse(tokenResponse);
    validateScopesOrAssumePrevious(tokenResponse.scope, originalScopes.map(String));

    if (!tokenResponse.refresh_token) tokenResponse.refresh_token = refreshToken;

    return tokenResponse;
  }
}

/** Factory */
export function createStartGGAuth2Handler(params: {
  clientId: string;
  redirectUri: string;
  authEndpoint: string;
  tokenEndpoint: string;
  fetchTimeoutMs?: number;
}) {
  return new StartGGOAuth2Handler(params);
}
