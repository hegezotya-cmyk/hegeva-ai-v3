"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Activity, ArrowRight, BarChart3, CalendarCheck2, FileSpreadsheet, FileText, FolderLock, MessageSquareText, ReceiptText, ShieldCheck, Sparkles, Users, WalletCards, Wrench } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { TOOLS_COPY } from "@/lib/i18n/tools-copy"
import { VAULT_COPY } from "@/lib/i18n/vault-copy"
import { INVOICE_COPY } from "@/lib/i18n/invoice-copy"
import { AICore, IntelligenceCard, LiveStatus, SignalIcon } from "@/components/visual-engine"

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
      <div className="relative mx-auto max-w-[1500px] overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[8%] top-10 size-80 rounded-full bg-cyan/7 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-80 size-72 rounded-full bg-violet/10 blur-3xl" />

        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <IntelligenceCard tone="emerald" className="overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute right-[-8%] top-[-22%] size-80 rounded-full border border-primary/10 shadow-[0_0_90px_rgba(16,185,129,.08)]" aria-hidden />
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex items-center gap-4"><AICore state="active" /><div><p className="ve-eyebrow">{t.business.eyebrow}</p><p className="text-xs text-muted-foreground">HEGEVA business intelligence workspace</p></div></div>
                <PageHeader eyebrow="" title={t.business.title} subtitle={t.business.subtitle} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"><Sparkles className="size-4" />9 modules ready</div>
                <Link href="/business/reports" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-cyan/20 bg-cyan/6 px-4 text-sm font-semibold text-cyan transition hover:border-cyan/35 hover:bg-cyan/10"><BarChart3 className="size-4" />Reports</Link>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary/18 bg-primary/5 p-4"><LiveStatus label="Workspace" detail="Ready" tone="emerald" /></div>
              <div className="rounded-2xl border border-cyan/18 bg-cyan/5 p-4"><LiveStatus label="Business data" detail="Connected" tone="cyan" /></div>
              <div className="rounded-2xl border border-violet/18 bg-violet/5 p-4"><LiveStatus label="Account security" detail="Protected" tone="violet" /></div>
            </div>
          </IntelligenceCard>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start" aria-label="Business intelligence rail">
            <IntelligenceCard tone="cyan" className="p-5">
              <div className="flex items-center gap-3"><SignalIcon icon={WalletCards} tone="cyan" className="size-10 rounded-xl" /><div><p className="ve-eyebrow mb-0">Operations core</p><p className="text-sm font-semibold">Business systems</p></div></div>
              <div className="mt-4 space-y-2">
                <LiveStatus label="CRM" detail="Ready" tone="emerald" />
                <LiveStatus label="Documents" detail="Available" tone="cyan" />
                <LiveStatus label="Planner" detail="Connected" tone="violet" />
              </div>
            </IntelligenceCard>

            <IntelligenceCard tone="violet" className="p-5">
              <div className="flex items-center gap-3"><SignalIcon icon={Activity} tone="violet" className="size-10 rounded-xl" /><div><p className="ve-eyebrow mb-0">Workspace map</p><p className="text-sm font-semibold">Quick launch</p></div></div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/business/customers" className="rounded-xl border border-white/8 bg-background/30 p-3 transition hover:border-primary/20 hover:bg-primary/5"><Users className="size-4 text-primary"/><p className="mt-2 text-xs font-semibold">CRM</p><p className="mt-1 text-[10px] text-muted-foreground">Customers</p></Link>
                <Link href="/business/invoices" className="rounded-xl border border-white/8 bg-background/30 p-3 transition hover:border-cyan/20 hover:bg-cyan/5"><FileSpreadsheet className="size-4 text-cyan"/><p className="mt-2 text-xs font-semibold">Invoices</p><p className="mt-1 text-[10px] text-muted-foreground">Billing docs</p></Link>
                <Link href="/business/planner" className="rounded-xl border border-white/8 bg-background/30 p-3 transition hover:border-violet/20 hover:bg-violet/5"><CalendarCheck2 className="size-4 text-violet"/><p className="mt-2 text-xs font-semibold">Planner</p><p className="mt-1 text-[10px] text-muted-foreground">Schedule</p></Link>
                <Link href="/business/vault" className="rounded-xl border border-white/8 bg-background/30 p-3 transition hover:border-gold/20 hover:bg-gold/5"><ShieldCheck className="size-4 text-gold"/><p className="mt-2 text-xs font-semibold">Vault</p><p className="mt-1 text-[10px] text-muted-foreground">Secure files</p></Link>
              </div>
            </IntelligenceCard>
          </aside>
        </div>

        <div className="relative z-10 mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ href, title, text, icon: Icon, tone }) => (
            <Link key={href} href={href} className="group rounded-3xl focus-visible:outline-none">
              <IntelligenceCard interactive tone={tone} className="h-full overflow-hidden p-6 sm:p-7">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
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
    </AppShell>
  )
}
