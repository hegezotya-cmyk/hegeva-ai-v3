"use client"

import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { cn } from "@/lib/utils"

type Accent = "emerald" | "cyan" | "gold"

const accentRing: Record<Accent, string> = {
  emerald: "border-primary/25 bg-primary/10 text-primary",
  cyan: "border-cyan/25 bg-cyan/10 text-cyan",
  gold: "border-gold/25 bg-gold/10 text-gold",
}

export function StudioModuleCard({
  icon: Icon,
  moduleKey,
  href,
  status,
  accent,
}: {
  icon: LucideIcon
  moduleKey: "prompt" | "build" | "fix"
  href: string
  status: FeatureStatus
  accent: Accent
}) {
  const { t } = useI18n()
  const title = t.studio[moduleKey]
  const desc = t.studio[`${moduleKey}Desc` as const]

  return (
    <Link href={href} className="glass-panel glass-panel-hover group relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <span className={cn("flex size-12 items-center justify-center rounded-2xl border", accentRing[accent])}>
          <Icon className="size-6" aria-hidden />
        </span>
        <StatusBadge status={status} />
      </div>

      <div className="flex-1">
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
      </div>

      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
        Open module
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}
