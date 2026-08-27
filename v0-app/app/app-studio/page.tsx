"use client"

import Link from "next/link"
import { ArrowRight, Hammer, Rocket, Sparkles, Wrench } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { AICore, IntelligenceCard, SignalIcon } from "@/components/visual-engine"
import { StudioModuleCard } from "@/components/app-studio/module-card"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

const x20Copy = {
  en: ["Build My App X20", "Pro app builder with verified builds, resumable project state and one-click AI improvement passes."],
  hu: ["Build My App X20", "Pro appépítő ellenőrzött buildekkel, folytatható projektállapottal és egykattintásos AI-fejlesztésekkel."],
  de: ["Build My App X20", "Pro-App-Builder mit geprüften Builds, fortsetzbarem Projektstatus und KI-Verbesserungen mit einem Klick."],
  fr: ["Build My App X20", "Builder Pro avec builds vérifiés, projet reprenable et améliorations IA en un clic."],
  es: ["Build My App X20", "Builder Pro con builds verificados, proyecto reanudable y mejoras de IA con un clic."],
} as const

export default function AppStudioPage() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  return (
    <AppShell>
      <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-1/4 top-10 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-44 size-72 rounded-full bg-violet/10 blur-3xl" />

        <IntelligenceCard tone="violet" className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute right-6 top-6 opacity-80"><AICore state="active" /></div>
          <div className="max-w-3xl pr-20">
            <p className="ve-eyebrow">HEGEVA App Studio · creation intelligence</p>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl">{c.hubTitle}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{c.hubSub}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app-studio/prompt-my-app" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_32px_-14px_var(--primary)] transition hover:-translate-y-0.5 hover:bg-primary/90">
              <Sparkles className="size-4" aria-hidden /> {c.start}<ArrowRight className="size-4" aria-hidden />
            </Link>
            <span className="inline-flex items-center rounded-xl border border-white/10 bg-background/25 px-4 py-3 text-xs font-medium text-muted-foreground">Prompt · Build · X20 · Fix</span>
          </div>
        </IntelligenceCard>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StudioModuleCard icon={Sparkles} moduleKey="prompt" href="/app-studio/prompt-my-app" accent="emerald" />
          <StudioModuleCard icon={Hammer} moduleKey="build" href="/app-studio/build-my-app" accent="cyan" />
          <X20Card />
          <StudioModuleCard icon={Wrench} moduleKey="fix" href="/app-studio/fix-my-app" accent="gold" />
        </div>
      </div>
    </AppShell>
  )
}

function X20Card() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  const [title, desc] = x20Copy[locale]
  return (
    <Link href="/app-studio/build-my-app-x20" className="group rounded-[1.75rem] focus-visible:outline-none">
      <IntelligenceCard tone="violet" interactive className="flex min-h-64 h-full flex-col gap-5 p-6 sm:p-7 ring-1 ring-violet/15">
        <div className="flex items-center justify-between gap-3">
          <SignalIcon icon={Rocket} tone="violet" className="size-14 rounded-2xl" />
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-gold">PRO</span>
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">{title}</h2>
          <p className="mt-2.5 text-sm leading-6 text-muted-foreground text-pretty">{desc}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors group-hover:text-foreground">{c.open}<span className="flex size-7 items-center justify-center rounded-full border border-violet/20 bg-violet/5"><ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span></span>
      </IntelligenceCard>
    </Link>
  )
}
