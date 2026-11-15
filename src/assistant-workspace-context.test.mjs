import assert from "node:assert/strict"
import { readAssistantWorkspaceContext, summarizeAssistantWorkspaceData } from "./assistant-workspace-context.js"

const summary = summarizeAssistantWorkspaceData({
  customers: JSON.stringify([{ id: "private-customer", email: "private@example.com" }]),
  documents: "invalid-json",
  expenses: JSON.stringify([{ amount: 12.5, currency: "GBP" }, { amount: 99, currency: "USD" }, null]),
  planner: JSON.stringify([{ due: "2026-11-14", done: false }, { due: "2026-11-15", done: false }, { due: "2026-11-14", done: true }]),
  invoice_documents: JSON.stringify([
    { type: "invoice", status: "sent", dueDate: "2026-11-14", currency: "GBP", items: [{ quantity: 2, unitPrice: 10 }], vatRate: 20 },
    { type: "invoice", status: "paid", dueDate: "2026-11-10", items: [{ quantity: 1, unitPrice: 5 }] },
    { type: "quote", status: "draft", dueDate: "2026-11-10", items: [{ quantity: 1, unitPrice: 30 }] },
  ]),
  messages: JSON.stringify([
    { sourceId: "invoice-1", workflowStatus: "draft" },
    { sourceId: "invoice-2", workflowStatus: "approved" },
    { workflowStatus: "draft" },
  ]),
  goal_mode: JSON.stringify([
    { goal: "private goal text", state: "approved", plan: { target: 999 } },
    { goal: "another private goal", state: "draft" },
  ]),
}, "2026-11-15")

assert.match(summary, /customers=1/)
assert.match(summary, /documents=0/)
assert.match(summary, /expenses_total_GBP=12\.50/)
assert.match(summary, /open_tasks=2/)
assert.match(summary, /tasks_due_today=1/)
assert.match(summary, /overdue_tasks=1/)
assert.match(summary, /paid_invoices=1/)
assert.match(summary, /open_invoices=1/)
assert.match(summary, /overdue_invoices=1/)
assert.match(summary, /outstanding_GBP=24\.00/)
assert.match(summary, /followups_awaiting_approval=1/)
assert.match(summary, /approved_followups_ready_to_complete=1/)
assert.match(summary, /active_goals=2/)
assert.match(summary, /approved_goals=1/)
assert.equal(summary.includes("private@example.com"), false, "context must not include customer PII")
assert.equal(summary.includes("private goal text"), false, "context must not include goal text")
assert.equal(summary.includes("999"), false, "context must not include goal plan details")

const queryLog = []
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        queryLog.push({ sql, values })
        return { first: async () => ({ data: "[]" }) }
      },
    }
  },
}
const loaded = await readAssistantWorkspaceContext(db, "user-123", "2026-11-15")
assert.match(loaded, /customers=0/)
assert.match(loaded, /active_goals=0/)
assert.equal(queryLog.length, 8)
assert(queryLog.every(({ sql, values }) => sql.includes("WHERE userId = ?1 AND dataType = ?2") && values[0] === "user-123"), "every read must be scoped to the authenticated user")
assert.equal(await readAssistantWorkspaceContext(db, "", "2026-11-15"), null)
assert.equal(await readAssistantWorkspaceContext({ prepare() { throw new Error("offline") } }, "user-123", "2026-11-15"), null)

async function contextFor(goalRows) {
  const queried = []
  const scopedDb = {
    prepare(sql) {
      return {
        bind(userId, type) {
          queried.push(type)
          const row = goalRows[type]
          return { first: async () => row ?? null }
        },
      }
    },
  }
  return { context: await readAssistantWorkspaceContext(scopedDb, "user-123", "2026-11-15"), queried }
}

const canonical = await contextFor({
  goal_mode: { data: JSON.stringify([{ state: "approved" }]) },
  goals: { data: JSON.stringify([{ state: "approved" }, { state: "approved" }]) },
})
assert.match(canonical.context, /active_goals=1/)
assert.match(canonical.context, /approved_goals=1/)

const emptyCanonical = await contextFor({
  goal_mode: { data: "[]" },
  goals: { data: JSON.stringify([{ state: "approved" }]) },
})
assert.match(emptyCanonical.context, /active_goals=0/)
assert.match(emptyCanonical.context, /approved_goals=0/)

const legacyFallback = await contextFor({
  goals: { data: JSON.stringify([{ state: "approved" }]) },
})
assert.match(legacyFallback.context, /active_goals=1/)
assert.match(legacyFallback.context, /approved_goals=1/)
console.log("Assistant workspace context tests passed")
