"use client"

import Link from "next/link"
import { BarChart3, Bot, FileText, FolderLock, LayoutGrid, Users, type LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"

export function Capabilities() {
  const { t } = useI18n()

  const items: { icon: LucideIcon; title: string; desc: string; status: FeatureStatus; href: string }[] = [
    { icon: Bot, title: t.capabilities.assistant.title, desc: t.capabilities.assistant.desc, status: "beta", href: "/assistant" },
    { icon: BarChart3, title: t.capabilities.reports.title, desc: t.capabilities.reports.desc, status: "coming", href: "/command-center" },
    { icon: FileText, title: t.capabilities.invoices.title, desc: t.capabilities.invoices.desc, status: "coming", href: "/command-center" },
    { icon: FolderLock, title: t.capabilities.documents.title, desc: t.capabilities.documents.desc, status: "coming", href: "/command-center" },
    { icon: Users, title: t.capabilities.crm.title, desc: t.capabilities.crm.desc, status: "coming", href: "/command-center" },
    { icon: LayoutGrid, title: t.capabilities.studio.title, desc: t.capabilities.studio.desc, status: "beta", href: "/app-studio" },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {t.capabilities.heading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.capabilities.subheading}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, desc, status, href }) => (
          <Link
            key={title}
            href={href}
            className="glass-panel glass-panel-hover group flex flex-col gap-3 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
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
    </section>
  )
}
