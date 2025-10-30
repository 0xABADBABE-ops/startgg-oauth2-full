import type { StartGGScope } from 'startgg-oauth2-full/src/auth/StartGGOAuth2';

type PendingEntry = {
  codeVerifier: string;
  scopes: StartGGScope[];
  createdAt: number;
  timeout: NodeJS.Timeout;
};

const TTL_MS = 10 * 60_000;
const store = new Map<string, PendingEntry>();

export function savePending(state: string, data: { codeVerifier: string; scopes: StartGGScope[] }) {
  clearPending(state);

  const timeout = setTimeout(() => {
    store.delete(state);
  }, TTL_MS);

  store.set(state, { ...data, createdAt: Date.now(), timeout });
}

export function consumePending(state: string) {
  const entry = store.get(state);
  if (!entry) return null;
  clearTimeout(entry.timeout);
  store.delete(state);
  return entry;
}

function clearPending(state: string) {
  const current = store.get(state);
  if (current) {
    clearTimeout(current.timeout);
    store.delete(state);
  }
}
