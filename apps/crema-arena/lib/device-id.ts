// Client-side helpers for anonymous crowd voting (RMP-128).
//
// The audience is unauthenticated, so each device gets an opaque random id kept
// in localStorage. It is NOT PII — just a best-effort dedup key the cast
// endpoint stores on CrowdVote rows. We also persist the device's selected side
// per duel so a returning device shows its previous pick after a reload.
//
// Everything here is SSR-safe: server renders guard on `typeof window` and
// return null/undefined rather than touching localStorage.

const DEVICE_ID_KEY = 'crema_device_id';
const SELECTED_SIDE_PREFIX = 'crema_crowd_vote:';

export type CrowdSide = 'a' | 'b';

function safeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode / disabled storage — degrade gracefully (no persistence).
    return null;
  }
}

function randomUuid(): string {
  // Prefer the platform crypto UUID; fall back to a v4-ish string when it's
  // unavailable (older browsers, insecure contexts).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Read (or lazily create + persist) this device's opaque id.
 * SSR-safe: returns a fresh, non-persisted id on the server so callers always
 * get a string. On the client the value is stable across reloads.
 */
export function getOrCreateDeviceId(): string {
  const store = safeLocalStorage();
  if (!store) return randomUuid();

  let id = store.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = randomUuid();
    try {
      store.setItem(DEVICE_ID_KEY, id);
    } catch {
      // Ignore quota/availability errors; the in-memory id still works for now.
    }
  }
  return id;
}

/** Read the side this device previously selected for a given duel, if any. */
export function getSelectedSide(duelId: string): CrowdSide | null {
  const store = safeLocalStorage();
  if (!store || !duelId) return null;
  const value = store.getItem(SELECTED_SIDE_PREFIX + duelId);
  return value === 'a' || value === 'b' ? value : null;
}

/** Persist the side this device selected for a given duel. */
export function setSelectedSide(duelId: string, side: CrowdSide): void {
  const store = safeLocalStorage();
  if (!store || !duelId) return;
  try {
    store.setItem(SELECTED_SIDE_PREFIX + duelId, side);
  } catch {
    // Ignore persistence failures — the optimistic UI state still holds for the
    // current session.
  }
}

/** Remove this device's persisted selection for a given duel. */
export function clearSelectedSide(duelId: string): void {
  const store = safeLocalStorage();
  if (!store || !duelId) return;
  try {
    store.removeItem(SELECTED_SIDE_PREFIX + duelId);
  } catch {
    // Ignore removal failures — degrade gracefully like the other helpers.
  }
}
