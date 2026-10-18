import assert from "node:assert/strict"
import fs from "node:fs"
import { test } from "node:test"

let followup
try { followup = await import("../lib/payment-followup-state.ts") } catch {}

test("paused and disputed invoices cannot prepare another reminder", () => {
  assert.equal(typeof followup?.paymentFollowUpBlockReason, "function", "paymentFollowUpBlockReason must exist")
  assert.equal(followup.paymentFollowUpBlockReason({ state: "paused" }, "2026-10-18"), "paused")
  assert.equal(followup.paymentFollowUpBlockReason({ state: "disputed" }, "2026-10-18"), "disputed")
})

test("a future promised payment date pauses reminders until that date passes", () => {
  assert.equal(typeof followup?.paymentFollowUpBlockReason, "function", "paymentFollowUpBlockReason must exist")
  assert.equal(followup.paymentFollowUpBlockReason({ state: "promised", promisedDate: "2026-10-21" }, "2026-10-18"), "promised")
  assert.equal(followup.paymentFollowUpBlockReason({ state: "promised", promisedDate: "2026-10-17" }, "2026-10-18"), null)
  assert.equal(followup.paymentFollowUpBlockReason({ state: "active" }, "2026-10-18"), null)
})

test("invoice payment follow-up stores owner state and explains that no message is sent", () => {
  const page = fs.readFileSync(new URL("../app/business/invoices/page.tsx", import.meta.url), "utf8")
  assert.match(page, /useWorkspaceData<PaymentFollowUpRecord>\("payment_followup_records"\)/)
  assert.match(page, /paymentFollowUpBlockReason/)
  assert.match(page, /Fizetést ígért/)
  assert.match(page, /Vitatott/)
  assert.match(page, /Szüneteltetve/)
  assert.match(page, /Az állapot mentése nem küld üzenetet/)
})

