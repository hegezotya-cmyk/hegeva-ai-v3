"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

type Accent = "emerald" | "cyan" | "gold"

const accentRing: Record<Accent, string> = {
  emerald: "border-primary/30 bg-primary/12 text-primary shadow-[0_0_32px_-12px_rgba(80,220,160,.75)]",
  cyan: "border-cyan/30 bg-cyan/12 text-cyan shadow-[0_0_32px_-12px_rgba(80,210,255,.75)]",
  gold: "border-gold/30 bg-gold/12 text-gold shadow-[0_0_32px_-12px_rgba(245,190,90,.72)]",
}

const accentGlow: Record<Accent, string> = {
  emerald: "from-primary/18 via-primary/6 to-transparent",
  cyan: "from-cyan/18 via-cyan/6 to-transparent",
  gold: "from-gold/18 via-gold/6 to-transparent",
}

export function StudioModuleCard({
  icon: Icon,
  moduleKey,
  href,
  accent,
}: {
  icon: LucideIcon
  moduleKey: "prompt" | "build" | "fix"
  href: string
  accent: Accent
}) {
  const { t, locale } = useI18n()
  const c = getStudioCopy(locale)
  const title = t.studio[moduleKey]
  const desc = t.studio[`${moduleKey}Desc` as const]

  return (
    <Link
      href={href}
      className="glass-panel glass-panel-hover group relative flex min-h-64 flex-col gap-5 overflow-hidden rounded-[1.75rem] p-6 sm:p-7"
    >
      <span
        className={cn(
          "pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full bg-gradient-to-br blur-3xl transition-opacity duration-300 group-hover:opacity-100",
          accentGlow[accent],
        )}
        aria-hidden
      />
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 right-0 h-28 w-28 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.055),transparent_68%)]" aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <span className={cn("flex size-14 items-center justify-center rounded-2xl border backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]", accentRing[accent])}>
          <Icon className="size-6" aria-hidden />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="size-3 text-primary" aria-hidden /> HEGEVA
        </span>
      </div>

      <div className="relative flex-1">
        <h2 className="font-display text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">{title}</h2>
        <p className="mt-2.5 max-w-md text-sm leading-6 text-muted-foreground text-pretty">{desc}</p>
      </div>

      <span className="relative inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors group-hover:text-foreground">
        <span>{c.open}</span>
        <span className="flex size-7 items-center justify-center rounded-full border border-white/8 bg-white/[0.035] transition-all group-hover:border-primary/25 group-hover:bg-primary/10">
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  )
}
