"use client"

import { useMemo } from "react"
import { Activity, CheckCircle2, FileText, Receipt, Users, WalletCards } from "lucide-react"
import { useWorkspaceData, type WorkspaceSyncState } from "@/lib/use-workspace-data"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

type RecordItem = { id: string; amount?: number }
type Task = { id: string; done: boolean }
type Invoice = { id: string; type: "invoice" | "quote"; status?: "draft" | "sent" | "paid"; currency?: string; items?: { quantity?: number; unitPrice?: number }[]; vatRate?: number }

function allSourcesCloud(states: WorkspaceSyncState[]) {
  return states.length > 0 && states.every((state) => state === "cloud")
}

export function LocalReports() {
  const { locale } = useI18n()
  const c = getBusinessModulesCopy(locale).reports
  const { items: customers, syncState: customerSync } = useWorkspaceData<RecordItem>("customers")
  const { items: documents, syncState: documentSync } = useWorkspaceData<RecordItem>("documents")
  const { items: expenses, syncState: expenseSync } = useWorkspaceData<RecordItem>("expenses")
  const { items: tasks, syncState: plannerSync } = useWorkspaceData<Task>("planner")
  const { items: invoices, syncState: invoiceSync } = useWorkspaceData<Invoice>("invoice_documents")

  const invoiceCopy = {
    en: { paid: "Paid invoice value", outstanding: "Outstanding invoice value", paidNote: "Calculated from invoices marked paid", outstandingNote: "Sent invoices not yet marked paid", none: "£0.00" },
    hu: { paid: "Kifizetett számlák értéke", outstanding: "Kintlévőség", paidNote: "Kifizetettként jelölt számlákból számítva", outstandingNote: "Elküldött, még nem kifizetett számlák", none: "0,00 £" },
    de: { paid: "Wert bezahlter Rechnungen", outstanding: "Offene Rechnungen", paidNote: "Aus als bezahlt markierten Rechnungen berechnet", outstandingNote: "Gesendete, noch nicht bezahlte Rechnungen", none: "0,00 £" },
    fr: { paid: "Valeur des factures payées", outstanding: "Factures impayées", paidNote: "Calculé à partir des factures marquées payées", outstandingNote: "Factures envoyées non marquées comme payées", none: "0,00 £" },
    es: { paid: "Valor de facturas pagadas", outstanding: "Facturas pendientes", paidNote: "Calculado con facturas marcadas como pagadas", outstandingNote: "Facturas enviadas aún no marcadas como pagadas", none: "0,00 £" },
  }[locale]

  const expenseTotal = useMemo(() => expenses.reduce((sum, item) => sum + (item.amount || 0), 0), [expenses])
  const openTasks = useMemo(() => tasks.filter((task) => !task.done).length, [tasks])
  const doneTasks = tasks.length - openTasks
  const cloudIntegrity = allSourcesCloud([customerSync, documentSync, expenseSync, plannerSync, invoiceSync])

  const invoiceValues = useMemo(() => {
    const totals = { paid: new Map<string, number>(), outstanding: new Map<string, number>() }
    for (const invoice of invoices) {
      if (invoice.type !== "invoice" || (invoice.status !== "paid" && invoice.status !== "sent")) continue
      const subtotal = (invoice.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)
      const total = subtotal * (1 + (Number(invoice.vatRate) || 0) / 100)
      const currency = invoice.currency || "GBP"
      const bucket = invoice.status === "paid" ? totals.paid : totals.outstanding
      bucket.set(currency, (bucket.get(currency) || 0) + total)
    }
    const format = (values: Map<string, number>) => values.size
      ? [...values].map(([currency, value]) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)).join(" · ")
      : invoiceCopy.none
    return { paid: format(totals.paid), outstanding: format(totals.outstanding) }
  }, [invoices, invoiceCopy.none, locale])

  const cards = [
    { label: c.customers, value: customers.length.toString(), note: c.customerNote, icon: Users, tone: "primary" },
    { label: c.documents, value: documents.length.toString(), note: c.documentNote, icon: FileText, tone: "cyan" },
    { label: c.expenses, value: `£${expenseTotal.toFixed(2)}`, note: `${expenses.length} ${c.expenseEntries}`, icon: Receipt, tone: "gold" },
    { label: c.openTasks, value: openTasks.toString(), note: `${doneTasks} ${c.completedTasks}`, icon: Activity, tone: "violet" },
    { label: invoiceCopy.paid, value: invoiceValues.paid, note: invoiceCopy.paidNote, icon: CheckCircle2, tone: "primary" },
    { label: invoiceCopy.outstanding, value: invoiceValues.outstanding, note: invoiceCopy.outstandingNote, icon: WalletCards, tone: "gold" },
  ] as const

  const toneClasses = {
    primary: "border-primary/25 bg-primary/10 text-primary",
    cyan: "border-cyan/25 bg-cyan/10 text-cyan",
    gold: "border-gold/25 bg-gold/10 text-gold",
    violet: "border-violet/25 bg-violet/10 text-violet",
  }

  const glowClasses = {
    primary: "bg-primary/10",
    cyan: "bg-cyan/10",
    gold: "bg-gold/10",
    violet: "bg-violet/10",
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-3xl p-5 sm:p-6">
              <span className={`pointer-events-none absolute -right-12 -top-16 size-36 rounded-full ${glowClasses[card.tone]} blur-3xl`} aria-hidden />
              <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
                  <p className="mt-3 break-words font-display text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">{card.value}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.note}</p>
                </div>
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[card.tone]} transition-transform group-hover:-translate-y-0.5`}>
                  <Icon className="size-5" aria-hidden />
                </span>
              </div>
            </article>
          )
        })}
      </div>

      <div className="glass-panel relative mt-6 overflow-hidden rounded-3xl p-6 sm:p-7">
        <span className={`pointer-events-none absolute -right-20 -top-24 size-60 rounded-full ${cloudIntegrity ? "bg-primary/10" : "bg-violet/8"} blur-3xl`} aria-hidden />
        <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">HEGEVA</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{c.integrity}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {cloudIntegrity ? c.integrityCloud : c.integrityBrowser} {c.integrityNote}
            </p>
          </div>
          <div className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${cloudIntegrity ? "border-primary/20 bg-primary/8 text-primary" : "border-violet/20 bg-violet/8 text-violet"}`}>
            <span className={`size-1.5 rounded-full ${cloudIntegrity ? "bg-primary" : "bg-violet"} shadow-[0_0_10px_currentColor]`} aria-hidden />
            {cloudIntegrity ? "Cloud" : "Local"}
          </div>
        </div>
      </div>
    </div>
  )
}
