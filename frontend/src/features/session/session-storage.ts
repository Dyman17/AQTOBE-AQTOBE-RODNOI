import type { PersistedSession } from "@/shared/types/domain";

const SESSION_KEY = "aqbobek.session";

export function loadStoredSession(): PersistedSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed.token || !parsed.role || !parsed.authMode) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function saveStoredSession(session: PersistedSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
