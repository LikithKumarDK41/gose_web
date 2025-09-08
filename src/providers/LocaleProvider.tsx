// app/providers/LocaleProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Translations = Record<string, any>;
type LocaleContextType = {
  locale: string;
  setLocale: (l: string) => void;
  t: (key: string, vars?: Record<string, any>) => string;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const DEFAULT_LOCALE = "en";
const LOCALE_STORAGE_KEY = "site_locale";

// Load JSON from /public/locales/<locale>.json
async function loadLocaleJson(locale: string): Promise<Translations> {
  try {
    const res = await fetch(`/locales/${locale}.json?ts=${Date.now()}`); // prevent caching during dev
    if (!res.ok) throw new Error("Locale file not found");
    return await res.json();
  } catch (err) {
    console.warn("Locale load failed for", locale, err);
    return {};
  }
}

function getNested(obj: any, key: string) {
  return key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function interp(str: string, vars?: Record<string, any>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, name) => {
    const val = vars[name];
    return val === undefined || val === null ? "" : String(val);
  });
}

// very basic plural support
function pluralizePattern(pattern: string, vars?: Record<string, any>) {
  const match = pattern.match(/\{(\w+),\s*plural,\s*one\s*\{([^}]+)\}\s*other\s*\{([^}]+)\}\}/);
  if (!match) return interp(pattern, vars);
  const [, varName, oneText, otherText] = match;
  const n = Number(vars?.[varName] ?? 0);
  const chosen = n === 1 ? oneText : otherText;
  return chosen.replace(/#/g, String(n));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    return localStorage.getItem(LOCALE_STORAGE_KEY) || navigator.language?.split("-")[0] || DEFAULT_LOCALE;
  });

  const [translations, setTranslations] = useState<Translations | null>(null); // null until loaded

  // Load translations whenever locale changes
  useEffect(() => {
    let mounted = true;
    setTranslations(null); // reset while loading
    loadLocaleJson(locale).then((t) => {
      if (mounted) setTranslations(t || {});
    });
    return () => {
      mounted = false;
    };
  }, [locale]);

  // update locale and persist
  const setLocale = (l: string) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {}
  };

  // translation function
  const t = (key: string, vars?: Record<string, any>) => {
    if (!translations) return ""; // not loaded yet
    const found = getNested(translations, key);
    if (typeof found === "string") {
      if (found.includes(", plural,")) return pluralizePattern(found, vars);
      return interp(found, vars);
    }
    const fallback = key.split(".").slice(-1)[0];
    return fallback || key;
  };

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, translations]);

  // Don't render children until translations loaded
  if (!translations) return <div>Loading translations...</div>;

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
