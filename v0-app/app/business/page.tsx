"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Users, FileText, ReceiptText, ArrowRight, CalendarCheck2, BarChart3, MessageSquareText, Wrench, FolderLock, FileSpreadsheet, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { TOOLS_COPY } from "@/lib/i18n/tools-copy"
import { VAULT_COPY } from "@/lib/i18n/vault-copy"
import { INVOICE_COPY } from "@/lib/i18n/invoice-copy"
import { AICore, IntelligenceCard, SignalIcon } from "@/components/visual-engine"

export default function BusinessPage() {
  const { t, locale } = useI18n()
  const modules = [
    { href: "/business/customers", title: t.business.customers, text: t.business.customersDesc, icon: Users, tone: "emerald" as const },
    { href: "/business/documents", title: t.business.documents, text: t.business.documentsDesc, icon: FileText, tone: "cyan" as const },
    { href: "/business/expenses", title: t.business.expenses, text: t.business.expensesDesc, icon: ReceiptText, tone: "gold" as const },
    { href: "/business/planner", title: t.business.planner, text: t.business.plannerDesc, icon: CalendarCheck2, tone: "violet" as const },
    { href: "/business/reports", title: t.business.reports, text: t.business.reportsDesc, icon: BarChart3, tone: "cyan" as const },
    { href: "/business/messages", title: t.business.messages, text: t.business.messagesDesc, icon: MessageSquareText, tone: "emerald" as const },
    { href: "/business/tools", title: TOOLS_COPY[locale].moduleTitle, text: TOOLS_COPY[locale].moduleDesc, icon: Wrench, tone: "violet" as const },
    { href: "/business/vault", title: VAULT_COPY[locale].moduleTitle, text: VAULT_COPY[locale].moduleDesc, icon: FolderLock, tone: "gold" as const },
    { href: "/business/invoices", title: INVOICE_COPY[locale].moduleTitle, text: INVOICE_COPY[locale].moduleDesc, icon: FileSpreadsheet, tone: "cyan" as const },
  ]
  return (
    <AppShell>
      <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-36 size-72 rounded-full bg-violet/10 blur-3xl" />
        <div className="relative z-10">
          <IntelligenceCard tone="emerald" className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex items-center gap-4"><AICore state="active" /><div><p className="ve-eyebrow">{t.business.eyebrow}</p><p className="text-xs text-muted-foreground">HEGEVA business intelligence workspace</p></div></div>
                <PageHeader eyebrow="" title={t.business.title} subtitle={t.business.subtitle} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"><Sparkles className="size-4" />9 modules ready</div>
            </div>
          </IntelligenceCard>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {modules.map(({ href, title, text, icon: Icon, tone }) => (
              <Link key={href} href={href} className="group rounded-3xl focus-visible:outline-none">
                <IntelligenceCard interactive tone={tone} className="h-full p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <SignalIcon icon={Icon} tone={tone} className="size-12 rounded-2xl" />
                    <StatusBadge status="working" />
                  </div>
                  <h2 className="mt-5 font-display text-xl font-semibold text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors group-hover:text-foreground">{t.business.open}<span className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition group-hover:border-primary/25 group-hover:bg-primary/10"><ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></span>
                </IntelligenceCard>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
