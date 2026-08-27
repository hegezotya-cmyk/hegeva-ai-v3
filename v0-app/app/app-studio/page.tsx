"use client"

import Link from "next/link"
import { Activity, ArrowRight, Braces, Cpu, Hammer, Rocket, ShieldCheck, Sparkles, WandSparkles, Wrench } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { AICore, IntelligenceCard, LiveStatus, SignalIcon } from "@/components/visual-engine"
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
      <div className="relative mx-auto max-w-[1500px] overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-[18%] top-0 size-80 rounded-full bg-primary/9 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-36 size-80 rounded-full bg-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 left-[55%] size-72 rounded-full bg-cyan/7 blur-3xl" />

        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <IntelligenceCard tone="violet" className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute right-[-8%] top-[-22%] size-80 rounded-full border border-violet/10 shadow-[0_0_90px_rgba(139,92,246,.08)]" aria-hidden />
            <div className="pointer-events-none absolute right-[7%] top-[12%] size-48 rounded-full border border-cyan/[0.08]" aria-hidden />
            <div className="absolute right-6 top-6 opacity-90"><AICore state="active" /></div>
            <div className="max-w-3xl pr-20">
              <p className="ve-eyebrow">HEGEVA App Studio · creation intelligence</p>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl lg:text-5xl">{c.hubTitle}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{c.hubSub}</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/app-studio/prompt-my-app" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_32px_-14px_var(--primary)] transition hover:-translate-y-0.5 hover:bg-primary/90">
                <Sparkles className="size-4" aria-hidden /> {c.start}<ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/app-studio/build-my-app-x20" className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/8 px-4 py-3 text-xs font-semibold text-gold transition hover:border-gold/40 hover:bg-gold/12"><Rocket className="size-4" />X20 Pro Builder</Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary/18 bg-primary/5 p-4"><LiveStatus label="Builder core" detail="Ready" tone="emerald" /></div>
              <div className="rounded-2xl border border-cyan/18 bg-cyan/5 p-4"><LiveStatus label="Project state" detail="Resumable" tone="cyan" /></div>
              <div className="rounded-2xl border border-violet/18 bg-violet/5 p-4"><LiveStatus label="AI passes" detail="Available" tone="violet" /></div>
            </div>
          </IntelligenceCard>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start" aria-label="App Studio intelligence rail">
            <IntelligenceCard tone="cyan" className="p-5">
              <div className="flex items-center gap-3"><SignalIcon icon={Cpu} tone="cyan" className="size-10 rounded-xl" /><div><p className="ve-eyebrow mb-0">Studio core</p><p className="text-sm font-semibold">Creation systems</p></div></div>
              <div className="mt-4 space-y-2">
                <LiveStatus label="Prompt engine" detail="Ready" tone="emerald" />
                <LiveStatus label="Build pipeline" detail="Connected" tone="cyan" />
                <LiveStatus label="Validation" detail="Protected" tone="violet" />
              </div>
            </IntelligenceCard>
            <IntelligenceCard tone="violet" className="p-5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-violet">Builder stack</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/8 bg-background/30 p-3"><Braces className="size-4 text-cyan"/><p className="mt-2 text-xs font-semibold">Code aware</p><p className="mt-1 text-[10px] text-muted-foreground">Structured project flow</p></div>
                <div className="rounded-xl border border-white/8 bg-background/30 p-3"><WandSparkles className="size-4 text-violet"/><p className="mt-2 text-xs font-semibold">AI refine</p><p className="mt-1 text-[10px] text-muted-foreground">Guided improvement passes</p></div>
                <div className="rounded-xl border border-white/8 bg-background/30 p-3"><ShieldCheck className="size-4 text-primary"/><p className="mt-2 text-xs font-semibold">Verified</p><p className="mt-1 text-[10px] text-muted-foreground">Build checks before deploy</p></div>
                <div className="rounded-xl border border-white/8 bg-background/30 p-3"><Activity className="size-4 text-gold"/><p className="mt-2 text-xs font-semibold">Live state</p><p className="mt-1 text-[10px] text-muted-foreground">Resume where you left off</p></div>
              </div>
            </IntelligenceCard>
          </aside>
        </div>

        <div className="relative z-10 mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
