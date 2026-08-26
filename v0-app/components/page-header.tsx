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
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,.035),transparent_38%),radial-gradient(circle_at_86%_18%,rgba(34,211,238,.08),transparent_30%),radial-gradient(circle_at_8%_88%,rgba(16,185,129,.08),transparent_34%)] px-5 py-6 shadow-[0_24px_70px_-44px_rgba(0,0,0,.95)] sm:px-7 sm:py-8",
        className,
      )}
    >
      <span className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full border border-cyan/10" aria-hidden />
      <span className="pointer-events-none absolute -right-1 top-2 size-24 rounded-full border border-violet/10" aria-hidden />
      <span className="pointer-events-none absolute right-10 top-8 size-2 rounded-full bg-cyan/70 shadow-[0_0_24px_rgba(34,211,238,.55)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent" aria-hidden />

      <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="ve-eyebrow">{eyebrow}</p>}
          <h1 className="font-display text-3xl font-semibold leading-[1.06] tracking-[-0.045em] text-foreground text-balance sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground text-pretty sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <span className="absolute bottom-0 left-6 h-px w-28 bg-gradient-to-r from-primary via-cyan to-transparent" aria-hidden />
    </div>
  )
}
