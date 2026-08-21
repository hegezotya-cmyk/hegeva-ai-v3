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
  type LucideIcon,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { PageHeader } from "@/components/page-header"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ModuleDef = {
  icon: LucideIcon
  title: string
  desc: string
  status: FeatureStatus
  href: string
}

export function CommandCenterView() {
  const { t } = useI18n()

  const modules: ModuleDef[] = [
    { icon: Users, title: t.capabilities.crm.title, desc: t.capabilities.crm.desc, status: "coming", href: "/business" },
    { icon: FileText, title: t.dashboard.documents, desc: t.capabilities.documents.desc, status: "coming", href: "/business" },
    { icon: Receipt, title: t.dashboard.expenses, desc: "Track spending and keep your books clean.", status: "coming", href: "/business" },
    { icon: CalendarClock, title: "Planner / Time Saver", desc: "Plan your day and automate the repetitive work.", status: "planned", href: "/business" },
    { icon: BarChart3, title: t.capabilities.reports.title, desc: t.capabilities.reports.desc, status: "coming", href: "/business" },
    { icon: MessageSquareText, title: "Message Studio", desc: "Craft professional client messages in any language.", status: "planned", href: "/business" },
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
          <Link href="/get-started" className={cn(buttonVariants({ size: "lg" }), "bg-gold text-gold-foreground hover:bg-gold/90")}>
            {t.dashboard.connect}
          </Link>
        }
      />

      {/* Honest connection note */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-cyan/25 bg-cyan/8 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />
        <p className="text-sm leading-relaxed text-foreground/80 text-pretty">{t.commandCenter.previewNote}</p>
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
