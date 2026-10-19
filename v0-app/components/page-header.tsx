import { cn } from "@/lib/utils"

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative flex flex-col gap-5 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="ve-eyebrow">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-foreground text-balance sm:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground text-pretty sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      <span className="absolute -bottom-px left-0 h-px w-24 bg-gradient-to-r from-primary via-cyan to-transparent" aria-hidden />
    </div>
  )
}
