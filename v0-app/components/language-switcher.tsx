"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/dictionaries"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"

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
        <Globe className="size-3.5 text-primary" aria-hidden />
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
                    <span className="w-6 text-xs font-semibold tracking-wide text-primary">{LOCALE_LABELS[l].native}</span>
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
