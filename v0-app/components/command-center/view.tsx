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
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { OperatingCenter } from "@/components/command-center/operating-center"
import { COMMAND_OVERVIEW_COPY } from "@/lib/i18n/command-overview-copy"
import { AICore, SectionHeading } from "@/components/visual-engine"

type ModuleDef = {
  icon: LucideIcon
  title: string
  desc: string
  status: FeatureStatus
  href: string
}

export function CommandCenterView() {
  const { t, locale } = useI18n()
  const copy = COMMAND_OVERVIEW_COPY[locale]
  const layers = {
    en: { intelligence: "Intelligence layer", description: "Move from a question to a verified result with the right HEGEVA workspace.", operations: "Operations layer", pricing: "Pricing" },
    hu: { intelligence: "Intelligenciaréteg", description: "A kérdéstől a hitelesített eredményig a megfelelő HEGEVA-munkaterülettel.", operations: "Működési réteg", pricing: "Csomagok" },
    de: { intelligence: "Intelligenzebene", description: "Von der Frage zum geprüften Ergebnis mit dem passenden HEGEVA-Arbeitsbereich.", operations: "Betriebsebene", pricing: "Preise" },
    fr: { intelligence: "Couche d’intelligence", description: "Passez d’une question à un résultat vérifié avec l’espace HEGEVA adapté.", operations: "Couche opérationnelle", pricing: "Tarifs" },
    es: { intelligence: "Capa de inteligencia", description: "Pasa de una pregunta a un resultado verificado con el espacio HEGEVA adecuado.", operations: "Capa operativa", pricing: "Precios" },
  }[locale]
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
    {icon:Bot,title:copy.assistantTitle,desc:copy.assistantDesc,status:"working",href:"/assistant"},
    {icon:Sparkles,title:copy.promptTitle,desc:copy.promptDesc,status:"working",href:"/app-studio/prompt-my-app"},
    {icon:Hammer,title:copy.buildTitle,desc:copy.buildDesc,status:"working",href:"/app-studio/build-my-app"},
    {icon:Blocks,title:copy.fixTitle,desc:copy.fixDesc,status:"working",href:"/app-studio/fix-my-app"},
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="command-crown"><div><p>HEGEVA / MISSION CONTROL</p><h1>{t.commandCenter.title}</h1><span>{t.commandCenter.subtitle}</span><div className="command-connection">{session?.user ? <Cloud aria-hidden /> : <Info aria-hidden />}<p>{isPending ? t.commandCenter.checking : session?.user ? t.commandCenter.connected : t.commandCenter.previewNote}</p></div><Link href={session?.user ? "/assistant" : "/get-started"} className={cn(buttonVariants({ size: "lg" }), "hegeva-primary mt-7 h-12 px-6")}>{session?.user ? t.commandCenter.openAssistant : t.dashboard.connect}</Link></div><div className="command-radar" aria-hidden><span/><span/><span/><AICore state={session?.user?"ready":"warning"}/><b>MISSION<br/>CONTROL</b></div></section>

      <OperatingCenter />

      <SectionHeading className="mt-12" eyebrow={layers.intelligence} title={copy.aiModules} description={layers.description} />
      <div className="module-ledger mt-4">
        {aiModules.map(({ icon: Icon, title, desc, status, href }) => (
          <Link key={title} href={href} className="group"><span><Icon aria-hidden /></span><div><h3>{title}</h3><p>{desc}</p></div><StatusBadge status={status} />
          </Link>
        ))}
      </div>

      <SectionHeading className="mt-16" eyebrow={layers.operations} title={copy.businessModules} action={<Link href="/pricing" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>{layers.pricing}</Link>} />
      <div className="operation-index mt-4">
        {modules.map(({ icon: Icon, title, desc, status, href }) => (
          <Link key={title} href={href}><span><Icon aria-hidden /></span><div><h3>{title}</h3><p>{desc}</p></div><StatusBadge status={status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
