"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ChevronDown, Hammer, Menu, Sparkles, Wrench, X } from "lucide-react"
import { HegevaLogo } from "@/components/hegeva-logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { StatusBadge } from "@/components/status-badge"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const studioIcons = { prompt: Sparkles, build: Hammer, fix: Wrench }

export function SiteHeader() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [studioOpen, setStudioOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const studioRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (studioRef.current && !studioRef.current.contains(e.target as Node)) setStudioOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setStudioOpen(false)
    setMobileOpen(false)
  }, [pathname])

  const studioItems = [
    { key: "prompt" as const, href: "/app-studio/prompt-my-app", title: t.studio.prompt, desc: t.studio.promptDesc, status: "beta" as const },
    { key: "build" as const, href: "/app-studio/build-my-app", title: t.studio.build, desc: t.studio.buildDesc, status: "coming" as const },
    { key: "fix" as const, href: "/app-studio/fix-my-app", title: t.studio.fix, desc: t.studio.fixDesc, status: "coming" as const },
  ]

  const navLink = (href: string, label: string) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <HegevaLogo priority />
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {navLink("/", t.nav.home)}
            {navLink("/command-center", t.nav.commandCenter)}

            <div ref={studioRef} className="relative">
              <button
                type="button"
                onClick={() => setStudioOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={studioOpen}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/app-studio") ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.nav.appStudio}
                <ChevronDown className={cn("size-3.5 opacity-70 transition-transform", studioOpen && "rotate-180")} aria-hidden />
              </button>

              {studioOpen && (
                <div className="glass-panel absolute left-0 z-50 mt-2 w-80 rounded-2xl p-2" role="menu">
                  {studioItems.map((item) => {
                    const Icon = studioIcons[item.key]
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        role="menuitem"
                        className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary"
                      >
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                          <Icon className="size-4 text-primary" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{item.title}</span>
                            <StatusBadge status={item.status} />
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {navLink("/business", t.nav.business)}
            {navLink("/pricing", t.nav.pricing)}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:block" />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "hidden sm:inline-flex")}>
            {t.nav.login}
          </Link>
          <Link
            href="/get-started"
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden bg-gold text-gold-foreground hover:bg-gold/90 sm:inline-flex",
            )}
          >
            {t.nav.getStarted}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-input/30 text-foreground lg:hidden"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Mobile">
            <Link href="/" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.home}</Link>
            <Link href="/command-center" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.commandCenter}</Link>

            <div className="mt-1 px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.nav.appStudio}</div>
            {studioItems.map((item) => {
              const Icon = studioIcons[item.key]
              return (
                <Link key={item.key} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary">
                  <Icon className="size-4 text-primary" aria-hidden />
                  <span className="flex-1 text-sm font-medium text-foreground">{item.title}</span>
                  <StatusBadge status={item.status} />
                </Link>
              )
            })}

            <Link href="/business" className="mt-1 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.business}</Link>
            <Link href="/pricing" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.pricing}</Link>

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-4">
              <LanguageSwitcher />
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}>{t.nav.login}</Link>
              <Link href="/get-started" className={cn(buttonVariants({ size: "lg" }), "flex-1 bg-gold text-gold-foreground hover:bg-gold/90")}>{t.nav.getStarted}</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
