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
        "ve-panel flex flex-col items-center justify-center gap-3 rounded-2xl border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="ve-signal flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {body && <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground text-pretty">{body}</p>}
      </div>
      {action}
    </div>
  )
}
