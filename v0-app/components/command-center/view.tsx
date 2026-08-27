"use client"

import Link from "next/link"
import {
  BarChart3,
  CalendarClock,
  FileText,
  FolderLock,
  Info,
  MessageSquareText,
  Receipt,
  Users,
  Wrench,
  FileSpreadsheet,
  Cloud,
  Bot,
  Blocks,
  Hammer,
  Sparkles,
  ArrowUpRight,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { PageHeader } from "@/components/page-header"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { WorkspaceOverview } from "@/components/command-center/workspace-overview"
import { COMMAND_OVERVIEW_COPY } from "@/lib/i18n/command-overview-copy"
import { AICore, IntelligenceCard, SectionHeading, SignalIcon } from "@/components/visual-engine"

type ModuleDef = {
  icon: LucideIcon
  title: string
  desc: string
  status: FeatureStatus
  href: string
}

const aiTones = ["violet", "cyan", "gold", "emerald"] as const
const businessTones = ["emerald", "cyan", "gold", "violet", "cyan", "emerald", "violet", "gold", "cyan"] as const

export function CommandCenterView() {
  const { t, locale } = useI18n()
  const copy = COMMAND_OVERVIEW_COPY[locale]
  const { data: session, isPending } = authClient.useSession()

  const modules: ModuleDef[] = [
    { icon: Users, title: t.capabilities.crm.title, desc: t.capabilities.crm.desc, status: "working", href: "/business/customers" },
    { icon: FileText, title: t.dashboard.documents, desc: t.capabilities.documents.desc, status: "working", href: "/business/documents" },
    { icon: FileSpreadsheet, title: t.capabilities.invoices.title, desc: t.capabilities.invoices.desc, status: "working", href: "/business/invoices" },
    { icon: Receipt, title: t.dashboard.expenses, desc: t.commandCenter.expensesDesc, status: "working", href: "/business/expenses" },
    { icon: CalendarClock, title: t.commandCenter.planner, desc: t.commandCenter.plannerDesc, status: "working", href: "/business/planner" },
    { icon: BarChart3, title: t.capabilities.reports.title, desc: t.capabilities.reports.desc, status: "working", href: "/business/reports" },
    { icon: MessageSquareText, title: t.commandCenter.messageStudio, desc: t.commandCenter.messageDesc, status: "working", href: "/business/messages" },
    { icon: FolderLock, title: t.commandCenter.vault, desc: t.commandCenter.vaultDesc, status: "working", href: "/business/vault" },
    { icon: Wrench, title: t.commandCenter.tools, desc: t.commandCenter.toolsDesc, status: "working", href: "/business/tools" },
  ]

  const aiModules: ModuleDef[] = [
    { icon: Bot, title: copy.assistantTitle, desc: copy.assistantDesc, status: "working", href: "/assistant" },
    { icon: Sparkles, title: copy.promptTitle, desc: copy.promptDesc, status: "working", href: "/app-studio/prompt-my-app" },
    { icon: Hammer, title: copy.buildTitle, desc: copy.buildDesc, status: "working", href: "/app-studio/build-my-app" },
    { icon: Blocks, title: copy.fixTitle, desc: copy.fixDesc, status: "working", href: "/app-studio/fix-my-app" },
  ]

  const railItems = [
    { icon: LayoutDashboard, label: t.commandCenter.title, href: "/command-center", tone: "emerald" as const },
    { icon: Bot, label: copy.assistantTitle, href: "/assistant", tone: "violet" as const },
    { icon: Sparkles, label: copy.promptTitle, href: "/app-studio/prompt-my-app", tone: "cyan" as const },
    { icon: Users, label: t.capabilities.crm.title, href: "/business/customers", tone: "gold" as const },
  ]

  return (
    <div className="relative mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute left-[18%] top-16 hidden h-[34rem] w-[34rem] rounded-full border border-cyan/[0.055] shadow-[0_0_90px_rgba(34,211,238,.04)] xl:block" aria-hidden />
      <div className="pointer-events-none absolute right-[3%] top-40 hidden h-[30rem] w-[30rem] rotate-12 rounded-[34%] border border-violet/[0.055] xl:block" aria-hidden />

      <div className="mb-5 lg:hidden">
        <IntelligenceCard tone="emerald" className="relative overflow-hidden p-3 sm:p-4">
          <div className="pointer-events-none absolute -left-10 top-2 size-28 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-10 bottom-0 size-28 rounded-full bg-violet/10 blur-3xl" aria-hidden />
          <div className="relative mb-3 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <AICore state={session?.user ? "active" : "ready"} className="scale-90" />
              <div>
                <p className="ve-eyebrow">HEGEVA COMMAND</p>
                <p className="mt-0.5 text-xs font-semibold text-foreground/90">Quick Command Dock</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-primary">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
              {session?.user ? "Live" : "Ready"}
            </span>
          </div>
          <nav className="relative grid grid-cols-4 gap-2" aria-label="Mobile command center quick navigation">
            {railItems.map(({ icon: Icon, label, href, tone }, index) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition-all duration-200 active:scale-[.98]",
                  index === 0
                    ? "border-primary/30 bg-primary/10 shadow-[0_0_24px_-16px_rgba(16,185,129,.8)]"
                    : "border-white/8 bg-background/25 hover:border-white/15 hover:bg-background/45",
                )}
              >
                <SignalIcon icon={Icon} tone={tone} className="size-8 rounded-xl" />
                <span className="line-clamp-2 text-[10px] font-semibold leading-3 text-foreground/80 sm:text-[11px]">{label}</span>
              </Link>
            ))}
          </nav>
        </IntelligenceCard>
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <IntelligenceCard tone="emerald" className="relative overflow-hidden p-4 sm:p-5 lg:min-h-[calc(100vh-3rem)]">
            <div className="pointer-events-none absolute -left-16 top-28 h-44 w-44 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -right-16 bottom-24 h-44 w-44 rounded-full bg-violet/10 blur-3xl" aria-hidden />

            <div className="relative flex items-center gap-3 border-b border-white/8 pb-5">
              <AICore state={session?.user ? "active" : "ready"} />
              <div>
                <p className="ve-eyebrow">HEGEVA COMMAND</p>
                <p className="mt-1 text-sm font-semibold text-foreground">AI Control Rail</p>
              </div>
            </div>

            <nav className="relative mt-5 space-y-2" aria-label="Command Center quick navigation">
              {railItems.map(({ icon: Icon, label, href, tone }, index) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-200",
                    index === 0
                      ? "border-primary/30 bg-primary/10 shadow-[0_0_28px_-16px_rgba(16,185,129,.75)]"
                      : "border-white/8 bg-background/25 hover:-translate-y-0.5 hover:border-white/15 hover:bg-background/45",
                  )}
                >
                  <SignalIcon icon={Icon} tone={tone} className="size-9 rounded-xl" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/90">{label}</span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Link>
              ))}
            </nav>

            <div className="relative mt-6 rounded-2xl border border-cyan/15 bg-cyan/[0.045] p-4">
              <div className="flex items-center gap-2">
                {session?.user ? <Cloud className="size-4 text-primary" aria-hidden /> : <Info className="size-4 text-cyan" aria-hidden />}
                <span className="text-xs font-semibold uppercase tracking-[.12em] text-foreground/80">System state</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {isPending ? t.commandCenter.checking : session?.user ? t.commandCenter.connected : t.commandCenter.previewNote}
              </p>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-3">
                <p className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">AI</p>
                <p className="mt-1 text-sm font-semibold text-primary">Ready</p>
              </div>
              <div className="rounded-2xl border border-violet/15 bg-violet/[0.045] p-3">
                <p className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">Workspace</p>
                <p className="mt-1 text-sm font-semibold text-violet">Live</p>
              </div>
            </div>
          </IntelligenceCard>
        </aside>

        <main className="min-w-0">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_82%_20%,rgba(34,211,238,.11),transparent_28%),radial-gradient(circle_at_58%_4%,rgba(74,222,128,.11),transparent_28%),radial-gradient(circle_at_96%_80%,rgba(139,92,246,.08),transparent_30%),linear-gradient(160deg,rgba(255,255,255,.035),transparent_44%)] p-1">
            <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full border border-cyan/10" aria-hidden />
            <div className="pointer-events-none absolute right-10 top-8 size-52 rounded-full border border-primary/10" aria-hidden />
            <div className="pointer-events-none absolute bottom-5 right-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-violet/25 to-transparent" aria-hidden />
            <div className="relative p-5 sm:p-7 lg:p-8">
              <PageHeader
                eyebrow="HEGEVA"
                title={t.commandCenter.title}
                subtitle={t.commandCenter.subtitle}
                action={
                  <Link href={session?.user ? "/assistant" : "/get-started"} className={cn(buttonVariants({ size: "lg" }), "border border-gold/20 bg-gold text-gold-foreground shadow-[0_16px_38px_-24px_rgba(250,204,21,.72)] hover:bg-gold/90")}>
                    {session?.user ? t.commandCenter.openAssistant : t.dashboard.connect}
                  </Link>
                }
              />

              <IntelligenceCard tone="cyan" className="mt-8 flex items-center gap-4 p-4 sm:p-5">
                <AICore state={session?.user ? "active" : "ready"} className="hidden sm:grid" />
                {session?.user ? <Cloud className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />}
                <p className="text-sm leading-relaxed text-foreground/80 text-pretty">
                  {isPending ? t.commandCenter.checking : session?.user ? t.commandCenter.connected : t.commandCenter.previewNote}
                </p>
              </IntelligenceCard>
            </div>
          </div>

          <WorkspaceOverview />

          <SectionHeading className="mt-14" eyebrow="Intelligence layer" title={copy.aiModules} />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {aiModules.map(({ icon: Icon, title, desc, href }, index) => (
              <Link key={title} href={href} className="group rounded-3xl focus-visible:outline-none">
                <IntelligenceCard tone={aiTones[index]} interactive className="h-full min-h-48 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <SignalIcon icon={Icon} tone={aiTones[index]} />
                    <span className="mt-1 size-2 rounded-full bg-current opacity-35 shadow-[0_0_18px_currentColor]" aria-hidden />
                  </div>
                  <div className="mt-6">
                    <h3 className="font-display text-lg font-semibold tracking-[-0.025em] text-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground text-pretty">{desc}</p>
                  </div>
                  <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-current/20 to-transparent opacity-60" aria-hidden />
                </IntelligenceCard>
              </Link>
            ))}
          </div>

          <SectionHeading className="mt-14" eyebrow="Operations layer" title={copy.businessModules} />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map(({ icon: Icon, title, desc, status, href }, index) => (
              <Link key={title} href={href} className="group rounded-3xl focus-visible:outline-none">
                <IntelligenceCard tone={businessTones[index]} interactive className="h-full p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <SignalIcon icon={Icon} tone={businessTones[index]} />
                    <StatusBadge status={status} />
                  </div>
                  <div className="mt-5">
                    <h3 className="font-display text-base font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground text-pretty">{desc}</p>
                  </div>
                </IntelligenceCard>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
