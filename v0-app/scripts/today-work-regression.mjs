import assert from "node:assert/strict"
import fs from "node:fs"
import { test } from "node:test"

let todayWork
try {
  todayWork = await import("../lib/today-work.ts")
} catch {}

test("today work derives only actionable records and orders the most urgent first", () => {
  assert.equal(typeof todayWork?.buildTodayWork, "function", "buildTodayWork must exist")
  const items = todayWork.buildTodayWork({
    today: "2026-10-18",
    tasks: [
      { id: "task-overdue", title: "Call supplier", due: "2026-10-17", priority: "high", done: false },
      { id: "task-done", title: "Done", due: "2026-10-17", priority: "high", done: true },
      { id: "task-future", title: "Future", due: "2026-10-19", priority: "high", done: false },
    ],
    customers: [
      { id: "customer-due", title: "Smith Renovations", followUp: "2026-10-18", customerStatus: "lead" },
      { id: "customer-paused", title: "Paused", followUp: "2026-10-17", customerStatus: "paused" },
    ],
    documents: [
      { id: "invoice-overdue", type: "invoice", status: "sent", number: "INV-12", clientName: "Jones", dueDate: "2026-10-10" },
      { id: "quote-overdue", type: "quote", status: "sent", number: "QUO-8", clientName: "Brown", dueDate: "2026-10-15" },
      { id: "invoice-paid", type: "invoice", status: "paid", number: "INV-PAID", dueDate: "2026-10-01" },
      { id: "quote-draft", type: "quote", status: "draft", number: "QUO-DRAFT", dueDate: "2026-10-01" },
    ],
  })

  assert.deepEqual(items.map((item) => item.id), [
    "invoice:invoice-overdue",
    "quote:quote-overdue",
    "customer:customer-due",
    "task:task-overdue",
  ])
  assert.equal(items[0].href, "/business/invoices")
  assert.equal(items[2].href, "/business/customers")
  assert.equal(items[3].href, "/business/planner")
})

test("today work includes undated open tasks without labelling them overdue", () => {
  assert.equal(typeof todayWork?.buildTodayWork, "function", "buildTodayWork must exist")
  const [item] = todayWork.buildTodayWork({
    today: "2026-10-18",
    tasks: [{ id: "task-undated", title: "Order paint", priority: "medium", done: false }],
    customers: [],
    documents: [],
  })
  assert.equal(item.id, "task:task-undated")
  assert.equal(item.overdue, false)
})

test("today work hides invoices whose payment follow-up is intentionally paused", () => {
  const documents = [{ id: "invoice-overdue", type: "invoice", status: "sent", number: "INV-12", dueDate: "2026-10-10" }]
  assert.equal(todayWork.buildTodayWork({ today: "2026-10-18", tasks: [], customers: [], documents, paymentFollowUps: [{ invoiceId: "invoice-overdue", state: "paused" }] }).length, 0)
  assert.equal(todayWork.buildTodayWork({ today: "2026-10-18", tasks: [], customers: [], documents, paymentFollowUps: [{ invoiceId: "invoice-overdue", state: "promised", promisedDate: "2026-10-21" }] }).length, 0)
  assert.equal(todayWork.buildTodayWork({ today: "2026-10-18", tasks: [], customers: [], documents, paymentFollowUps: [{ invoiceId: "invoice-overdue", state: "active" }] }).length, 1)
})

test("planner presents the derived daily work from existing workspace records", () => {
  const planner = fs.readFileSync(new URL("../components/business/planner.tsx", import.meta.url), "utf8")
  assert.match(planner, /useWorkspaceData<Customer>\("customers"\)/)
  assert.match(planner, /useWorkspaceData<Document>\("invoice_documents"\)/)
  assert.match(planner, /useWorkspaceData<PaymentFollowUpRecord>\("payment_followup_records"\)/)
  assert.match(planner, /buildTodayWork/)
  assert.match(planner, /Mai teendők/)
  assert.match(planner, /Semmi nem kerül automatikusan elküldésre/)
})

