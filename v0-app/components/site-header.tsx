"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronDown, Hammer, Home, LayoutDashboard, LogOut, Menu, Rocket, Sparkles, UserRound, WalletCards, Wrench, X } from "lucide-react"
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
  const [studioOpen, setStudioOpen] = useState(pathname.startsWith("/app-studio")); const [mobileOpen, setMobileOpen] = useState(false); const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => { setMobileOpen(false); if (pathname.startsWith("/app-studio")) setStudioOpen(true) }, [pathname])

  const studioItems = [
    { key:"prompt" as const, href:"/app-studio/prompt-my-app", title:t.studio.prompt, desc:t.studio.promptDesc, pro:false },
    { key:"build" as const, href:"/app-studio/build-my-app", title:t.studio.build, desc:t.studio.buildDesc, pro:false },
    { key:"x20" as const, href:"/app-studio/build-my-app-x20", title:x20Copy[locale].title, desc:x20Copy[locale].desc, pro:true },
    { key:"fix" as const, href:"/app-studio/fix-my-app", title:t.studio.fix, desc:t.studio.fixDesc, pro:false },
  ]

  async function logout() { if(loggingOut) return; setLoggingOut(true); try { await authClient.signOut(); router.replace("/"); router.refresh() } finally { setLoggingOut(false) } }

  const sidebarLink = (href:string,label:string,Icon:typeof Home) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
    return <Link href={href} aria-current={active?"page":undefined} className={cn("group flex min-h-11 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200",active?"border-primary/30 bg-primary/10 text-foreground shadow-[0_0_34px_-22px_var(--primary)]":"border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/[0.035] hover:text-foreground")}><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl border transition-all",active?"border-primary/30 bg-primary/10 text-primary shadow-[0_0_22px_-12px_var(--primary)]":"border-white/8 bg-background/30 text-muted-foreground group-hover:text-primary")}><Icon className="size-4" aria-hidden /></span><span className="truncate">{label}</span>{active&&<span className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />}</Link>
  }

  const mobileLinkClass = (href:string) => cn("relative overflow-hidden rounded-2xl border px-3.5 py-3 text-sm font-medium transition-all", pathname===href ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_28px_-18px_var(--primary)]" : "border-white/8 bg-background/25 text-foreground hover:border-primary/20 hover:bg-secondary/50")

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[286px] border-r border-white/8 bg-background/78 backdrop-blur-2xl lg:flex lg:flex-col" aria-label={aria.primary}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-24 top-10 size-64 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute -right-24 top-[38%] size-64 rounded-full bg-cyan/8 blur-3xl" />
          <div className="absolute bottom-6 left-10 size-40 rounded-full bg-violet/8 blur-3xl" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-5 rounded-3xl border border-white/8 bg-white/[0.025] p-3 shadow-[0_18px_60px_-42px_rgba(34,211,238,.35)]">
            <div className="flex items-center gap-3"><div className="drop-shadow-[0_0_18px_rgba(52,211,153,.16)]"><HegevaLogo priority /></div></div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/[0.045] px-3 py-2">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60"/><span className="relative inline-flex size-2 rounded-full bg-primary"/></span>
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-primary">HEGEVA Core</p><p className="truncate text-[11px] text-muted-foreground">Business · AI · Freedom</p></div>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1" aria-label={aria.primary}>
            {sidebarLink("/",t.nav.home,Home)}
            {sidebarLink("/command-center",t.nav.commandCenter,LayoutDashboard)}

            <div className="pt-1">
              <button type="button" onClick={()=>setStudioOpen(v=>!v)} aria-expanded={studioOpen} className={cn("flex w-full min-h-11 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all",pathname.startsWith("/app-studio")?"border-violet/25 bg-violet/8 text-foreground":"border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/[0.035] hover:text-foreground")}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-violet/20 bg-violet/8 text-violet"><Sparkles className="size-4"/></span><span className="flex-1">{t.nav.appStudio}</span><ChevronDown className={cn("size-4 transition-transform",studioOpen&&"rotate-180")}/>
              </button>
              {studioOpen&&<div className="ml-4 mt-1 space-y-1 border-l border-violet/15 pl-3">{studioItems.map(item=>{const Icon=studioIcons[item.key]; const active=pathname===item.href; return <Link key={item.key} href={item.href} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all",active?"bg-violet/10 text-foreground":"text-muted-foreground hover:bg-white/[0.035] hover:text-foreground")}><Icon className={cn("size-3.5",item.pro?"text-gold":"text-violet")}/><span className="truncate">{item.title}</span>{item.pro&&<span className="ml-auto rounded-full border border-gold/25 bg-gold/10 px-1.5 py-0.5 text-[9px] font-bold text-gold">PRO</span>}</Link>})}</div>}
            </div>

            {sidebarLink("/business",t.nav.business,WalletCards)}
            {sidebarLink("/pricing",t.nav.pricing,Rocket)}
            {sidebarLink("/contact",t.nav.contact,UserRound)}
          </nav>

          <div className="relative mt-4 space-y-2 border-t border-white/8 pt-4">
            <LanguageSwitcher className="w-full" />
            {!sessionPending&&(session?.user?<div className="grid grid-cols-2 gap-2"><Link href="/account" className={cn(buttonVariants({variant:"outline",size:"sm"}),"gap-2")}><UserRound className="size-3.5" />{t.nav.account}</Link><button type="button" disabled={loggingOut} onClick={()=>void logout()} className={cn(buttonVariants({variant:"outline",size:"sm"}),"gap-2 text-muted-foreground disabled:opacity-60")}><LogOut className="size-3.5" />{t.nav.logout}</button></div>:<Link href="/login" className={cn(buttonVariants({variant:"outline",size:"sm"}),"w-full")}>{t.nav.login}</Link>)}
            <Link href={session?.user?"/command-center":"/get-started"} className={cn(buttonVariants({size:"sm"}),"w-full border border-gold/20 bg-gold text-gold-foreground shadow-[0_14px_34px_-22px_rgba(250,204,21,.75)] hover:bg-gold/90")}>{session?.user?t.nav.openWorkspace:t.nav.getStarted}</Link>
          </div>
        </div>
      </aside>

      <header className="hegeva-topbar sticky top-0 z-50 border-b border-border/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/65 lg:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <HegevaLogo priority />
          <div className="flex items-center gap-2"><LanguageSwitcher className="hidden sm:block" /><button type="button" onClick={()=>setMobileOpen(v=>!v)} aria-label={aria.menu} aria-expanded={mobileOpen} className="inline-flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-foreground shadow-[0_0_24px_-16px_var(--primary)] transition-all hover:border-primary/40 hover:bg-primary/12">{mobileOpen?<X className="size-4"/>:<Menu className="size-4"/>}</button></div>
        </div>

        {mobileOpen&&<div className="relative max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-white/8 bg-background/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl">
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
    </>
  )
}
