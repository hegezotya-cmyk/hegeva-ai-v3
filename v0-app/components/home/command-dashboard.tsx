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
import { IntelligenceCard, MetricCard, SectionHeading } from "@/components/visual-engine"

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
      <SectionHeading eyebrow="Command intelligence" title={t.dashboard.heading} description={t.dashboard.subheading} action={<Link href="/get-started" className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 bg-gold text-gold-foreground hover:bg-gold/90")}>
          <Link2 className="size-4" aria-hidden />
          {t.dashboard.connect}
        </Link>} />

      {/* Metric tiles — honest placeholders */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ icon: Icon, label }, index) => <MetricCard key={label} label={label} value={<span className="text-foreground/40">—</span>} detail={t.dashboard.emptyBody} icon={Icon} tone={index===1?"cyan":index===2?"violet":"neutral"} />)}
      </div>

      {/* Module panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <IntelligenceCard className="p-5 lg:col-span-2">
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
        </IntelligenceCard>

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
