import { API_PREFIX, apiPost, apiRequest, clearTokens, setTokens } from "./client";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await apiPost<{ access_token: string; refresh_token: string }>(
    `${API_PREFIX}/auth/login`,
    payload,
    false
  );
  setTokens(data.access_token, data.refresh_token);
  return data;
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await apiPost(`${API_PREFIX}/auth/register`, payload, false);
  return data;
};

export const logout = async (refreshToken: string) => {
  try {
    await apiRequest(`${API_PREFIX}/auth/logout`, {
      method: "POST",
      body: { refresh_token: refreshToken },
      auth: true,
    });
  } finally {
    clearTokens();
  }
};
