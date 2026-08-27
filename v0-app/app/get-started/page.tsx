"use client"

import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, LayoutDashboard, Sparkles } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { AICore, IntelligenceCard, SignalIcon } from "@/components/visual-engine"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

export default function GetStartedPage() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  const cards = [
    { href: "/command-center", title: c.cc, body: c.ccBody, icon: LayoutDashboard, tone: "emerald" as const },
    { href: "/app-studio", title: c.studio, body: c.studioBody, icon: Sparkles, tone: "violet" as const },
    { href: "/business", title: c.business, body: c.businessBody, icon: BriefcaseBusiness, tone: "cyan" as const },
  ]

  return (
    <AppShell>
      <main className="relative mx-auto flex min-h-[74vh] max-w-6xl flex-col justify-center overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-12 size-72 rounded-full bg-violet/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-5 flex items-center gap-4">
            <AICore state="active" />
            <div>
              <p className="ve-eyebrow mb-1">HEGEVA AI · START HERE</p>
              <p className="text-xs text-muted-foreground">Choose your workspace path</p>
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06]">
            <span className="text-gradient-emerald">{c.getTitle}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{c.getSub}</p>
        </div>

        <div className="relative z-10 mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="group block">
              <IntelligenceCard tone={card.tone} interactive className="h-full p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <SignalIcon icon={card.icon} tone={card.tone} className="size-11 rounded-2xl" />
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" aria-hidden />
                </div>
                <h2 className="mt-6 font-display text-xl font-semibold text-foreground">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
                <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-foreground/55">Open workspace</p>
              </IntelligenceCard>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  )
}
