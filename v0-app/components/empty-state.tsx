import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Premium empty state. HEGEVA shows this instead of fabricating data.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "ve-panel relative flex min-h-56 flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.045] blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/10" aria-hidden />
      <span className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full border border-violet/10" aria-hidden />

      {Icon && (
        <span className="ve-signal relative z-[1] flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-[linear-gradient(145deg,rgba(16,185,129,.16),rgba(34,211,238,.06))] text-primary shadow-[0_0_30px_-10px_rgba(16,185,129,.55)]">
          <Icon className="size-5" aria-hidden />
        </span>
      )}

      <div className="relative z-[1] space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {body && <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground text-pretty">{body}</p>}
      </div>
      {action && <div className="relative z-[1] pt-1">{action}</div>}
    </div>
  )
}
