'use client';

import { useState } from 'react';

type AuthResponse = {
  url: string;
};

export default function HomePage() {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_STARTGG_CLIENT_ID ?? 'unset';
  const redirectUri = process.env.NEXT_PUBLIC_STARTGG_REDIRECT_URI ?? 'http://localhost:3000/api/startgg/callback';

  async function handleAuthorize() {
    setLoading(true);
    setError(null);
    setAuthUrl(null);

    try {
      const res = await fetch('/api/startgg/auth-url', { method: 'POST' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as AuthResponse;
      setAuthUrl(data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Start.gg OAuth2 + Next.js</h1>
      <p>
        This demo calls <code>buildAuthorizeUrl</code> on the server, stores the PKCE verifier in memory, and exchanges
        the authorization code in the callback API route. Update <code>.env.local</code> with your Start.gg client
        values before proceeding.
      </p>

      <section>
        <h2>Environment</h2>
        <ul>
          <li>
            <strong>Client ID:</strong> <code>{clientId}</code>
          </li>
          <li>
            <strong>Redirect URI:</strong> <code>{redirectUri}</code>
          </li>
        </ul>
      </section>

      <section>
        <h2>Authorize</h2>
        <p>
          Click the button to request a Start.gg authorize URL. The link appears below so you can inspect it before
          visiting. After finishing the Start.gg flow you&apos;ll be redirected back here and the callback will exchange
          the code and show a success message.
        </p>
        <button onClick={handleAuthorize} disabled={loading}>
          {loading ? 'Generating…' : 'Authorize with Start.gg'}
        </button>
        {error && (
          <p style={{ color: '#f87171', marginTop: '1rem' }}>
            Failed to request authorize URL: <code>{error}</code>
          </p>
        )}
        {authUrl && (
          <div style={{ marginTop: '1.5rem' }}>
            <p>Open the link below in a new tab:</p>
            <pre>{authUrl}</pre>
            <p>
              <a href={authUrl} target="_blank" rel="noreferrer">
                Launch Start.gg OAuth
              </a>
            </p>
          </div>
        )}
      </section>

      <section>
        <h2>Callback Output</h2>
        <p>
          The callback endpoint responds with a JSON summary. Keep an eye on the terminal running <code>npm run dev</code>{' '}
          to see the raw token payload. Do not ship the in-memory verifier store or plaintext token output to production.
        </p>
      </section>
    </main>
  );
}
