export type TodayTask = { id: string; title: string; due?: string; priority?: string; done?: boolean }
export type TodayCustomer = { id: string; title?: string; followUp?: string; customerStatus?: string }
export type TodayDocument = { id: string; type?: string; status?: string; number?: string; clientName?: string; dueDate?: string }

export type TodayWorkItem = {
  id: string
  kind: "invoice" | "quote" | "customer" | "task"
  title: string
  detail: string
  date?: string
  overdue: boolean
  href: "/business/invoices" | "/business/customers" | "/business/planner"
}

type TodayWorkInput = {
  today: string
  tasks: TodayTask[]
  customers: TodayCustomer[]
  documents: TodayDocument[]
}

const validDate = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))

export function buildTodayWork({ today, tasks, customers, documents }: TodayWorkInput): TodayWorkItem[] {
  const items: TodayWorkItem[] = []

  for (const document of documents) {
    if (document.status !== "sent" || !validDate(document.dueDate) || document.dueDate! >= today) continue
    if (document.type !== "invoice" && document.type !== "quote") continue
    items.push({
      id: `${document.type}:${document.id}`,
      kind: document.type,
      title: document.number || document.clientName || document.id,
      detail: document.clientName || "",
      date: document.dueDate,
      overdue: true,
      href: "/business/invoices",
    })
  }

  for (const customer of customers) {
    if (customer.customerStatus === "paused" || !validDate(customer.followUp) || customer.followUp! > today) continue
    items.push({
      id: `customer:${customer.id}`,
      kind: "customer",
      title: customer.title || customer.id,
      detail: "",
      date: customer.followUp,
      overdue: customer.followUp! < today,
      href: "/business/customers",
    })
  }

  for (const task of tasks) {
    if (task.done || (validDate(task.due) && task.due! > today)) continue
    items.push({
      id: `task:${task.id}`,
      kind: "task",
      title: task.title,
      detail: task.priority || "medium",
      date: validDate(task.due) ? task.due : undefined,
      overdue: validDate(task.due) && task.due! < today,
      href: "/business/planner",
    })
  }

  const rank = { invoice: 0, quote: 1, customer: 2, task: 3 }
  return items.sort((a, b) => rank[a.kind] - rank[b.kind] || (a.date || today).localeCompare(b.date || today) || a.id.localeCompare(b.id))
}

