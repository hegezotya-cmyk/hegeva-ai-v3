import assert from "node:assert/strict"
import fs from "node:fs"
import { prepareEmployeeDelegations } from "../../src/core-v1-decision.js"

const preparedActions = [
  { kind: "followup-message", status: "prepared", title: "Follow up: Northwind", content: "Review the follow-up.", sourceIds: ["customer-1"], targetType: "messages", targetHref: "/business/messages", reason: "followup-approval-pending", preparedAt: "2026-09-15T12:00:00.000Z" },
  { kind: "invoice-followup", status: "prepared", title: "Payment reminder: INV-1", content: "Prepare payment reminder.", sourceIds: ["invoice-1"], targetType: "messages", targetHref: "/business/messages", reason: "overdue-invoice-followup", preparedAt: "2026-09-15T12:01:00.000Z" },
  { kind: "creative-brief", status: "prepared", title: "Create marketing asset", content: "Prepare a campaign brief.", sourceIds: ["campaign-1"], targetType: "creative", targetHref: "/app-studio/advertising", reason: "marketing-opportunity", preparedAt: "2026-09-15T12:02:00.000Z" },
  { kind: "task", status: "prepared", title: "Task: Triage queue", content: "Review the support queue.", sourceIds: ["task-1"], targetType: "planner", targetHref: "/business/planner", reason: "overdue-task", preparedAt: "2026-09-15T12:03:00.000Z" },
  { kind: "invoice-followup", status: "prepared", title: "Payment reminder: INV-2", content: "Prepare another payment reminder.", sourceIds: ["invoice-2"], targetType: "messages", targetHref: "/business/messages", reason: "overdue-invoice-followup", preparedAt: "2026-09-15T12:04:00.000Z" },
]

for (const locale of ["en", "hu", "de", "fr", "es"]) {
  const delegations = prepareEmployeeDelegations(preparedActions, locale)
  assert.deepEqual(delegations.map((item) => item.role), ["Sales", "Finance", "Marketing", "Support"], `${locale} must deterministically cover each eligible employee role once`)
  assert.equal(new Set(delegations.map((item) => item.role)).size, delegations.length, "each employee role must receive at most one delegation")
  for (const delegation of delegations) {
    assert.equal(delegation.status, "awaiting-approval")
    assert.equal(delegation.preparationStatus, "prepared-only")
    assert.equal(delegation.deliveryStatus, "not-sent")
    assert.equal(delegation.executionStatus, "not-executed")
    assert.equal(delegation.sourceIds.length, 1)
    assert.ok(delegation.rationale)
    assert.ok(delegation.targetHref.startsWith("/"))
    assert.ok(delegation.label)
  }
}

assert.deepEqual(prepareEmployeeDelegations([{ ...preparedActions[1], status: "approved" }], "en"), [], "only Core prepared actions may be delegated")
assert.deepEqual(prepareEmployeeDelegations([{ ...preparedActions[1], sourceIds: [] }], "en"), [], "delegations require linked workspace evidence")

const component = fs.readFileSync(new URL("../components/command-center/ai-employee-delegations.tsx", import.meta.url), "utf8")
for (const role of ["Sales", "Finance", "Marketing", "Support"]) assert(component.includes(role), `missing ${role} employee role`)
for (const token of ["AWAITING APPROVAL", "PREPARED ONLY", "NOT SENT", "NOT EXECUTED"]) assert(component.includes(token), `missing explicit ${token} safety state`)
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert(component.includes(locale), `missing ${locale} locale copy`)
assert(!/fetch\(|AIBotExecution|\/api\/ai-bot\/execute|\/api\/ai-bot\/canary-once|sendMail|sendEmail|mailto:|googleapis|graph\.microsoft|stripe|payment/i.test(component), "AI Employees must remain presentation-only with no external execution path")

const worker = fs.readFileSync(new URL("../../src/core-v1-decision.js", import.meta.url), "utf8")
assert(!/fetch\(|sendMail|sendEmail|mailto:|googleapis|graph\.microsoft|stripe|payment/i.test(worker.slice(worker.indexOf("function prepareEmployeeDelegations"))), "employee delegation must be deterministic and side-effect free")
console.log("AI Employees orchestration audit passed: deterministic four-role prepared delegation, evidence preservation, five locales, and no external execution.")
