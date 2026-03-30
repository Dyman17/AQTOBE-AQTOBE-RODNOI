import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { API_PREFIX, apiGet, clearTokens, getAccessToken } from "@/api/client";
import { login as apiLogin, logout as apiLogout, register as apiRegister, RegisterPayload } from "@/api/auth";
import { getRefreshToken } from "@/api/client";

export type User = {
  id: number;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  subscription_type?: string;
  theme_preference?: string | null;
  language_preference?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAccessToken()));
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiGet<User>(`${API_PREFIX}/users/me`, true);
      setUser(data);
    } catch (err: any) {
      setUser(null);
      setError(err.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getAccessToken()) {
      refreshUser();
    }
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiLogin({ email, password });
      await refreshUser();
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      await apiRegister(payload);
      await apiLogin({ email: payload.email, password: payload.password });
      await refreshUser();
    } catch (err: any) {
      setError(err.message || "Register failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      await apiLogout(refresh);
    } else {
      clearTokens();
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, refreshUser }),
    [user, loading, error, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
