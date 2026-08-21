"use client"

import Link from "next/link"
import {
  Activity,
  CheckSquare,
  CircuitBoard,
  FileText,
  FolderGit2,
  Link2,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { EmptyState } from "@/components/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Honest command dashboard preview.
 * There is no connected workspace yet, so every module shows a premium empty state.
 * No customers, revenue, expenses, or usage figures are invented.
 */
export function CommandDashboard() {
  const { t } = useI18n()

  // Metric tiles read "—" until a real workspace is linked. Never a fake number.
  const metrics: { icon: LucideIcon; label: string }[] = [
    { icon: Users, label: t.dashboard.customers },
    { icon: CheckSquare, label: t.dashboard.followups },
    { icon: FileText, label: t.dashboard.documents },
    { icon: Receipt, label: t.dashboard.expenses },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
            {t.dashboard.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{t.dashboard.subheading}</p>
        </div>
        <Link href="/get-started" className={cn(buttonVariants({ size: "lg" }), "h-10 gap-2 self-start bg-gold text-gold-foreground hover:bg-gold/90 sm:self-auto")}>
          <Link2 className="size-4" aria-hidden />
          {t.dashboard.connect}
        </Link>
      </div>

      {/* Metric tiles — honest placeholders */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ icon: Icon, label }) => (
          <div key={label} className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
              <Icon className="size-4 text-primary/70" aria-hidden />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold tabular-nums text-foreground/40">—</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t.dashboard.emptyBody}</p>
          </div>
        ))}
      </div>

      {/* Module panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <CheckSquare className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">{t.dashboard.priorities}</h3>
          </div>
          <EmptyState
            icon={CheckSquare}
            title={t.dashboard.emptyTitle}
            body={t.dashboard.emptyBody}
            action={
              <Link href="/get-started" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                {t.dashboard.connect}
              </Link>
            }
          />
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">{t.dashboard.activity}</h3>
          </div>
          <EmptyState icon={Activity} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <CircuitBoard className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">{t.dashboard.aiUsage}</h3>
          </div>
          <EmptyState icon={CircuitBoard} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <FolderGit2 className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">{t.dashboard.studioProjects}</h3>
          </div>
          <EmptyState icon={FolderGit2} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <FolderGit2 className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">{t.dashboard.projects}</h3>
          </div>
          <EmptyState icon={FolderGit2} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
        </div>
      </div>
    </section>
  )
}
