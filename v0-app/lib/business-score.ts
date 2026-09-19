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
  overdueHighPriorityAdmin: boolean
  dueTodayUnresolvedTask: boolean
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
