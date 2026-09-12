"use client"

import { useState } from "react"
import { Check, ChevronRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

export type FlowStep = {
  key: string
  title: string
  description: string
}

/**
 * StepFlow — a guided, honest walkthrough for App Studio modules.
 * It structures the process (Build / Fix) without pretending the work
 * actually executed. Steps are navigable so the user can preview the flow.
 */
export function StepFlow({
  steps,
  status = "beta",
  note,
  onFinish,
  finishLabel,
}: {
  steps: FlowStep[]
  status?: FeatureStatus
  note: string
  onFinish?: () => void
  finishLabel?: string
}) {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  const [active, setActive] = useState(0)
  const isLast = active === steps.length - 1

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <ol className="glass-panel h-fit rounded-2xl p-3">
        {steps.map((step, i) => {
          const isActive = i === active
          const isDone = i < active
          return (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  isActive ? "bg-primary/10" : "hover:bg-secondary/60",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "border border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>{c.step} {active + 1}</span>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-foreground">{steps[active].title}</span>
          </div>
          <StatusBadge status={status} />
        </div>

        <h2 className="mt-4 text-xl font-semibold text-foreground text-balance">{steps[active].title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
          {steps[active].description}
        </p>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-cyan/25 bg-cyan/8 p-3">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-cyan" aria-hidden />
          <p className="text-xs leading-relaxed text-foreground/75 text-pretty">{note}</p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <button
            type="button"
            onClick={() => setActive((a) => Math.max(0, a - 1))}
            disabled={active === 0}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {c.back}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) {
                onFinish?.()
                return
              }
              setActive((a) => Math.min(steps.length - 1, a + 1))
            }}
            disabled={isLast && !onFinish}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLast && onFinish ? finishLabel || c.next : c.next}
            {!isLast && <ChevronRight className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
    </div>
  )
}
