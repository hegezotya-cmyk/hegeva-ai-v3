import assert from "node:assert/strict"
import { getRevenuePathProgress } from "../lib/revenue-path.ts"

const empty = getRevenuePathProgress([], [])
assert.deepEqual(empty, { customers: 0, quotes: 0, sentQuotes: 0, acceptedQuotes: 0, invoices: 0, paidInvoices: 0, nextStep: 0 })

const partial = getRevenuePathProgress(
  [{ id: "customer-1" }],
  [
    { id: "quote-1", type: "quote", status: "sent" },
    { id: "quote-2", type: "quote", status: "accepted" },
    { id: "invoice-1", type: "invoice", status: "draft" },
  ],
)
assert.equal(partial.customers, 1)
assert.equal(partial.quotes, 2)
assert.equal(partial.sentQuotes, 2)
assert.equal(partial.acceptedQuotes, 1)
assert.equal(partial.invoices, 1)
assert.equal(partial.paidInvoices, 0)
assert.equal(partial.nextStep, 5)

const complete = getRevenuePathProgress(
  [{ id: "customer-1" }],
  [{ id: "quote-1", type: "quote", status: "invoiced" }, { id: "invoice-1", type: "invoice", status: "paid" }],
)
assert.equal(complete.nextStep, 0)

console.log("Revenue Path logic tests passed")
