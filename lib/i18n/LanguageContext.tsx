"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import da from "@/locales/da.json";
import en from "@/locales/en.json";

export type Language = "da" | "en";

const translations = { da, en } as const;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const STORAGE_KEY = "recruitos_lang";
const DEFAULT_LANG: Language = "da";

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if path not found
    }
  }

  if (typeof current === "string") {
    return current;
  }

  return path; // Return the key if value is not a string
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANG);
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "da") {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const translation = getNestedValue(
        translations[lang] as unknown as Record<string, unknown>,
        key
      );
      return translation;
    },
    [lang]
  );

  // Prevent hydration mismatch by showing nothing until mounted
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Helper to get array translations
export function useTranslatedArray(key: string): string[] {
  const { lang } = useLanguage();
  const value = getNestedValue(
    translations[lang] as unknown as Record<string, unknown>,
    key
  );

  if (Array.isArray(value)) {
    return value as string[];
  }

  return [];
}
