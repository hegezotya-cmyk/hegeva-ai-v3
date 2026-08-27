"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Languages } from "lucide-react"
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/dictionaries"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"

const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  hu: "🇭🇺",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
}

const FULL_NAME: Record<Locale, string> = {
  en: "English",
  hu: "Magyar",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
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
        className="group flex min-h-11 sm:min-h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-background/35 px-3.5 text-left text-sm font-medium text-foreground/90 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-xl transition-all hover:border-cyan/25 hover:bg-background/55"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/8 text-lg shadow-[0_0_24px_-14px_rgba(34,211,238,.9)]" aria-hidden>
          {FLAG[locale]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[.16em] text-cyan/80">Language</span>
          <span className="block truncate text-sm text-foreground">{FULL_NAME[locale]}</span>
        </span>
        <Languages className="size-4 text-violet/80" aria-hidden />
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          className="glass-panel absolute bottom-[calc(100%+10px)] left-0 z-[80] w-full min-w-[250px] overflow-hidden rounded-2xl border-white/10 p-2 shadow-[0_24px_70px_-28px_rgba(0,0,0,.92)] sm:bottom-auto sm:top-[calc(100%+10px)]"
        >
          <li className="px-2.5 pb-2 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan">Choose language</p>
            <p className="mt-1 text-[11px] text-muted-foreground">HEGEVA interface language</p>
          </li>
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
                    "group flex min-h-11 sm:min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                    active
                      ? "border-primary/30 bg-primary/10 text-foreground shadow-[0_0_28px_-18px_var(--primary)]"
                      : "border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border text-lg transition-all", active ? "border-primary/25 bg-primary/10" : "border-white/8 bg-background/30 group-hover:border-cyan/20")} aria-hidden>
                    {FLAG[l]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{FULL_NAME[l]}</span>
                    <span className="block text-[11px] text-muted-foreground">{LOCALE_LABELS[l].label}</span>
                  </span>
                  {active ? (
                    <span className="flex size-7 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground/60">{LOCALE_LABELS[l].native}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
