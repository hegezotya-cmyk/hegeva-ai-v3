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
  Cloud,
  type LucideIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { PageHeader } from "@/components/page-header"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

type ModuleDef = {
  icon: LucideIcon
  title: string
  desc: string
  status: FeatureStatus
  href: string
}

export function CommandCenterView() {
  const { t, locale } = useI18n()
  const { data: session, isPending } = authClient.useSession()

  const connectedCopy = {
    en: { action: "Open Assistant", note: "Cloud workspace connected. Your working modules sync real account data through the authenticated HEGEVA backend." },
    hu: { action: "Asszisztens megnyitása", note: "A felhőalapú munkaterület csatlakoztatva. A működő modulok a hitelesített HEGEVA backend segítségével szinkronizálják a valódi fiókadatokat." },
    de: { action: "Assistent öffnen", note: "Cloud-Arbeitsbereich verbunden. Die aktiven Module synchronisieren echte Kontodaten über das authentifizierte HEGEVA-Backend." },
    fr: { action: "Ouvrir l’assistant", note: "Espace cloud connecté. Les modules actifs synchronisent les données réelles du compte via le backend HEGEVA authentifié." },
    es: { action: "Abrir asistente", note: "Espacio de trabajo en la nube conectado. Los módulos activos sincronizan datos reales mediante el backend autenticado de HEGEVA." },
  }[locale]

  const modules: ModuleDef[] = [
    { icon: Users, title: t.capabilities.crm.title, desc: t.capabilities.crm.desc, status: "working", href: "/business/customers" },
    { icon: FileText, title: t.dashboard.documents, desc: t.capabilities.documents.desc, status: "working", href: "/business/documents" },
    { icon: Receipt, title: t.dashboard.expenses, desc: "Track spending and keep your books clean.", status: "working", href: "/business/expenses" },
    { icon: CalendarClock, title: "Planner / Time Saver", desc: "Plan priorities, due dates and completed work.", status: "working", href: "/business/planner" },
    { icon: BarChart3, title: t.capabilities.reports.title, desc: t.capabilities.reports.desc, status: "working", href: "/business/reports" },
    { icon: MessageSquareText, title: "Message Studio", desc: "Create and cloud-save professional message drafts.", status: "working", href: "/business/messages" },
    { icon: FolderLock, title: "Vault & Templates", desc: "Secure documents and ready-to-use templates.", status: "planned", href: "/business" },
    { icon: Wrench, title: "Business Tools", desc: "Calculators and utilities for everyday operations.", status: "planned", href: "/business" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="HEGEVA"
        title={t.commandCenter.title}
        subtitle={t.commandCenter.subtitle}
        action={
          <Link href={session?.user ? "/assistant" : "/get-started"} className={cn(buttonVariants({ size: "lg" }), "bg-gold text-gold-foreground hover:bg-gold/90")}>
            {session?.user ? connectedCopy.action : t.dashboard.connect}
          </Link>
        }
      />

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-cyan/25 bg-cyan/8 p-4">
        {session?.user ? <Cloud className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />}
        <p className="text-sm leading-relaxed text-foreground/80 text-pretty">
          {isPending ? "Checking workspace connection…" : session?.user ? connectedCopy.note : t.commandCenter.previewNote}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map(({ icon: Icon, title, desc, status, href }) => (
          <Link key={title} href={href} className="glass-panel glass-panel-hover group flex flex-col gap-3 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <StatusBadge status={status} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
