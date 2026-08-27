"use client"

import Link from "next/link"
import { ArrowRight, MessageSquareText, Sparkles, Cpu, Orbit, Activity, Users, FileText, Receipt, FolderGit2, Bot, Zap } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AICore, LiveStatus } from "@/components/visual-engine"

const honestHero = {
  en: { subtitle: "One connected workspace for AI assistance, customers, documents, expenses, planning, reports and app planning — built around the features HEGEVA has working today.", pills: ["AI Assistant", "CRM", "Business Tools", "App Studio"] },
  hu: { subtitle: "Egy összekapcsolt munkaterület AI-segítséghez, ügyfelekhez, dokumentumokhoz, kiadásokhoz, tervezéshez, jelentésekhez és alkalmazástervezéshez — a HEGEVA ma működő funkcióira építve.", pills: ["AI Asszisztens", "CRM", "Üzleti eszközök", "App Stúdió"] },
  de: { subtitle: "Ein verbundener Arbeitsbereich für KI-Unterstützung, Kunden, Dokumente, Ausgaben, Planung, Berichte und App-Planung — auf den heute funktionierenden HEGEVA-Funktionen aufgebaut.", pills: ["KI-Assistent", "CRM", "Business-Tools", "App Studio"] },
  fr: { subtitle: "Un espace connecté pour l’assistance IA, les clients, documents, dépenses, la planification, les rapports et la conception d’applications — basé sur les fonctions HEGEVA déjà opérationnelles.", pills: ["Assistant IA", "CRM", "Outils pro", "App Studio"] },
  es: { subtitle: "Un espacio conectado para asistencia con IA, clientes, documentos, gastos, planificación, informes y diseño de apps — basado en las funciones de HEGEVA que ya están operativas.", pills: ["Asistente IA", "CRM", "Herramientas", "App Studio"] },
} as const

