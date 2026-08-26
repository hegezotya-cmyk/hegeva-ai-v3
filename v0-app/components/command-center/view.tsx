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
    {icon:Bot,title:copy.assistantTitle,desc:copy.assistantDesc,status:"beta",href:"/assistant"},
    {icon:Sparkles,title:copy.promptTitle,desc:copy.promptDesc,status:"beta",href:"/app-studio/prompt-my-app"},
    {icon:Hammer,title:copy.buildTitle,desc:copy.buildDesc,status:"beta",href:"/app-studio/build-my-app"},
    {icon:Blocks,title:copy.fixTitle,desc:copy.fixDesc,status:"beta",href:"/app-studio/fix-my-app"},
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_78%_25%,rgba(34,211,238,.08),transparent_28%),radial-gradient(circle_at_60%_10%,rgba(74,222,128,.09),transparent_30%),linear-gradient(160deg,rgba(255,255,255,.025),transparent_42%)] px-1 py-1">
        <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full border border-cyan/10" aria-hidden />
        <div className="pointer-events-none absolute -right-3 -top-8 size-52 rounded-full border border-primary/10" aria-hidden />
        <div className="relative p-5 sm:p-7">
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
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  )
}
