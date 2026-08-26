"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/provider"

export type FeatureStatus = "working" | "beta" | "coming" | "planned"

const styles: Record<FeatureStatus, string> = {
  working: "border-primary/35 bg-primary/10 text-primary",
  beta: "border-cyan/40 bg-cyan/12 text-cyan",
  coming: "border-gold/40 bg-gold/12 text-gold",
  planned: "border-border bg-muted/50 text-muted-foreground",
}

/**
 * Honest feature-status label. HEGEVA never presents an unfinished feature as "Working".
 */
export function StatusBadge({ status, className }: { status: FeatureStatus; className?: string }) {
  const { t } = useI18n()
  const label = t.status[status]
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold tracking-[0.1em] uppercase",
        styles[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-current", status === "working" && "shadow-[0_0_10px_currentColor]")} aria-hidden />
      {label}
    </span>
  )
}
