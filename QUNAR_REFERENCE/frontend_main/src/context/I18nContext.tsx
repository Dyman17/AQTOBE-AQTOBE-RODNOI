import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiPatch, API_PREFIX } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import type { Language } from "@/i18n/translations";
import { translations } from "@/i18n/translations";

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("qunar_lang") as Language | null;
  if (stored === "en" || stored === "ru" || stored === "kk") return stored;
  return "en";
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const { user } = useAuth();
  const lastSynced = useRef<Language | null>(null);

  useEffect(() => {
    const pref = user?.language_preference;
    if (pref === "en" || pref === "ru" || pref === "kk") {
      setLanguageState(pref);
    }
  }, [user?.language_preference]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("qunar_lang", language);
    }
    if (user?.id) {
      if (lastSynced.current !== language) {
        lastSynced.current = language;
        apiPatch(`${API_PREFIX}/users/me`, { language_preference: language }, true).catch(() => {});
      }
    }
  }, [language, user?.id]);

  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const parts = key.split(".");
      let value: any = translations[language];
      for (const part of parts) {
        value = value?.[part];
      }
      let text = typeof value === "string" ? value : key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        });
      }
      return text;
    };
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
