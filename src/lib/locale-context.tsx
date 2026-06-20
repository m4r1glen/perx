import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Dict, type Locale } from "./i18n";

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: Dict };
const LocaleContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "perx.locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "sq" || saved === "en") setLocaleState(saved);
    } catch {
      /* localStorage may be unavailable */
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* localStorage may be unavailable */
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dict[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
