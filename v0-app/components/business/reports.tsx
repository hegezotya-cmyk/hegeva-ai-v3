"use client"

import { useEffect, useMemo, useState } from "react"

type RecordItem = { id: string; amount?: number }
type Task = { id: string; done: boolean }

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function LocalReports() {
  const [customers, setCustomers] = useState<RecordItem[]>([])
  const [documents, setDocuments] = useState<RecordItem[]>([])
  const [expenses, setExpenses] = useState<RecordItem[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setCustomers(readArray("hegeva:v0:customers"))
    setDocuments(readArray("hegeva:v0:documents"))
    setExpenses(readArray("hegeva:v0:expenses"))
    setTasks(readArray("hegeva:v0:planner"))
  }, [])

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
          Every figure above is derived from records stored by this HEGEVA browser workspace. Revenue, profit, conversion, savings and other performance numbers are intentionally not shown because this local version does not have verified source data for them yet.
        </p>
      </div>
    </div>
  )
}
