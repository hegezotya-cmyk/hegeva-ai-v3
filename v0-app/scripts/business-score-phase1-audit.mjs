import assert from "node:assert/strict"
import { calculateBusinessScoreFromWorkspace } from "../lib/business-score.ts"

const complete = calculateBusinessScoreFromWorkspace({
  today: "2026-09-22",
  invoices: [
    { id: "invoice-1", type: "invoice", status: "sent", dueDate: "2026-09-04", vatRate: 20, items: [{ quantity: 1, unitPrice: 1000 }] },
    { id: "quote-1", type: "quote", status: "sent", dueDate: "2026-09-10", items: [{ quantity: 1, unitPrice: 600 }] },
  ],
  customers: [{ id: "customer-1", customerStatus: "active", followUp: "2026-09-20" }],
  tasks: [{ id: "task-1", done: false, priority: "high", due: "2026-09-18" }, { id: "task-2", done: false, priority: "medium", due: "2026-09-22" }],
})

assert.equal(complete.state, "ready", "four supported record categories must produce a score")
assert.deepEqual(complete.observedCategories, ["payments", "sales", "customers", "admin"])
assert.equal(complete.score?.categories.payments.score, 55)
assert.equal(complete.score?.categories.sales.score, 60)
assert.equal(complete.score?.categories.customers.score, 85)
assert.equal(complete.score?.categories.admin.score, 86)
assert.equal(complete.score?.overall, 72)
assert.equal(complete.score?.categories.customers.deductions[0]?.code, "customer_followup_due")

const supportedCategoryFixtures = {
  payments: { invoices: [{ id: "invoice-payment", type: "invoice", status: "sent", dueDate: "2026-09-04", items: [{ quantity: 1, unitPrice: 100 }] }], customers: [], tasks: [] },
  sales: { invoices: [{ id: "quote-sales", type: "quote", status: "sent", dueDate: "2026-09-10", items: [{ quantity: 1, unitPrice: 100 }] }], customers: [], tasks: [] },
  customers: { invoices: [], customers: [{ id: "customer-follow-up", customerStatus: "active", followUp: "2026-09-20" }], tasks: [] },
  admin: { invoices: [], customers: [], tasks: [{ id: "planner-due", done: false, priority: "medium", due: "2026-09-22" }] },
}

for (const [first, second, expected] of [
  ["payments", "sales", ["payments", "sales"]],
  ["payments", "customers", ["payments", "customers"]],
  ["payments", "admin", ["payments", "admin"]],
  ["sales", "customers", ["sales", "customers"]],
  ["sales", "admin", ["sales", "admin"]],
  ["customers", "admin", ["customers", "admin"]],
]) {
  const left = supportedCategoryFixtures[first]
  const right = supportedCategoryFixtures[second]
  const result = calculateBusinessScoreFromWorkspace({
    today: "2026-09-22",
    invoices: [...left.invoices, ...right.invoices],
    customers: [...left.customers, ...right.customers],
    tasks: [...left.tasks, ...right.tasks],
  })
  assert.equal(result.state, "ready", `${first} + ${second} must score without a third category`)
  assert.deepEqual(result.observedCategories, expected, `${first} + ${second} must expose only the two evidenced categories`)
  assert.notEqual(result.score, null, `${first} + ${second} must return a truthful aggregate score`)
}

const oneCategoryOnly = calculateBusinessScoreFromWorkspace({
  today: "2026-09-22",
  ...supportedCategoryFixtures.payments,
})
assert.equal(oneCategoryOnly.state, "incomplete", "one supported category must remain incomplete")
assert.equal(oneCategoryOnly.score, null)

const incomplete = calculateBusinessScoreFromWorkspace({ today: "2026-09-22", invoices: [], customers: [], tasks: [] })
assert.equal(incomplete.state, "incomplete", "an empty workspace must not be scored")
assert.equal(incomplete.score, null)

const malformed = calculateBusinessScoreFromWorkspace({
  today: "2026-09-22",
  invoices: [{ id: "bad-invoice", type: "invoice", status: "sent", dueDate: "not-a-date", items: [{ quantity: Number.NaN, unitPrice: Number.POSITIVE_INFINITY }] }],
  customers: [{ id: "customer-2", followUp: "not-a-date" }],
  tasks: [{ id: "task-3", done: false, priority: "high", due: "not-a-date" }],
})
assert.equal(malformed.state, "incomplete", "malformed records must not manufacture score coverage")
assert.equal(malformed.score, null)
assert.equal(JSON.stringify(complete).includes("invoice-1"), false, "score output must not retain document identifiers")
assert.equal(JSON.stringify(complete).includes("customer-1"), false, "score output must not retain customer identifiers")

console.log("Business Score Phase 1 audit: PASS")
