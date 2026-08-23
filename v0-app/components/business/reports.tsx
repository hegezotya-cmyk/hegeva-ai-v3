"use client"

import { useMemo } from "react"
import { useWorkspaceData, type WorkspaceSyncState } from "@/lib/use-workspace-data"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

type RecordItem = { id: string; amount?: number }
type Task = { id: string; done: boolean }

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

  const expenseTotal = useMemo(() => expenses.reduce((sum, item) => sum + (item.amount || 0), 0), [expenses])
  const openTasks = useMemo(() => tasks.filter((task) => !task.done).length, [tasks])
  const doneTasks = tasks.length - openTasks
  const cloudIntegrity = allSourcesCloud([customerSync, documentSync, expenseSync, plannerSync])

  const cards = [
    { label: c.customers, value: customers.length.toString(), note: c.customerNote },
    { label: c.documents, value: documents.length.toString(), note: c.documentNote },
    { label: c.expenses, value: `£${expenseTotal.toFixed(2)}`, note: `${expenses.length} ${c.expenseEntries}` },
    { label: c.openTasks, value: openTasks.toString(), note: `${doneTasks} ${c.completedTasks}` },
  ]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="glass-panel rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{card.value}</p>
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
