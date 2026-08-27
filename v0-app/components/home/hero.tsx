"use client"

import Link from "next/link"
import { ArrowRight, MessageSquareText, Sparkles, Users, FileText, Receipt, FolderGit2, Bot, Zap, Layers3 } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AICore } from "@/components/visual-engine"

const honestHero = {
  en: { subtitle: "One connected workspace for AI assistance, customers, documents, expenses, planning, reports and app planning — built around the features HEGEVA has working today.", pills: ["AI Assistant", "CRM", "Business Tools", "App Studio"], routes: ["AI Assistant", "Customers", "Documents", "Expenses", "App Studio", "Command Center", "X30 preview"], open: "Open workspace", directory: "Workspace routes", choose: "Choose a destination", navigation: "Navigation", available: "Available routes", visual: "HEGEVA visual motif" },
  hu: { subtitle: "Egy összekapcsolt munkaterület AI-segítséghez, ügyfelekhez, dokumentumokhoz, kiadásokhoz, tervezéshez, jelentésekhez és alkalmazástervezéshez — a HEGEVA ma működő funkcióira építve.", pills: ["AI Asszisztens", "CRM", "Üzleti eszközök", "App Stúdió"], routes: ["AI Asszisztens", "Ügyfelek", "Dokumentumok", "Kiadások", "App Stúdió", "Parancsközpont", "X30 előnézet"], open: "Munkaterület megnyitása", directory: "Munkaterületi útvonalak", choose: "Válassz céloldalt", navigation: "Navigáció", available: "Elérhető útvonalak", visual: "HEGEVA vizuális motívum" },
  de: { subtitle: "Ein verbundener Arbeitsbereich für KI-Unterstützung, Kunden, Dokumente, Ausgaben, Planung, Berichte und App-Planung — auf den heute funktionierenden HEGEVA-Funktionen aufgebaut.", pills: ["KI-Assistent", "CRM", "Business-Tools", "App Studio"], routes: ["KI-Assistent", "Kunden", "Dokumente", "Ausgaben", "App Studio", "Command Center", "X30-Vorschau"], open: "Arbeitsbereich öffnen", directory: "Arbeitsbereich-Routen", choose: "Ziel auswählen", navigation: "Navigation", available: "Verfügbare Routen", visual: "HEGEVA Bildmotiv" },
  fr: { subtitle: "Un espace connecté pour l’assistance IA, les clients, documents, dépenses, la planification, les rapports et la conception d’applications — basé sur les fonctions HEGEVA déjà opérationnelles.", pills: ["Assistant IA", "CRM", "Outils pro", "App Studio"], routes: ["Assistant IA", "Clients", "Documents", "Dépenses", "App Studio", "Centre de commande", "Aperçu X30"], open: "Ouvrir l’espace", directory: "Accès à l’espace", choose: "Choisissez une destination", navigation: "Navigation", available: "Accès disponibles", visual: "Motif visuel HEGEVA" },
  es: { subtitle: "Un espacio conectado para asistencia con IA, clientes, documentos, gastos, planificación, informes y diseño de apps — basado en las funciones de HEGEVA que ya están operativas.", pills: ["Asistente IA", "CRM", "Herramientas", "App Studio"], routes: ["Asistente IA", "Clientes", "Documentos", "Gastos", "App Studio", "Centro de mando", "Vista previa X30"], open: "Abrir espacio", directory: "Rutas del espacio", choose: "Elige un destino", navigation: "Navegación", available: "Rutas disponibles", visual: "Motivo visual HEGEVA" },
} as const

export function Hero() {
  const { t, locale } = useI18n()
  const copy = honestHero[locale]

  const launchers = [
    { href: "/assistant", icon: Bot, label: copy.routes[0], tone: "text-primary border-primary/20 bg-primary/[0.06]" },
    { href: "/business/customers", icon: Users, label: copy.routes[1], tone: "text-cyan border-cyan/20 bg-cyan/[0.06]" },
    { href: "/business/documents", icon: FileText, label: copy.routes[2], tone: "text-violet border-violet/20 bg-violet/[0.06]" },
    { href: "/business/expenses", icon: Receipt, label: copy.routes[3], tone: "text-gold border-gold/20 bg-gold/[0.06]" },
    { href: "/app-studio", icon: FolderGit2, label: copy.routes[4], tone: "text-primary border-primary/20 bg-primary/[0.06]" },
    { href: "/command-center", icon: Zap, label: copy.routes[5], tone: "text-cyan border-cyan/20 bg-cyan/[0.06]" },
    { href: "/app-studio/x30-alpha", icon: Layers3, label: copy.routes[6], tone: "text-violet border-violet/20 bg-violet/[0.06]" },
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

          <div className="relative flex items-center gap-3"><AICore state="ready" label={copy.visual} /><span className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/12 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_22px_rgba(16,185,129,.12)]"><Sparkles className="size-3.5" aria-hidden />{t.hero.badge}</span></div>

          <h1 className="relative mt-5 font-display text-4xl font-semibold leading-[1.01] tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl xl:text-[4.2rem]">
            <span className="block text-foreground">{t.hero.titleLine1}</span><span className="block text-gradient-emerald drop-shadow-[0_0_22px_rgba(16,185,129,.14)]">{t.hero.titleLine2}</span><span className="block text-foreground">{t.hero.titleLine3}</span>
          </h1>

          <p className="relative mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">{copy.subtitle}</p>

          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <Link href="/command-center" className={cn(buttonVariants({ size: "lg" }), "group h-11 gap-2 px-5 text-sm glow-emerald")}>{t.hero.ctaPrimary}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
            <Link href="/assistant" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2 border-white/10 bg-background/35 px-5 text-sm backdrop-blur-md")}><MessageSquareText className="size-4 text-primary" aria-hidden />{t.hero.ctaSecondary}</Link>
          </div>

          <ul className="relative mt-6 flex flex-wrap gap-2">{copy.pills.map((p) => <li key={p} className="rounded-xl border border-white/[0.08] bg-card/45 px-3 py-1.5 text-xs font-medium tracking-wide text-foreground/80 backdrop-blur-md">{p}</li>)}</ul>

        </div>

        <aside className="relative z-10 hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-background/34 p-5 shadow-[0_35px_120px_-55px_rgba(34,211,238,.55)] backdrop-blur-[16px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,.12),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(34,211,238,.11),transparent_25%),radial-gradient(circle_at_72%_82%,rgba(139,92,246,.09),transparent_28%)]" />
            <div className="relative flex items-center justify-between border-b border-white/[0.07] pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan">{copy.directory}</p><h2 className="mt-1 text-lg font-semibold text-foreground">{copy.choose}</h2></div><span className="rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 text-[11px] font-medium text-primary">{copy.navigation}</span></div>

            <div className="relative mt-4 grid grid-cols-2 gap-3">
              {launchers.map(({ href, icon: Icon, label, tone }) => <Link key={href} href={href} className={cn("group rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-background/55", tone)}><div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl border border-current/15 bg-background/30"><Icon className="size-4" aria-hidden /></span><ArrowRight className="size-3.5 opacity-45 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" aria-hidden /></div><p className="mt-3 text-xs font-semibold text-foreground">{label}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{copy.open}</p></Link>)}
            </div>

            <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/15 p-4"><p className="text-xs font-semibold text-foreground">{copy.available}</p><span className="font-mono text-sm font-semibold text-cyan">{launchers.length}</span></div>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8"><div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" /></div>
    </section>
  )
}
