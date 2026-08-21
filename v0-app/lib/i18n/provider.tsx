"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getDictionary, LOCALES, type Dictionary, type Locale } from "./dictionaries"

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = "hegeva.locale"

function isLocale(v: string | null): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v)
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  // Restore persisted locale on mount (client only, avoids hydration mismatch).
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
    if (isLocale(stored)) setLocaleState(stored)
  }, [])

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale
  }, [locale])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l)
  }

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: getDictionary(locale) }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
