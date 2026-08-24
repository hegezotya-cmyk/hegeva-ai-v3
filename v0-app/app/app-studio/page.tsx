"use client"

import Link from "next/link"
import { ArrowRight, Hammer, Rocket, Sparkles, Wrench } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StudioModuleCard } from "@/components/app-studio/module-card"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

const x20Copy = {
  en: ["Build My App X20", "Pro beta: verified app builds, resumable project state and one-click AI improvement passes."],
  hu: ["Build My App X20", "Pro béta: ellenőrzött appépítés, folytatható projektállapot és egykattintásos AI-fejlesztések."],
  de: ["Build My App X20", "Pro-Beta: geprüfte App-Builds, fortsetzbarer Projektstatus und KI-Verbesserungen mit einem Klick."],
  fr: ["Build My App X20", "Bêta Pro : builds vérifiés, projet reprenable et améliorations IA en un clic."],
  es: ["Build My App X20", "Beta Pro: builds verificados, proyecto reanudable y mejoras de IA con un clic."],
} as const

export default function AppStudioPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AppStudioHubHeader />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StudioModuleCard
            icon={Sparkles}
            moduleKey="prompt"
            href="/app-studio/prompt-my-app"
            status="beta"
            accent="emerald"
          />
          <StudioModuleCard
            icon={Hammer}
            moduleKey="build"
            href="/app-studio/build-my-app"
            status="beta"
            accent="cyan"
          />
          <X20Card />
          <StudioModuleCard
            icon={Wrench}
            moduleKey="fix"
            href="/app-studio/fix-my-app"
            status="beta"
            accent="gold"
          />
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
    <Link href="/app-studio/build-my-app-x20" className="glass-panel glass-panel-hover group relative flex flex-col gap-4 overflow-hidden rounded-3xl border-primary/35 p-6 ring-1 ring-primary/15">
      <div className="flex items-center justify-between">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <Rocket className="size-6" aria-hidden />
        </span>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">PRO · BETA</span>
      </div>
      <div className="flex-1">
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
        {c.open}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}

function AppStudioHubHeader() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  return (
    <PageHeader
      eyebrow="HEGEVA App Studio"
      title={c.hubTitle}
      subtitle={c.hubSub}
      action={
        <Link
          href="/app-studio/prompt-my-app"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 glow-emerald"
        >
          {c.start}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    />
  )
}
