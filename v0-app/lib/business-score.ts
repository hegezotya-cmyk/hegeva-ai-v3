export type BusinessScoreCategory = "payments" | "sales" | "customers" | "admin"

export type BusinessScoreDeduction = {
  code: string
  points: number
}

export type BusinessScoreResult = {
  overall: number
  categories: Record<BusinessScoreCategory, { score: number; deductions: BusinessScoreDeduction[] }>
}

export type BusinessScoreSignals = {
  overdueInvoice: boolean
  overdueInvoiceDays: number
  overdueInvoiceAmount: number
  openQuoteNoFollowUpDays: number
  openQuoteAmount: number
  returningCustomerInactiveDays: number
  returningCustomerPreviousJobs: number
  customerFollowUpsDue?: number
  overdueHighPriorityAdmin: boolean
  dueTodayUnresolvedTask: boolean
}

export type BusinessScoreWorkspaceDocument = {
  id?: string
  type?: string
  status?: string
  dueDate?: string
  vatRate?: number
  items?: Array<{ quantity?: number; unitPrice?: number }>
}

export type BusinessScoreWorkspaceCustomer = {
  id?: string
  customerStatus?: string
  followUp?: string
}

export type BusinessScoreWorkspaceTask = {
  id?: string
  done?: boolean
  priority?: string
  due?: string
}

export type BusinessScoreWorkspaceInput = {
  today: string
  invoices: BusinessScoreWorkspaceDocument[]
  customers: BusinessScoreWorkspaceCustomer[]
  tasks: BusinessScoreWorkspaceTask[]
}

export type BusinessScoreWorkspaceResult = {
  state: "ready" | "incomplete"
  score: BusinessScoreResult | null
  observedCategories: BusinessScoreCategory[]
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

export function calculateBusinessScore(signals: BusinessScoreSignals): BusinessScoreResult {
  const payments: BusinessScoreDeduction[] = []
  if (signals.overdueInvoice) payments.push({ code: "overdue_invoice", points: 10 })
  if (signals.overdueInvoiceDays >= 14) payments.push({ code: "invoice_14_days", points: 20 })
  if (signals.overdueInvoiceAmount >= 1000) payments.push({ code: "invoice_1000_plus", points: 15 })

  const sales: BusinessScoreDeduction[] = []
  if (signals.openQuoteNoFollowUpDays >= 7) sales.push({ code: "quote_7_days", points: 20 })
  if (signals.openQuoteNoFollowUpDays >= 10) sales.push({ code: "quote_10_days", points: 10 })
  if (signals.openQuoteAmount >= 500) sales.push({ code: "quote_500_plus", points: 10 })

  const customers: BusinessScoreDeduction[] = []
  if (signals.returningCustomerInactiveDays >= 30) customers.push({ code: "returning_30_days", points: 20 })
  if (signals.returningCustomerPreviousJobs >= 3) customers.push({ code: "returning_3_jobs", points: 10 })
  if ((signals.customerFollowUpsDue || 0) > 0) customers.push({ code: "customer_followup_due", points: 15 })

  const admin: BusinessScoreDeduction[] = []
  if (signals.overdueHighPriorityAdmin) admin.push({ code: "overdue_high_priority", points: 8 })
  if (signals.dueTodayUnresolvedTask) admin.push({ code: "due_today_unresolved", points: 6 })

  const score = (deductions: BusinessScoreDeduction[]) =>
    clamp(100 - deductions.reduce((sum, item) => sum + item.points, 0))

  const categories = {
    payments: { score: score(payments), deductions: payments },
    sales: { score: score(sales), deductions: sales },
    customers: { score: score(customers), deductions: customers },
    admin: { score: score(admin), deductions: admin },
  }

  const overall = Math.round(
    (categories.payments.score + categories.sales.score + categories.customers.score + categories.admin.score) / 4,
  )

  return { overall, categories }
}

const day = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null

const daysBetween = (from: string, to: string) => {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.floor((end - start) / 86_400_000)) : 0
}

