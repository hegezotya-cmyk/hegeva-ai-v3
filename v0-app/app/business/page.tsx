"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Users, FileText, ReceiptText, ArrowRight, CalendarCheck2, BarChart3, MessageSquareText, Wrench, FolderLock } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { TOOLS_COPY } from "@/lib/i18n/tools-copy"
import { VAULT_COPY } from "@/lib/i18n/vault-copy"

export default function BusinessPage() {
  const { t, locale } = useI18n()
  const modules = [
    { href: "/business/customers", title: t.business.customers, text: t.business.customersDesc, icon: Users },
    { href: "/business/documents", title: t.business.documents, text: t.business.documentsDesc, icon: FileText },
    { href: "/business/expenses", title: t.business.expenses, text: t.business.expensesDesc, icon: ReceiptText },
    { href: "/business/planner", title: t.business.planner, text: t.business.plannerDesc, icon: CalendarCheck2 },
    { href: "/business/reports", title: t.business.reports, text: t.business.reportsDesc, icon: BarChart3 },
    { href: "/business/messages", title: t.business.messages, text: t.business.messagesDesc, icon: MessageSquareText },
    { href: "/business/tools", title: TOOLS_COPY[locale].moduleTitle, text: TOOLS_COPY[locale].moduleDesc, icon: Wrench },
    { href: "/business/vault", title: VAULT_COPY[locale].moduleTitle, text: VAULT_COPY[locale].moduleDesc, icon: FolderLock },
  ]
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader eyebrow={t.business.eyebrow} title={t.business.title} subtitle={t.business.subtitle} />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ href, title, text, icon: Icon }) => (
            <Link key={href} href={href} className="glass-panel glass-panel-hover group rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10"><Icon className="size-5 text-primary" /></span>
                <StatusBadge status="working" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground/80 group-hover:text-foreground">{t.business.open} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
