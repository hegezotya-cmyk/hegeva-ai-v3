"use client"

import Link from "next/link"
import { ArrowRight, MessageSquareText, Sparkles, Cpu, Orbit, Activity } from "lucide-react"
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

  return (
    <section
      className="relative isolate min-h-[680px] overflow-hidden bg-cover bg-[70%_20%] sm:bg-[65%_20%] lg:bg-[center_18%]"
      style={{ backgroundImage: "url('/hegeva-hero-background.webp')" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,10,8,.99)_0%,rgba(2,10,8,.94)_31%,rgba(2,10,8,.54)_56%,rgba(2,10,8,.08)_80%)] max-lg:bg-[linear-gradient(90deg,rgba(2,10,8,.98)_0%,rgba(2,10,8,.9)_46%,rgba(2,10,8,.32)_100%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,.15),transparent_31%),radial-gradient(circle_at_78%_22%,rgba(34,211,238,.08),transparent_25%),radial-gradient(circle_at_72%_72%,rgba(250,204,21,.07),transparent_28%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-background via-background/55 to-transparent" aria-hidden />

      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <div className="absolute left-[5%] top-[18%] h-px w-[29%] bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_18px_rgba(16,185,129,.35)]" />
        <div className="absolute left-[11%] top-[18%] size-1.5 rounded-full bg-primary shadow-[0_0_16px_rgba(16,185,129,.8)]" />
        <div className="absolute bottom-[18%] left-[21%] h-px w-[32%] bg-gradient-to-r from-transparent via-cyan/35 to-transparent" />
        <div className="absolute left-[48%] top-[12%] h-[31rem] w-[31rem] rounded-full border border-primary/[0.08] shadow-[0_0_80px_rgba(16,185,129,.06)]" />
        <div className="absolute left-[51%] top-[17%] h-[24rem] w-[24rem] rounded-full border border-cyan/[0.06]" />
        <div className="absolute right-[7%] top-[20%] h-28 w-28 rotate-12 rounded-[28%] border border-gold/[0.09]" />
        <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1440 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="heroFlow" x1="0" x2="1"><stop offset="0" stopColor="rgb(16 185 129)" stopOpacity="0"/><stop offset=".5" stopColor="rgb(34 211 238)" stopOpacity=".32"/><stop offset="1" stopColor="rgb(250 204 21)" stopOpacity="0"/></linearGradient>
          </defs>
          <path d="M-80 560 C 230 430, 410 660, 700 510 S 1110 350, 1510 500" fill="none" stroke="url(#heroFlow)" strokeWidth="1" />
          <path d="M180 -40 C 330 180, 210 390, 470 610" fill="none" stroke="url(#heroFlow)" strokeWidth=".7" opacity=".55" />
        </svg>
      </div>

      <div className="mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative z-10 max-w-xl rounded-[2rem] border border-white/[0.07] bg-background/28 p-5 shadow-[0_24px_90px_rgba(0,0,0,.38)] backdrop-blur-[10px] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,rgba(16,185,129,.08),transparent_36%,rgba(34,211,238,.035)_68%,rgba(250,204,21,.045))]" aria-hidden />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent" aria-hidden />

          <div className="relative flex items-center gap-3">
            <AICore state="active" />
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/12 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_22px_rgba(16,185,129,.12)]"><Sparkles className="size-3.5" aria-hidden />{t.hero.badge}</span>
              <LiveStatus className="mt-2" label="HEGEVA Core" />
            </div>
          </div>

          <h1 className="relative mt-6 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-balance sm:text-5xl lg:text-7xl">
            <span className="block text-foreground">{t.hero.titleLine1}</span>
            <span className="block text-gradient-emerald drop-shadow-[0_0_22px_rgba(16,185,129,.14)]">{t.hero.titleLine2}</span>
            <span className="block text-foreground">{t.hero.titleLine3}</span>
          </h1>

          <p className="relative mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            {copy.subtitle}
          </p>

          <div className="relative mt-7 flex flex-wrap items-center gap-3">
            <Link href="/command-center" className={cn(buttonVariants({ size: "lg" }), "group h-11 gap-2 px-5 text-sm glow-emerald")}>
              {t.hero.ctaPrimary}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link href="/assistant" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2 border-white/10 bg-background/35 px-5 text-sm backdrop-blur-md")}>
              <MessageSquareText className="size-4 text-primary" aria-hidden />
              {t.hero.ctaSecondary}
            </Link>
          </div>

          <ul className="relative mt-7 flex flex-wrap gap-2">
            {copy.pills.map((p) => (
              <li key={p} className="rounded-xl border border-white/[0.08] bg-card/45 px-3 py-1.5 text-xs font-medium tracking-wide text-foreground/80 shadow-[inset_0_1px_0_rgba(255,255,255,.03)] backdrop-blur-md">
                {p}
              </li>
            ))}
          </ul>

          <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
            <div className="rounded-xl border border-primary/15 bg-primary/[0.045] px-3 py-2.5"><Cpu className="mb-1.5 size-4 text-primary" aria-hidden /><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">AI Core</p><p className="mt-0.5 text-xs font-medium text-foreground">Active</p></div>
            <div className="rounded-xl border border-cyan/15 bg-cyan/[0.04] px-3 py-2.5"><Orbit className="mb-1.5 size-4 text-cyan" aria-hidden /><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">Workspace</p><p className="mt-0.5 text-xs font-medium text-foreground">Connected</p></div>
            <div className="rounded-xl border border-gold/15 bg-gold/[0.04] px-3 py-2.5"><Activity className="mb-1.5 size-4 text-gold" aria-hidden /><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">System</p><p className="mt-0.5 text-xs font-medium text-foreground">Ready</p></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  )
}
