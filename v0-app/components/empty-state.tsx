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
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/30 px-6 py-8 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/8 text-primary">
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
