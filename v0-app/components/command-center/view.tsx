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
  Cpu,
  Video,
  type LucideIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { OperatingCenter } from "@/components/command-center/operating-center"
import { COMMAND_OVERVIEW_COPY } from "@/lib/i18n/command-overview-copy"
import { AICore, SectionHeading } from "@/components/visual-engine"
import { OutcomeLauncher } from "@/components/outcome-launcher"
import { GoalMode } from "@/components/command-center/goal-mode"
import { GoalAdaptCycle } from "@/components/command-center/goal-adapt-cycle"
import { OpportunityExecutiveV2 } from "@/components/command-center/opportunity-executive-v2"
import { IntelligenceAutopilot } from "@/components/command-center/intelligence-autopilot"
import { ExternalIntelligenceLayer } from "@/components/command-center/external-intelligence-layer"
import { LiveCorePriority } from "@/components/command-center/live-core-priority"
import { useAiAvailability } from "@/lib/ai-availability"

type ModuleDef = {
  icon: LucideIcon
  title: string
  desc: string
  status: FeatureStatus
  href: string
  tone?: "emerald" | "cyan" | "violet" | "gold"
}

export function CommandCenterView() {
  const { t, locale } = useI18n()
  const copy = COMMAND_OVERVIEW_COPY[locale]
  const layers = {
    en: { intelligence: "Intelligence layer", description: "Move from a question to a verified result with the right HEGEVA workspace.", operations: "Operations layer", pricing: "Pricing" },
    hu: { intelligence: "Intelligenciaréteg", description: "A kérdéstől a hitelesített eredményig a megfelelő HEGEVA-munkaterülettel.", operations: "Működési réteg", pricing: "Csomagok" },
    de: { intelligence: "Intelligenzebene", description: "Von der Frage zum geprüften Ergebnis mit dem passenden HEGEVA-Arbeitsbereich.", operations: "Betriebsebene", pricing: "Preise" },
    fr: { intelligence: "Couche d'intelligence", description: "Passez d'une question à un résultat vérifié avec l'espace HEGEVA adapté.", operations: "Couche opérationnelle", pricing: "Tarifs" },
    es: { intelligence: "Capa de inteligencia", description: "Pasa de una pregunta a un resultado verificado con el espacio HEGEVA adecuado.", operations: "Capa operativa", pricing: "Precios" },
  }[locale]
  const { data: session, isPending } = authClient.useSession()

  // Real AI availability from runtime
  const aiAvailability = useAiAvailability()
  const flags = aiAvailability.status

  const mapStatus = (enabled: boolean, fallback: FeatureStatus = "coming"): FeatureStatus =>
    enabled ? "working" : fallback

  const modules: ModuleDef[] = [
    { icon: Users, title: t.capabilities.crm.title, desc: t.capabilities.crm.desc, status: "working", href: "/business/customers", tone: "emerald" },
    { icon: FileText, title: t.dashboard.documents, desc: t.capabilities.documents.desc, status: "working", href: "/business/documents", tone: "gold" },
    { icon: FileSpreadsheet, title: t.capabilities.invoices.title, desc: t.capabilities.invoices.desc, status: "working", href: "/business/invoices", tone: "cyan" },
    { icon: Receipt, title: t.dashboard.expenses, desc: t.commandCenter.expensesDesc, status: "working", href: "/business/expenses", tone: "cyan" },
    { icon: CalendarClock, title: t.commandCenter.planner, desc: t.commandCenter.plannerDesc, status: "working", href: "/business/planner", tone: "violet" },
    { icon: BarChart3, title: t.capabilities.reports.title, desc: t.capabilities.reports.desc, status: "working", href: "/business/reports", tone: "cyan" },
    { icon: MessageSquareText, title: t.commandCenter.messageStudio, desc: t.commandCenter.messageDesc, status: "working", href: "/business/messages", tone: "emerald" },
    { icon: FolderLock, title: t.commandCenter.vault, desc: t.commandCenter.vaultDesc, status: "working", href: "/business/vault", tone: "gold" },
    { icon: Wrench, title: t.commandCenter.tools, desc: t.commandCenter.toolsDesc, status: "working", href: "/business/tools", tone: "violet" },
  ]
  const aiModules: ModuleDef[] = [
    { icon: Cpu, title: t.capabilities.core.title, desc: t.capabilities.core.desc, status: "working", href: "/command-center" },
    { icon: Bot, title: copy.assistantTitle, desc: copy.assistantDesc, status: mapStatus(flags.assistantEnabled), href: "/assistant" },
    { icon: Sparkles, title: copy.promptTitle, desc: copy.promptDesc, status: mapStatus(flags.x10Enabled), href: "/app-studio/prompt-my-app" },
    { icon: Hammer, title: copy.buildTitle, desc: copy.buildDesc, status: mapStatus(flags.x10Enabled), href: "/app-studio/build-my-app" },
    { icon: Blocks, title: copy.fixTitle, desc: copy.fixDesc, status: mapStatus(flags.x10Enabled), href: "/app-studio/fix-my-app" },
    { icon: Sparkles, title: copy.creativeTitle, desc: copy.creativeDesc, status: mapStatus(flags.x10Enabled, "planned"), href: "/app-studio/creative" },
    { icon: Bot, title: copy.aiBotsTitle, desc: copy.aiBotsDesc, status: mapStatus(flags.aiBotsEnabled), href: "/app-studio/ai-bots" },
    { icon: Cpu, title: copy.x30Title, desc: copy.x30Desc, status: mapStatus(flags.x30Enabled), href: "/app-studio/x30-alpha" },
    { icon: Video, title: copy.videoTitle, desc: copy.videoDesc, status: mapStatus(flags.videoEnabled, "planned"), href: "/app-studio/video-ad-studio" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="command-crown"><div><p>HEGEVA / MISSION CONTROL</p><h1>{t.commandCenter.title}</h1><span>{t.commandCenter.subtitle}</span><div className="command-connection">{session?.user ? <Cloud aria-hidden /> : <Info aria-hidden />}<p>{isPending ? t.commandCenter.checking : session?.user ? t.commandCenter.connected : t.commandCenter.previewNote}</p></div><Link href={session?.user ? "/assistant" : "/get-started"} className={cn(buttonVariants({ size: "lg" }), "hegeva-primary mt-7 h-12 px-6")}>{session?.user ? t.commandCenter.openAssistant : t.dashboard.connect}</Link></div><div className="command-radar" aria-hidden><span/><span/><span/><AICore state={session?.user?"ready":"warning"}/><b>MISSION<br/>CONTROL</b></div></section>

      <OutcomeLauncher compact />
      <GoalMode />
      <GoalAdaptCycle />
      <OpportunityExecutiveV2 />
      <ExternalIntelligenceLayer />
      <LiveCorePriority />
      <OperatingCenter />
      <IntelligenceAutopilot />

      <SectionHeading className="mt-12" eyebrow={layers.intelligence} title={copy.aiModules} description={layers.description} />
      <div className="module-ledger mt-4">
        {aiModules.map(({ icon: Icon, title, desc, status, href }) => (
          <Link key={title} href={href} className="group"><span><Icon aria-hidden /></span><div><h3>{title}</h3><p>{desc}</p></div><StatusBadge status={status} />
          </Link>
        ))}
      </div>

      <SectionHeading className="mt-16" eyebrow={layers.operations} title={copy.businessModules} action={<Link href="/pricing" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>{layers.pricing}</Link>} />
      <div className="operation-index mt-4">
        {modules.map(({ icon: Icon, title, desc, status, href, tone }) => (
          <Link key={title} href={href} className={`operation-card operation-card-${tone}`}>
            <div className="operation-card-head"><span className="operation-card-icon"><Icon aria-hidden /></span><StatusBadge status={status} /></div>
            <div className="operation-card-copy"><h3>{title}</h3><p>{desc}</p></div>
          </Link>
        ))}
      </div>
    </div>
  )
}
