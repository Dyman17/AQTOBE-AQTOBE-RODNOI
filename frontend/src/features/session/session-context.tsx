import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import type { AuthMode, PersistedSession, SessionUser } from "@/shared/types/domain";
import { clearStoredSession, loadStoredSession, saveStoredSession } from "./session-storage";

type SessionContextValue = {
  session: PersistedSession | null;
  user: SessionUser | null;
  isBootstrapping: boolean;
  error: string | null;
  signInWithRole: (role: PersistedSession["role"]) => Promise<PersistedSession["role"]>;
  signInWithCredentials: (email: string, password: string) => Promise<PersistedSession["role"]>;
  registerStudent: (payload: { name: string; class_id: string; email: string; password: string }) => Promise<PersistedSession["role"]>;
  registerParent: (payload: {
    name: string;
    email: string;
    password: string;
    child_student_email: string;
  }) => Promise<PersistedSession["role"]>;
  applySession: (payload: { token: string; role: PersistedSession["role"]; authMode: AuthMode }) => Promise<PersistedSession["role"]>;
  refreshMe: () => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PersistedSession | null>(() => loadStoredSession());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    if (!loadStoredSession()) {
      setUser(null);
      setIsBootstrapping(false);
      return;
    }

    setIsBootstrapping(true);
    try {
      const me = await aqbobekApi.auth.getMe();
      setUser(me);
      setSession(loadStoredSession());
      setError(null);
    } catch (reason) {
      clearStoredSession();
      setSession(null);
      setUser(null);
      setError(reason instanceof Error ? reason.message : "Сессия недоступна");
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const applySession = useCallback(
    async ({ token, role, authMode }: { token: string; role: PersistedSession["role"]; authMode: AuthMode }) => {
      const nextSession = { token, role, authMode } satisfies PersistedSession;
      saveStoredSession(nextSession);
      setSession(nextSession);
      await refreshMe();
      return role;
    },
    [refreshMe],
  );

  const signInWithRole = useCallback(
    async (role: PersistedSession["role"]) => {
      const payload = await aqbobekApi.auth.quickLogin(role);
      return applySession({ ...payload, authMode: "quick" });
    },
    [applySession],
  );

  const signInWithCredentials = useCallback(
    async (email: string, password: string) => {
      const payload = await aqbobekApi.auth.login(email, password);
      return applySession({ ...payload, authMode: "credentials" });
    },
    [applySession],
  );

  const registerStudent = useCallback(
    async (payload: { name: string; class_id: string; email: string; password: string }) => {
      const response = await aqbobekApi.auth.registerStudent(payload);
      return applySession({ token: response.token, role: response.role, authMode: "credentials" });
    },
    [applySession],
  );

  const registerParent = useCallback(
    async (payload: { name: string; email: string; password: string; child_student_email: string }) => {
      const response = await aqbobekApi.auth.registerParent(payload);
      return applySession({ token: response.token, role: response.role, authMode: "credentials" });
    },
    [applySession],
  );

  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setError(null);
    setIsBootstrapping(false);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      user,
      isBootstrapping,
      error,
      signInWithRole,
      signInWithCredentials,
      registerStudent,
      registerParent,
      applySession,
      refreshMe,
      signOut,
    }),
    [applySession, error, isBootstrapping, refreshMe, registerParent, registerStudent, session, signInWithCredentials, signInWithRole, signOut, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
