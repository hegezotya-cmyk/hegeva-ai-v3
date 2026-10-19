import type { LucideIcon } from "lucide-react"
import { Activity, BrainCircuit, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "emerald" | "cyan" | "violet" | "gold" | "neutral"
export type AICoreState = "ready" | "understanding" | "planning" | "working" | "checking" | "repairing" | "completed" | "warning" | "failed"

const toneStyles: Record<Tone, string> = {
  emerald: "border-primary/25 bg-primary/10 text-primary",
  cyan: "border-cyan/25 bg-cyan/10 text-cyan",
  violet: "border-violet/25 bg-violet/10 text-violet",
  gold: "border-gold/25 bg-gold/10 text-gold",
  neutral: "border-border bg-secondary/60 text-muted-foreground",
}

export function SignalIcon({ icon: Icon, tone = "emerald", className }: { icon: LucideIcon; tone?: Tone; className?: string }) {
  return <span className={cn("ve-signal flex size-11 shrink-0 items-center justify-center rounded-2xl border", toneStyles[tone], className)}><Icon className="size-5" aria-hidden /></span>
}

export function IntelligenceCard({ children, tone = "neutral", interactive = false, className }: { children: React.ReactNode; tone?: Tone; interactive?: boolean; className?: string }) {
  return <div className={cn("ve-panel relative overflow-hidden rounded-3xl", interactive && "ve-panel-interactive", tone !== "neutral" && `ve-tone-${tone}`, className)}>{children}</div>
}

export function SectionHeading({ eyebrow, title, description, action, className }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}><div className="min-w-0 max-w-2xl">{eyebrow && <p className="ve-eyebrow">{eyebrow}</p>}<h2 className="font-display text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">{title}</h2>{description && <p className="mt-1.5 text-sm leading-6 text-muted-foreground text-pretty">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>
}

export function MetricCard({ label, value, detail, icon, tone = "neutral", className }: { label: string; value: React.ReactNode; detail?: string; icon?: LucideIcon; tone?: Tone; className?: string }) {
  const Icon = icon
  return <IntelligenceCard tone={tone} className={cn("p-4 sm:p-5", className)}><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>{Icon && <Icon className={cn("size-4", toneStyles[tone].split(" ").at(-1))} aria-hidden />}</div><div className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">{value}</div>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</IntelligenceCard>
}

export function AICore({ state = "ready", label = "HEGEVA intelligence core", className }: { state?: AICoreState | "thinking" | "active"; label?: string; className?: string }) {
  const normalized:AICoreState=state==="thinking"?"working":state==="active"?"ready":state
  return <div className={cn("ve-core", `ve-core-${normalized}`, className)} role="img" aria-label={`${label}: ${normalized}`}><span className="ve-core-orbit" aria-hidden /><span className="ve-core-center" aria-hidden>{["understanding","planning","working","checking","repairing"].includes(normalized) ? <Sparkles className="size-5" /> : <BrainCircuit className="size-5" />}</span></div>
}

export function LiveStatus({ label, detail, tone = "emerald", active = true, className }: { label: string; detail?: string; tone?: Tone; active?: boolean; className?: string }) {
  return <div className={cn("flex items-center gap-3", className)}><span className={cn("relative flex size-2.5", active && "ve-pulse")}><span className={cn("absolute inline-flex size-full rounded-full opacity-40", toneStyles[tone].split(" ").at(-1)?.replace("text-", "bg-"))} /><span className={cn("relative inline-flex size-2.5 rounded-full", toneStyles[tone].split(" ").at(-1)?.replace("text-", "bg-"))} /></span><div><p className="text-sm font-semibold text-foreground">{label}</p>{detail && <p className="text-xs text-muted-foreground">{detail}</p>}</div></div>
}

export function BuildProgress({ steps, current, label = "Build progress" }: { steps: readonly string[]; current: number; label?: string }) {
  return <div aria-label={label}><div className="flex items-center gap-1.5" aria-hidden>{steps.map((step, index) => <span key={step} className={cn("h-1.5 flex-1 rounded-full transition-colors", index <= current ? "bg-primary" : "bg-secondary")} />)}</div><div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Activity className="size-3.5 text-primary" aria-hidden /><span>{steps[Math.min(Math.max(current, 0), steps.length - 1)]}</span><span className="ml-auto tabular-nums">{Math.round(((current + 1) / steps.length) * 100)}%</span></div></div>
}

export function SkeletonSurface({ lines = 3, className }: { lines?: number; className?: string }) {
  return <div className={cn("ve-panel animate-pulse space-y-3 rounded-3xl p-6", className)} role="status" aria-label="Loading"><span className="block h-5 w-2/5 rounded-full bg-secondary" />{Array.from({ length: lines }, (_, index) => <span key={index} className="block h-3 rounded-full bg-secondary" style={{ width: `${88 - index * 11}%` }} />)}<span className="sr-only">Loading</span></div>
}
