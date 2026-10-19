export type RevenuePathCustomer = {
  id: string
}

export type RevenuePathDocument = {
  id: string
  type: "invoice" | "quote"
  status?: "draft" | "sent" | "accepted" | "invoiced" | "paid"
}

export type RevenuePathProgress = {
  customers: number
  quotes: number
  sentQuotes: number
  acceptedQuotes: number
  invoices: number
  paidInvoices: number
  nextStep: number
}

export function getRevenuePathProgress(
  customers: RevenuePathCustomer[],
  documents: RevenuePathDocument[],
): RevenuePathProgress {
  const quotes = documents.filter((document) => document.type === "quote")
  const invoices = documents.filter((document) => document.type === "invoice")
  const counts = [
    customers.length,
    quotes.length,
    quotes.filter((quote) => quote.status === "sent" || quote.status === "accepted" || quote.status === "invoiced").length,
    quotes.filter((quote) => quote.status === "accepted" || quote.status === "invoiced").length,
    invoices.length,
    invoices.filter((invoice) => invoice.status === "paid").length,
  ]

  return {
    customers: counts[0],
    quotes: counts[1],
    sentQuotes: counts[2],
    acceptedQuotes: counts[3],
    invoices: counts[4],
    paidInvoices: counts[5],
    nextStep: Math.max(0, counts.findIndex((count) => count === 0)),
  }
}
