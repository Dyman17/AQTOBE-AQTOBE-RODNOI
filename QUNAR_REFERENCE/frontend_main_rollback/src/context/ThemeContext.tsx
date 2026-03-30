import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiPatch, API_PREFIX } from "@/api/client";
import { useAuth } from "@/context/AuthContext";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("qunar_theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const { user } = useAuth();
  const lastSynced = useRef<Theme | null>(null);

  useEffect(() => {
    const pref = user?.theme_preference;
    if (pref === "light" || pref === "dark") {
      setThemeState(pref);
    }
  }, [user?.theme_preference]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("qunar_theme", theme);
    if (user?.id) {
      if (lastSynced.current !== theme) {
        lastSynced.current = theme;
        apiPatch(`${API_PREFIX}/users/me`, { theme_preference: theme }, true).catch(() => {});
      }
    }
  }, [theme, user?.id]);

  const setTheme = (value: Theme) => setThemeState(value);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
