import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/provider"

export type FeatureStatus = "working" | "beta" | "coming" | "planned"

const styles: Record<FeatureStatus, string> = {
  working: "border-primary/40 bg-primary/12 text-primary",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium tracking-wide uppercase",
        styles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  )
}
