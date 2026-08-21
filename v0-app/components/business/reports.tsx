"use client"

import { useMemo } from "react"
import { useWorkspaceData } from "@/lib/use-workspace-data"

type RecordItem = { id: string; amount?: number }
type Task = { id: string; done: boolean }

export function LocalReports() {
  const { items: customers, syncState: customerSync } = useWorkspaceData<RecordItem>("customers")
  const { items: documents } = useWorkspaceData<RecordItem>("documents")
  const { items: expenses } = useWorkspaceData<RecordItem>("expenses")
  const { items: tasks } = useWorkspaceData<Task>("planner")

  const expenseTotal = useMemo(() => expenses.reduce((sum, item) => sum + (item.amount || 0), 0), [expenses])
  const openTasks = useMemo(() => tasks.filter((task) => !task.done).length, [tasks])
  const doneTasks = tasks.length - openTasks

  const cards = [
    { label: "Customers", value: customers.length.toString(), note: "Saved customer records" },
    { label: "Documents", value: documents.length.toString(), note: "Saved document records" },
    { label: "Expenses", value: `£${expenseTotal.toFixed(2)}`, note: `${expenses.length} saved expense entries` },
    { label: "Open tasks", value: openTasks.toString(), note: `${doneTasks} completed tasks` },
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
        <h2 className="text-lg font-semibold text-foreground">Report integrity</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Every figure above is derived from records stored in your {customerSync === "cloud" ? "authenticated HEGEVA cloud workspace" : "HEGEVA browser workspace"}. Revenue, profit, conversion, savings and other performance numbers are intentionally not shown because HEGEVA does not have verified source data for them yet.
        </p>
      </div>
    </div>
  )
}