const documentTotal = (document: BusinessScoreWorkspaceDocument) => {
  const net = (document.items || []).reduce((sum, item) => {
    const quantity = Number(item?.quantity)
    const unitPrice = Number(item?.unitPrice)
    return Number.isFinite(quantity) && Number.isFinite(unitPrice) && quantity >= 0 && unitPrice >= 0
      ? sum + quantity * unitPrice
      : sum
  }, 0)
  const vatRate = Number(document.vatRate)
  return net * (Number.isFinite(vatRate) && vatRate >= 0 && vatRate <= 100 ? 1 + vatRate / 100 : 1)
}

/**
 * Derives only aggregate, present-tense score evidence. It deliberately does
 * not return record identifiers, names, document references, or raw values.
 */
export function calculateBusinessScoreFromWorkspace(input: BusinessScoreWorkspaceInput): BusinessScoreWorkspaceResult {
  const today = day(input.today)
  if (!today) return { state: "incomplete", score: null, observedCategories: [] }

  const invoices = Array.isArray(input.invoices) ? input.invoices : []
  const customers = Array.isArray(input.customers) ? input.customers : []
  const tasks = Array.isArray(input.tasks) ? input.tasks : []
  const observedCategories: BusinessScoreCategory[] = []

  const invoiceRecords = invoices.filter((item) => item?.type === "invoice" && day(item.dueDate))
  const overdueInvoices = invoiceRecords.filter((item) => item.status !== "paid" && String(item.dueDate) < today)
  if (invoiceRecords.length) observedCategories.push("payments")

  const quoteRecords = invoices.filter((item) => item?.type === "quote" && day(item.dueDate))
  const pastDueQuotes = quoteRecords.filter((item) => item.status !== "paid" && String(item.dueDate) < today)
  if (quoteRecords.length) observedCategories.push("sales")

  const customersWithFollowUp = customers.filter((item) => day(item?.followUp))
  if (customersWithFollowUp.length) observedCategories.push("customers")
  const customerFollowUpsDue = customersWithFollowUp.filter((item) => String(item.followUp) <= today && item.customerStatus !== "paused").length

  const tasksWithDueDate = tasks.filter((item) => day(item?.due))
  if (tasksWithDueDate.length) observedCategories.push("admin")
  const overdueHighPriorityAdmin = tasksWithDueDate.some((item) => !item.done && item.priority === "high" && String(item.due) < today)
  const dueTodayUnresolvedTask = tasksWithDueDate.some((item) => !item.done && day(item.due) === today)

  if (observedCategories.length < 2) return { state: "incomplete", score: null, observedCategories }

  const signals: BusinessScoreSignals = {
    overdueInvoice: overdueInvoices.length > 0,
    overdueInvoiceDays: overdueInvoices.reduce((max, item) => Math.max(max, daysBetween(String(item.dueDate), today)), 0),
    overdueInvoiceAmount: overdueInvoices.reduce((sum, item) => sum + documentTotal(item), 0),
    openQuoteNoFollowUpDays: pastDueQuotes.reduce((max, item) => Math.max(max, daysBetween(String(item.dueDate), today)), 0),
    openQuoteAmount: pastDueQuotes.reduce((sum, item) => sum + documentTotal(item), 0),
    returningCustomerInactiveDays: 0,
    returningCustomerPreviousJobs: 0,
    customerFollowUpsDue,
    overdueHighPriorityAdmin,
    dueTodayUnresolvedTask,
  }
  const fullScore = calculateBusinessScore(signals)
  const overall = Math.round(observedCategories.reduce((sum, category) => sum + fullScore.categories[category].score, 0) / observedCategories.length)

  return { state: "ready", score: { ...fullScore, overall }, observedCategories }
}

export const DEMO_SCORE_SIGNALS: BusinessScoreSignals = {
  overdueInvoice: true,
  overdueInvoiceDays: 18,
  overdueInvoiceAmount: 1200,
  openQuoteNoFollowUpDays: 12,
  openQuoteAmount: 850,
  returningCustomerInactiveDays: 31,
  returningCustomerPreviousJobs: 4,
  overdueHighPriorityAdmin: true,
  dueTodayUnresolvedTask: true,
}
