"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ChevronDown, Hammer, LogOut, Menu, Rocket, Sparkles, UserRound, Wrench, X } from "lucide-react"
import { HegevaLogo } from "@/components/hegeva-logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

const studioIcons = { prompt: Sparkles, build: Hammer, x20: Rocket, fix: Wrench }

const x20Copy = {
  en: { title: "Build My App X20", desc: "Pro app builder with verified builds, live preview and AI improvement passes." },
  hu: { title: "Build My App X20", desc: "Pro appépítő ellenőrzött buildekkel, élő előnézettel és AI-fejlesztésekkel." },
  de: { title: "Build My App X20", desc: "Pro-App-Builder mit geprüften Builds, Live-Vorschau und KI-Verbesserungen." },
  fr: { title: "Build My App X20", desc: "Builder Pro avec builds vérifiés, aperçu en direct et améliorations IA." },
  es: { title: "Build My App X20", desc: "Builder Pro con builds verificados, vista previa y mejoras con IA." },
} as const

export function SiteHeader() {
  const { t, locale } = useI18n()
  const aria = { en:{primary:"Primary navigation",menu:"Toggle menu",mobile:"Mobile navigation"}, hu:{primary:"Elsődleges navigáció",menu:"Menü megnyitása vagy bezárása",mobile:"Mobil navigáció"}, de:{primary:"Hauptnavigation",menu:"Menü umschalten",mobile:"Mobile Navigation"}, fr:{primary:"Navigation principale",menu:"Ouvrir ou fermer le menu",mobile:"Navigation mobile"}, es:{primary:"Navegación principal",menu:"Abrir o cerrar menú",mobile:"Navegación móvil"} }[locale]
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [studioOpen, setStudioOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const studioRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (studioRef.current && !studioRef.current.contains(e.target as Node)) setStudioOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  useEffect(() => {
    setStudioOpen(false)
    setMobileOpen(false)
  }, [pathname])

  const studioItems = [
    { key: "prompt" as const, href: "/app-studio/prompt-my-app", title: t.studio.prompt, desc: t.studio.promptDesc, pro: false },
    { key: "build" as const, href: "/app-studio/build-my-app", title: t.studio.build, desc: t.studio.buildDesc, pro: false },
    { key: "x20" as const, href: "/app-studio/build-my-app-x20", title: x20Copy[locale].title, desc: x20Copy[locale].desc, pro: true },
    { key: "fix" as const, href: "/app-studio/fix-my-app", title: t.studio.fix, desc: t.studio.fixDesc, pro: false },
  ]

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await authClient.signOut()
      router.replace("/")
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  const navLink = (href: string, label: string) => {
    const active = pathname === href
    return <Link href={href} aria-current={active ? "page" : undefined} className={cn("relative rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-secondary/70 text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-px after:bg-primary" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground")}>{label}</Link>
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 shadow-[0_12px_40px_-32px_rgba(0,0,0,.9)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <span className="xl:hidden"><HegevaLogo priority /></span>
          <nav className="hidden items-center gap-0.5 lg:flex xl:hidden" aria-label={aria.primary}>
            {navLink("/", t.nav.home)}
            {navLink("/command-center", t.nav.commandCenter)}
            <div ref={studioRef} className="relative">
              <button type="button" onClick={() => setStudioOpen((v) => !v)} aria-haspopup="menu" aria-expanded={studioOpen} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors", pathname.startsWith("/app-studio") ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>{t.nav.appStudio}<ChevronDown className={cn("size-3.5 opacity-70 transition-transform", studioOpen && "rotate-180")} aria-hidden /></button>
              {studioOpen && (
                <div className="glass-panel absolute left-0 z-50 mt-2 w-96 rounded-2xl p-2" role="menu">
                  {studioItems.map((item) => {
                    const Icon = studioIcons[item.key]
                    return (
                      <Link key={item.key} href={item.href} role="menuitem" className={cn("flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary", item.pro && "border border-gold/20 bg-gold/5")}>
                        <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border", item.pro ? "border-gold/30 bg-gold/10" : "border-primary/25 bg-primary/10")}><Icon className={cn("size-4", item.pro ? "text-gold" : "text-primary")} aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">{item.title}</span>{item.pro ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">PRO</span> : null}</span>
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
            {navLink("/contact", t.nav.contact)}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:block" />
          {!sessionPending && (session?.user ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Link href="/account" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "gap-2")}><UserRound className="size-4" aria-hidden />{t.nav.account}</Link>
              <button type="button" disabled={loggingOut} onClick={() => void logout()} className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "gap-2 text-muted-foreground disabled:opacity-60")}><LogOut className="size-4" aria-hidden />{t.nav.logout}</button>
            </div>
          ) : <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "hidden sm:inline-flex")}>{t.nav.login}</Link>)}
          <Link href={session?.user ? "/command-center" : "/get-started"} className={cn(buttonVariants({ size: "lg" }), "hidden bg-gold text-gold-foreground hover:bg-gold/90 sm:inline-flex")}>{session?.user ? t.nav.openWorkspace : t.nav.getStarted}</Link>
          <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-label={aria.menu} aria-expanded={mobileOpen} className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary/60 text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-secondary lg:hidden">{mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}</button>
        </div>
      </div>
      {mobileOpen && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label={aria.mobile}>
            <Link href="/" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.home}</Link>
            <Link href="/command-center" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.commandCenter}</Link>
            <div className="mt-1 px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.nav.appStudio}</div>
            {studioItems.map((item) => { const Icon = studioIcons[item.key]; return <Link key={item.key} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary", item.pro && "border border-gold/20 bg-gold/5")}><Icon className={cn("size-4", item.pro ? "text-gold" : "text-primary")} aria-hidden /><span className="flex-1 text-sm font-medium text-foreground">{item.title}</span>{item.pro ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">PRO</span> : null}</Link> })}
            <Link href="/business" className="mt-1 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.business}</Link>
            <Link href="/pricing" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.pricing}</Link>
            <Link href="/contact" className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">{t.nav.contact}</Link>
            <div className="mt-3 grid grid-cols-2 items-center gap-2 border-t border-border pt-4">
              <LanguageSwitcher className="col-span-2" />
              {session?.user ? <button type="button" disabled={loggingOut} onClick={() => void logout()} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1 gap-2 disabled:opacity-60")}><LogOut className="size-4" aria-hidden /> {t.nav.logout}</button> : <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}>{t.nav.login}</Link>}
              <Link href={session?.user ? "/command-center" : "/get-started"} className={cn(buttonVariants({ size: "lg" }), "flex-1 bg-gold text-gold-foreground hover:bg-gold/90")}>{session?.user ? t.nav.openWorkspace : t.nav.getStarted}</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
