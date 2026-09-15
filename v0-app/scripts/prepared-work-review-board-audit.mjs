import assert from "node:assert/strict"
import fs from "node:fs"
import { synchronizePreparedWork, transitionPreparedWork } from "../../src/prepared-work-review.js"

const delegations = [
  { role: "Sales", label: "Sales review", title: "Follow up", content: "Review a customer follow-up.", sourceIds: ["customer-1"], targetType: "messages", targetHref: "/business/messages", rationale: "followup-approval-pending", preparedAt: "2026-09-15T12:00:00.000Z" },
  { role: "Finance", label: "Finance review", title: "Payment reminder", content: "Review an overdue invoice.", sourceIds: ["invoice-1"], targetType: "messages", targetHref: "/business/messages", rationale: "overdue-invoice-followup", preparedAt: "2026-09-15T12:01:00.000Z" },
  { role: "Marketing", label: "Marketing review", title: "Campaign brief", content: "Review a campaign brief.", sourceIds: ["campaign-1"], targetType: "creative", targetHref: "/app-studio/advertising", rationale: "marketing-opportunity", preparedAt: "2026-09-15T12:02:00.000Z" },
  { role: "Support", label: "Support review", title: "Task triage", content: "Review a support task.", sourceIds: ["task-1"], targetType: "planner", targetHref: "/business/planner", rationale: "overdue-task", preparedAt: "2026-09-15T12:03:00.000Z" },
]

const first = synchronizePreparedWork([], delegations, "2026-09-15T13:00:00.000Z")
assert.equal(first.created, 4)
assert.deepEqual(first.records.map((item) => item.role), ["Sales", "Finance", "Marketing", "Support"])
for (const item of first.records) {
  assert.equal(item.status, "awaiting-review")
  assert.equal(item.preparationStatus, "prepared")
  assert.equal(item.deliveryStatus, "not-sent")
  assert.equal(item.executionStatus, "not-executed")
  assert.equal(item.createdAt, "2026-09-15T13:00:00.000Z")
  assert.equal(item.updatedAt, "2026-09-15T13:00:00.000Z")
  assert.deepEqual(item.sourceIds.length, 1)
  assert.ok(item.rationale)
  assert.ok(item.id.startsWith("prepared-work:"))
}
const repeated = synchronizePreparedWork(first.records, delegations, "2026-09-15T14:00:00.000Z")
assert.equal(repeated.created, 0, "repeated Core synchronization must be idempotent")
assert.deepEqual(repeated.records, first.records, "idempotent synchronization must preserve prior records and timestamps")
assert.equal(synchronizePreparedWork([...first.records, {}], delegations, "2026-09-15T14:00:00.000Z").ok, false, "invalid persisted records must fail closed instead of being discarded")

const finance = first.records.find((item) => item.role === "Finance")
const approved = transitionPreparedWork(first.records, finance.id, "approve", { actorHash: "actor-hash", now: "2026-09-15T14:00:00.000Z" })
assert.equal(approved.ok, true)
assert.equal(approved.record.status, "approved")
assert.equal(approved.record.audit.at(-1).event, "approved")
const completed = transitionPreparedWork(approved.records, finance.id, "complete-locally", { actorHash: "actor-hash", now: "2026-09-15T15:00:00.000Z" })
assert.equal(completed.ok, true)
assert.equal(completed.record.status, "completed-locally")
assert.equal(completed.record.deliveryStatus, "not-sent")
assert.equal(completed.record.executionStatus, "not-executed")
const cancelled = transitionPreparedWork(first.records, finance.id, "cancel", { actorHash: "actor-hash", now: "2026-09-15T14:00:00.000Z" })
assert.equal(cancelled.ok, true)
assert.equal(cancelled.record.status, "cancelled")
assert.equal(transitionPreparedWork(completed.records, finance.id, "approve", { actorHash: "actor-hash", now: "2026-09-15T16:00:00.000Z" }).ok, false, "completed work must not re-enter approval")

const worker = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
for (const endpoint of ["/api/prepared-work/sync", "/api/prepared-work/review"]) assert(worker.includes(`"${endpoint}"`), `missing ${endpoint}`)
assert(worker.includes('dataType = "prepared_work"') || worker.includes("dataType = 'prepared_work'"), "prepared work must use the existing tenant-scoped workspace persistence")
assert(!worker.includes("CREATE TABLE") && !worker.includes("ALTER TABLE"), "Review Board must not add schema mutation behavior")
assert(worker.includes("ON CONFLICT(userId, dataType) DO NOTHING"), "first queue creation must be conflict-safe")

const board = fs.readFileSync(new URL("../components/command-center/prepared-work-review-board.tsx", import.meta.url), "utf8")
for (const token of ["PREPARED", "AWAITING REVIEW", "APPROVED", "CANCELLED", "COMPLETED LOCALLY", "Sales", "Finance", "Marketing", "Support"]) assert(board.includes(token), `missing ${token}`)
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert(board.includes(locale), `missing ${locale} locale copy`)
assert(board.includes('role="alert"'), "Review Board must visibly report unavailable queue operations")
assert(!/AIBotExecution|\/api\/ai-bot\/execute|\/api\/ai-bot\/canary-once|sendMail|sendEmail|mailto:|googleapis|graph\.microsoft|stripe|payment/i.test(board), "Review Board must not expose provider or external execution")
console.log("Prepared Work Review Board audit passed: idempotent evidence-preserving queue, explicit owner lifecycle, five locales, and no external execution.")
