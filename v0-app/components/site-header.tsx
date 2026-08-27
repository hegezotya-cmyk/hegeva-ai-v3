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
  const pathname = usePathname(); const router = useRouter(); const { data: session, isPending: sessionPending } = authClient.useSession()
  const [studioOpen, setStudioOpen] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const [loggingOut, setLoggingOut] = useState(false)
  const studioRef = useRef<HTMLDivElement>(null)

  useEffect(() => { function onClick(e: MouseEvent) { if (studioRef.current && !studioRef.current.contains(e.target as Node)) setStudioOpen(false) } document.addEventListener("mousedown", onClick); return () => document.removeEventListener("mousedown", onClick) }, [])
  useEffect(() => { setStudioOpen(false); setMobileOpen(false) }, [pathname])

  const studioItems = [
    { key:"prompt" as const, href:"/app-studio/prompt-my-app", title:t.studio.prompt, desc:t.studio.promptDesc, pro:false },
    { key:"build" as const, href:"/app-studio/build-my-app", title:t.studio.build, desc:t.studio.buildDesc, pro:false },
    { key:"x20" as const, href:"/app-studio/build-my-app-x20", title:x20Copy[locale].title, desc:x20Copy[locale].desc, pro:true },
    { key:"fix" as const, href:"/app-studio/fix-my-app", title:t.studio.fix, desc:t.studio.fixDesc, pro:false },
  ]

  async function logout() { if(loggingOut) return; setLoggingOut(true); try { await authClient.signOut(); router.replace("/"); router.refresh() } finally { setLoggingOut(false) } }
  const navLink = (href:string,label:string) => { const active=pathname===href; return <Link href={href} aria-current={active?"page":undefined} className={cn("relative rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",active?"hegeva-nav-active text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary after:to-cyan":"text-muted-foreground hover:bg-secondary/45 hover:text-foreground")}>{label}</Link> }
  const mobileLinkClass = (href:string) => cn("relative overflow-hidden rounded-2xl border px-3.5 py-3 text-sm font-medium transition-all", pathname===href ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_28px_-18px_var(--primary)]" : "border-white/8 bg-background/25 text-foreground hover:border-primary/20 hover:bg-secondary/50")

  return (
    <header className="hegeva-topbar sticky top-0 z-50 border-b border-border/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6"><div className="drop-shadow-[0_0_18px_rgba(52,211,153,.12)]"><HegevaLogo priority /></div><nav className="hidden items-center gap-0.5 lg:flex" aria-label={aria.primary}>{navLink("/",t.nav.home)}{navLink("/command-center",t.nav.commandCenter)}<div ref={studioRef} className="relative"><button type="button" onClick={()=>setStudioOpen(v=>!v)} aria-haspopup="menu" aria-expanded={studioOpen} className={cn("inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",pathname.startsWith("/app-studio")?"hegeva-nav-active text-foreground":"text-muted-foreground hover:bg-secondary/45 hover:text-foreground")}>{t.nav.appStudio}<ChevronDown className={cn("size-3.5 opacity-70 transition-transform",studioOpen&&"rotate-180")} /></button>{studioOpen&&<div className="glass-panel absolute left-0 z-50 mt-3 w-96 rounded-2xl p-2" role="menu">{studioItems.map(item=>{const Icon=studioIcons[item.key];return <Link key={item.key} href={item.href} role="menuitem" className={cn("flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-secondary/70",item.pro&&"border border-gold/20 bg-gold/5")}><span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-[0_12px_28px_-18px_currentColor]",item.pro?"border-gold/30 bg-gold/10 text-gold":"border-primary/25 bg-primary/10 text-primary")}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">{item.title}</span>{item.pro&&<span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">PRO</span>}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.desc}</span></span></Link>})}</div>}</div>{navLink("/business",t.nav.business)}{navLink("/pricing",t.nav.pricing)}{navLink("/contact",t.nav.contact)}</nav></div>
        <div className="flex items-center gap-2"><LanguageSwitcher className="hidden sm:block" />{!sessionPending&&(session?.user?<div className="hidden items-center gap-1 sm:flex"><Link href="/account" className={cn(buttonVariants({variant:"ghost",size:"lg"}),"gap-2")}><UserRound className="size-4" />{t.nav.account}</Link><button type="button" disabled={loggingOut} onClick={()=>void logout()} className={cn(buttonVariants({variant:"ghost",size:"lg"}),"gap-2 text-muted-foreground disabled:opacity-60")}><LogOut className="size-4" />{t.nav.logout}</button></div>:<Link href="/login" className={cn(buttonVariants({variant:"ghost",size:"lg"}),"hidden sm:inline-flex")}>{t.nav.login}</Link>)}<Link href={session?.user?"/command-center":"/get-started"} className={cn(buttonVariants({size:"lg"}),"hidden border border-gold/20 bg-gold text-gold-foreground shadow-[0_14px_34px_-22px_rgba(250,204,21,.75)] hover:bg-gold/90 sm:inline-flex")}>{session?.user?t.nav.openWorkspace:t.nav.getStarted}</Link><button type="button" onClick={()=>setMobileOpen(v=>!v)} aria-label={aria.menu} aria-expanded={mobileOpen} className="inline-flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-foreground shadow-[0_0_24px_-16px_var(--primary)] transition-all hover:border-primary/40 hover:bg-primary/12 lg:hidden">{mobileOpen?<X className="size-4"/>:<Menu className="size-4"/>}</button></div>
      </div>

      {mobileOpen&&<div className="relative max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-white/8 bg-background/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
        <div className="pointer-events-none absolute -left-20 top-12 size-56 rounded-full bg-primary/10 blur-3xl"/><div className="pointer-events-none absolute -right-16 top-56 size-56 rounded-full bg-violet/10 blur-3xl"/>
        <nav className="relative mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6" aria-label={aria.mobile}>
          <div className="mb-1 flex items-center justify-between rounded-2xl border border-white/8 bg-background/25 px-3.5 py-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">HEGEVA AI</p><p className="mt-0.5 text-xs text-muted-foreground">Business · AI · Freedom</p></div><Sparkles className="size-4 text-gold"/></div>
          <Link href="/" className={mobileLinkClass("/")}>{t.nav.home}</Link><Link href="/command-center" className={mobileLinkClass("/command-center")}>{t.nav.commandCenter}</Link>
          <div className="mt-1 px-1 pt-2 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{t.nav.appStudio}</div>
          {studioItems.map(item=>{const Icon=studioIcons[item.key];return <Link key={item.key} href={item.href} className={cn("flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all",item.pro?"border-gold/25 bg-gold/8 shadow-[0_0_26px_-18px_var(--gold)]":"border-white/8 bg-background/25 hover:border-primary/20 hover:bg-secondary/40")}><span className={cn("flex size-9 items-center justify-center rounded-xl border",item.pro?"border-gold/25 bg-gold/10 text-gold":"border-primary/20 bg-primary/8 text-primary")}><Icon className="size-4"/></span><span className="flex-1"><span className="block text-sm font-medium text-foreground">{item.title}</span><span className="mt-0.5 block line-clamp-1 text-[11px] text-muted-foreground">{item.desc}</span></span>{item.pro&&<span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">PRO</span>}</Link>})}
          <Link href="/business" className={mobileLinkClass("/business")}>{t.nav.business}</Link><Link href="/pricing" className={mobileLinkClass("/pricing")}>{t.nav.pricing}</Link><Link href="/contact" className={mobileLinkClass("/contact")}>{t.nav.contact}</Link>
          <div className="mt-2 grid grid-cols-2 items-center gap-2 rounded-2xl border border-white/8 bg-background/25 p-3"><LanguageSwitcher className="col-span-2" />{session?.user?<button type="button" disabled={loggingOut} onClick={()=>void logout()} className={cn(buttonVariants({variant:"outline",size:"lg"}),"flex-1 gap-2 disabled:opacity-60")}><LogOut className="size-4"/> {t.nav.logout}</button>:<Link href="/login" className={cn(buttonVariants({variant:"outline",size:"lg"}),"flex-1")}>{t.nav.login}</Link>}<Link href={session?.user?"/command-center":"/get-started"} className={cn(buttonVariants({size:"lg"}),"flex-1 bg-gold text-gold-foreground shadow-[0_0_26px_-16px_var(--gold)] hover:bg-gold/90")}>{session?.user?t.nav.openWorkspace:t.nav.getStarted}</Link></div>
        </nav>
      </div>}
    </header>
  )
}
