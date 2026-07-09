'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { t as translate, defaultLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  try {
    const saved = localStorage.getItem('locale');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {
    // ignore
  }
  return defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = (key: string) => translate(key, locale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key: string) => translate(key, defaultLocale),
    };
  }
  return context;
}