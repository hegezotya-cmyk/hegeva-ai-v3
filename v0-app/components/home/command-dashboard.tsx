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

export function CommandDashboard() {
  const { t } = useI18n()

  const metrics: { icon: LucideIcon; label: string }[] = [
    { icon: Users, label: t.dashboard.customers },
    { icon: CheckSquare, label: t.dashboard.followups },
    { icon: FileText, label: t.dashboard.documents },
    { icon: Receipt, label: t.dashboard.expenses },
  ]

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-4 top-8 h-48 rounded-[2.5rem] bg-gradient-to-r from-primary/10 via-cyan/7 to-violet/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-background/20 p-5 shadow-[0_35px_120px_-70px_rgba(34,211,238,.55)] backdrop-blur-sm sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(16,185,129,.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,.11),transparent_26%),radial-gradient(circle_at_66%_82%,rgba(139,92,246,.09),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative">
          <SectionHeading eyebrow="Command intelligence" title={t.dashboard.heading} description={t.dashboard.subheading} action={<Link href="/get-started" className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 bg-gold text-gold-foreground shadow-[0_10px_35px_-16px_rgba(250,204,21,.8)] hover:bg-gold/90")}>
            <Link2 className="size-4" aria-hidden />
            {t.dashboard.connect}
          </Link>} />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ icon: Icon, label }, index) => <MetricCard key={label} label={label} value={<span className="text-foreground/40">—</span>} detail={t.dashboard.emptyBody} icon={Icon} tone={index===0?"emerald":index===1?"cyan":index===2?"violet":"gold"} />)}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <IntelligenceCard tone="emerald" interactive className="p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_28px_-10px_rgba(16,185,129,.8)]"><CheckSquare className="size-4" aria-hidden /></span>
                <h3 className="text-sm font-semibold text-foreground">{t.dashboard.priorities}</h3>
              </div>
              <EmptyState icon={CheckSquare} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} action={<Link href="/get-started" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>{t.dashboard.connect}</Link>} />
            </IntelligenceCard>

            <IntelligenceCard tone="cyan" interactive className="p-5">
              <div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl border border-cyan/25 bg-cyan/10 text-cyan"><Activity className="size-4" aria-hidden /></span><h3 className="text-sm font-semibold text-foreground">{t.dashboard.activity}</h3></div>
              <EmptyState icon={Activity} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
            </IntelligenceCard>

            <IntelligenceCard tone="violet" interactive className="p-5">
              <div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl border border-violet/25 bg-violet/10 text-violet"><CircuitBoard className="size-4" aria-hidden /></span><h3 className="text-sm font-semibold text-foreground">{t.dashboard.aiUsage}</h3></div>
              <EmptyState icon={CircuitBoard} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
            </IntelligenceCard>

            <IntelligenceCard tone="gold" interactive className="p-5">
              <div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold"><FolderGit2 className="size-4" aria-hidden /></span><h3 className="text-sm font-semibold text-foreground">{t.dashboard.studioProjects}</h3></div>
              <EmptyState icon={FolderGit2} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
            </IntelligenceCard>

            <IntelligenceCard tone="cyan" interactive className="p-5">
              <div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl border border-cyan/25 bg-cyan/10 text-cyan"><FolderGit2 className="size-4" aria-hidden /></span><h3 className="text-sm font-semibold text-foreground">{t.dashboard.projects}</h3></div>
              <EmptyState icon={FolderGit2} title={t.dashboard.emptyTitle} body={t.dashboard.emptyBody} />
            </IntelligenceCard>
          </div>
        </div>
      </div>
    </section>
  )
}
