type RecordLike = { type?: string; status?: string; total?: number; dueDate?: string; createdAt?: string }
type CustomerLike = { createdAt?: string }
type TaskLike = { done?: boolean }

export function selectOwnerOperatingPicture({ customers, invoices, tasks }: { customers: CustomerLike[]; invoices: RecordLike[]; tasks: TaskLike[] }) {
  const weekAgo = Date.now() - 7 * 86400000
  const paidRevenue = invoices.filter((x) => x.type === "invoice" && x.status === "paid").reduce((sum, x) => sum + (Number.isFinite(x.total) ? Number(x.total) : 0), 0)
  const outstanding = invoices.filter((x) => x.type === "invoice" && x.status !== "paid").reduce((sum, x) => sum + (Number.isFinite(x.total) ? Number(x.total) : 0), 0)
  const overdueInvoices = invoices.filter((x) => x.type === "invoice" && x.status !== "paid" && x.dueDate && x.dueDate < new Date().toISOString().slice(0, 10)).length
  const staleQuotes = invoices.filter((x) => x.type === "quote" && x.status !== "accepted" && x.dueDate && x.dueDate < new Date().toISOString().slice(0, 10)).length
  return { metrics: { customers: customers.length, newCustomers: customers.filter((x) => x.createdAt && new Date(x.createdAt).getTime() >= weekAgo).length, paidRevenue, outstanding, openTasks: tasks.filter((x) => !x.done).length }, attention: [ ...(overdueInvoices ? [{ id: "overdue-invoices", count: overdueInvoices, href: "/business/invoices?focus=payment-followup" }] : []), ...(staleQuotes ? [{ id: "stale-quotes", count: staleQuotes, href: "/business/invoices?focus=quote-followup" }] : []) ] }
}