export function Hero() {
  const { t, locale } = useI18n()
  const copy = honestHero[locale]

  const launchers = [
    { href: "/assistant", icon: Bot, label: "AI Assistant", tone: "text-primary border-primary/20 bg-primary/[0.06]" },
    { href: "/business/customers", icon: Users, label: "Customers", tone: "text-cyan border-cyan/20 bg-cyan/[0.06]" },
    { href: "/business/documents", icon: FileText, label: "Documents", tone: "text-violet border-violet/20 bg-violet/[0.06]" },
    { href: "/business/expenses", icon: Receipt, label: "Expenses", tone: "text-gold border-gold/20 bg-gold/[0.06]" },
    { href: "/app-studio", icon: FolderGit2, label: "App Studio", tone: "text-primary border-primary/20 bg-primary/[0.06]" },
    { href: "/command-center", icon: Zap, label: "Command Center", tone: "text-cyan border-cyan/20 bg-cyan/[0.06]" },
  ]

  return (
    <section className="relative isolate overflow-hidden bg-cover bg-[72%_18%] sm:bg-[68%_18%] lg:bg-[center_18%]" style={{ backgroundImage: "url('/hegeva-hero-background.webp')" }}>
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,10,8,.995)_0%,rgba(2,10,8,.965)_27%,rgba(2,10,8,.72)_49%,rgba(2,10,8,.28)_74%,rgba(2,10,8,.12)_100%)] max-lg:bg-[linear-gradient(90deg,rgba(2,10,8,.99)_0%,rgba(2,10,8,.92)_48%,rgba(2,10,8,.38)_100%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_28%,rgba(16,185,129,.17),transparent_27%),radial-gradient(circle_at_76%_21%,rgba(34,211,238,.1),transparent_22%),radial-gradient(circle_at_80%_72%,rgba(139,92,246,.08),transparent_27%),radial-gradient(circle_at_62%_80%,rgba(250,204,21,.06),transparent_24%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-background via-background/70 to-transparent" aria-hidden />

      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <div className="absolute left-[4%] top-[16%] h-px w-[25%] bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_18px_rgba(16,185,129,.35)]" />
        <div className="absolute right-[7%] top-[17%] h-px w-[24%] bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
        <div className="absolute left-[46%] top-[13%] h-[30rem] w-[30rem] rounded-full border border-primary/[0.07] shadow-[0_0_80px_rgba(16,185,129,.05)]" />
        <div className="absolute left-[50%] top-[18%] h-[22rem] w-[22rem] rounded-full border border-cyan/[0.055]" />
        <svg className="absolute inset-0 h-full w-full opacity-55" viewBox="0 0 1440 760" preserveAspectRatio="none">
          <defs><linearGradient id="heroFlow" x1="0" x2="1"><stop offset="0" stopColor="rgb(16 185 129)" stopOpacity="0"/><stop offset=".5" stopColor="rgb(34 211 238)" stopOpacity=".3"/><stop offset="1" stopColor="rgb(250 204 21)" stopOpacity="0"/></linearGradient></defs>
          <path d="M-80 530 C 230 410, 420 620, 710 485 S 1110 335, 1510 470" fill="none" stroke="url(#heroFlow)" strokeWidth="1" />
        </svg>
      </div>

      <div className="mx-auto grid min-h-[640px] max-w-[1500px] items-center gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.72fr)] lg:px-8 lg:py-12 xl:gap-10">
        <div className="relative z-10 max-w-2xl rounded-[1.8rem] border border-white/[0.07] bg-background/32 p-5 shadow-[0_28px_100px_rgba(0,0,0,.42)] backdrop-blur-[12px] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] bg-[linear-gradient(135deg,rgba(16,185,129,.09),transparent_34%,rgba(34,211,238,.035)_68%,rgba(250,204,21,.04))]" aria-hidden />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden />

          <div className="relative flex items-center gap-3"><AICore state="active" /><div><span className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/12 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_22px_rgba(16,185,129,.12)]"><Sparkles className="size-3.5" aria-hidden />{t.hero.badge}</span><LiveStatus className="mt-2" label="HEGEVA Core" /></div></div>

          <h1 className="relative mt-5 font-display text-4xl font-semibold leading-[1.01] tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl xl:text-[4.2rem]">
            <span className="block text-foreground">{t.hero.titleLine1}</span><span className="block text-gradient-emerald drop-shadow-[0_0_22px_rgba(16,185,129,.14)]">{t.hero.titleLine2}</span><span className="block text-foreground">{t.hero.titleLine3}</span>
          </h1>

          <p className="relative mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">{copy.subtitle}</p>

          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <Link href="/command-center" className={cn(buttonVariants({ size: "lg" }), "group h-11 gap-2 px-5 text-sm glow-emerald")}>{t.hero.ctaPrimary}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
            <Link href="/assistant" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2 border-white/10 bg-background/35 px-5 text-sm backdrop-blur-md")}><MessageSquareText className="size-4 text-primary" aria-hidden />{t.hero.ctaSecondary}</Link>
          </div>

          <ul className="relative mt-6 flex flex-wrap gap-2">{copy.pills.map((p) => <li key={p} className="rounded-xl border border-white/[0.08] bg-card/45 px-3 py-1.5 text-xs font-medium tracking-wide text-foreground/80 backdrop-blur-md">{p}</li>)}</ul>

          <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
            <div className="rounded-xl border border-primary/15 bg-primary/[0.045] px-3 py-2.5"><Cpu className="mb-1.5 size-4 text-primary" aria-hidden /><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">AI Core</p><p className="mt-0.5 text-xs font-medium text-foreground">Active</p></div>
            <div className="rounded-xl border border-cyan/15 bg-cyan/[0.04] px-3 py-2.5"><Orbit className="mb-1.5 size-4 text-cyan" aria-hidden /><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">Workspace</p><p className="mt-0.5 text-xs font-medium text-foreground">Connected</p></div>
            <div className="rounded-xl border border-gold/15 bg-gold/[0.04] px-3 py-2.5"><Activity className="mb-1.5 size-4 text-gold" aria-hidden /><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">System</p><p className="mt-0.5 text-xs font-medium text-foreground">Ready</p></div>
          </div>
        </div>

        <aside className="relative z-10 hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-background/34 p-5 shadow-[0_35px_120px_-55px_rgba(34,211,238,.55)] backdrop-blur-[16px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,.12),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(34,211,238,.11),transparent_25%),radial-gradient(circle_at_72%_82%,rgba(139,92,246,.09),transparent_28%)]" />
            <div className="relative flex items-center justify-between border-b border-white/[0.07] pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan">HEGEVA Workspace</p><h2 className="mt-1 text-lg font-semibold text-foreground">Live command surface</h2></div><span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 text-[11px] font-medium text-primary"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(16,185,129,.9)]" />Online</span></div>

            <div className="relative mt-4 grid grid-cols-2 gap-3">
              {launchers.map(({ href, icon: Icon, label, tone }) => <Link key={href} href={href} className={cn("group rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-background/55", tone)}><div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl border border-current/15 bg-background/30"><Icon className="size-4" aria-hidden /></span><ArrowRight className="size-3.5 opacity-45 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" aria-hidden /></div><p className="mt-3 text-xs font-semibold text-foreground">{label}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Open workspace</p></Link>)}
            </div>

            <div className="relative mt-4 rounded-2xl border border-white/[0.08] bg-black/15 p-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="size-4 text-cyan" aria-hidden /><p className="text-xs font-semibold text-foreground">System activity</p></div><span className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">Live</span></div>
              <div className="mt-3 space-y-2"><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-primary via-cyan to-violet" /></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2"><p className="text-[10px] text-muted-foreground">AI</p><p className="mt-0.5 text-xs font-semibold text-primary">Ready</p></div><div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2"><p className="text-[10px] text-muted-foreground">Cloud</p><p className="mt-0.5 text-xs font-semibold text-cyan">Synced</p></div><div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2"><p className="text-[10px] text-muted-foreground">Studio</p><p className="mt-0.5 text-xs font-semibold text-violet">Available</p></div></div></div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8"><div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" /></div>
    </section>
  )
}
