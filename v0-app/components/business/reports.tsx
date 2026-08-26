"use client"

import { useMemo } from "react"
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
    { label: c.customers, value: customers.length.toString(), note: c.customerNote },
    { label: c.documents, value: documents.length.toString(), note: c.documentNote },
    { label: c.expenses, value: `£${expenseTotal.toFixed(2)}`, note: `${expenses.length} ${c.expenseEntries}` },
    { label: c.openTasks, value: openTasks.toString(), note: `${doneTasks} ${c.completedTasks}` },
    { label: invoiceCopy.paid, value: invoiceValues.paid, note: invoiceCopy.paidNote },
    { label: invoiceCopy.outstanding, value: invoiceValues.outstanding, note: invoiceCopy.outstandingNote },
  ]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="glass-panel rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
            <p className="mt-3 break-words text-2xl font-semibold text-foreground sm:text-3xl">{card.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="glass-panel mt-6 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.integrity}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {cloudIntegrity ? c.integrityCloud : c.integrityBrowser} {c.integrityNote}
        </p>
      </div>
    </div>
  )
}
