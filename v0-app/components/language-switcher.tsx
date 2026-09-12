"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/dictionaries"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"

function LocaleFlag({ locale }: { locale: Locale }) {
  if (locale === "en") return <svg viewBox="0 0 30 20" className="locale-flag-svg" role="img" aria-label="United Kingdom"><path fill="#012169" d="M0 0h30v20H0z"/><path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20"/><path stroke="#c8102e" strokeWidth="2" d="m0 0 30 20M30 0 0 20"/><path stroke="#fff" strokeWidth="6" d="M15 0v20M0 10h30"/><path stroke="#c8102e" strokeWidth="3" d="M15 0v20M0 10h30"/></svg>
  if (locale === "hu") return <svg viewBox="0 0 30 20" className="locale-flag-svg" role="img" aria-label="Hungary"><path fill="#ce2939" d="M0 0h30v6.67H0z"/><path fill="#fff" d="M0 6.67h30v6.66H0z"/><path fill="#477050" d="M0 13.33h30V20H0z"/></svg>
  if (locale === "de") return <svg viewBox="0 0 30 20" className="locale-flag-svg" role="img" aria-label="Germany"><path fill="#000" d="M0 0h30v6.67H0z"/><path fill="#d00" d="M0 6.67h30v6.66H0z"/><path fill="#ffce00" d="M0 13.33h30V20H0z"/></svg>
  if (locale === "fr") return <svg viewBox="0 0 30 20" className="locale-flag-svg" role="img" aria-label="France"><path fill="#0055a4" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#ef4135" d="M20 0h10v20H20z"/></svg>
  return <svg viewBox="0 0 30 20" className="locale-flag-svg" role="img" aria-label="Spain"><path fill="#aa151b" d="M0 0h30v5H0zM0 15h30v5H0z"/><path fill="#f1bf00" d="M0 5h30v10H0z"/></svg>
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-input/30 px-3 text-sm font-medium text-foreground/90 transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <span className="locale-flag" aria-hidden><LocaleFlag locale={locale} /></span>
        <span>{LOCALE_LABELS[locale].native}</span>
        <ChevronDown className={cn("size-3.5 opacity-60 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          className="glass-panel absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl p-1"
        >
          {LOCALES.map((l: Locale) => {
            const active = l === locale
            return (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLocale(l)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="locale-flag" aria-hidden><LocaleFlag locale={l} /></span>
                    <span>{LOCALE_LABELS[l].label}</span>
                  </span>
                  {active && <Check className="size-3.5 text-primary" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
