// In-memory test of the real account-page conversion gate. No network, Stripe or user accounts.
import assert from "node:assert/strict"
import fs from "node:fs"

const source = fs.readFileSync(new URL("../app/account/page.tsx", import.meta.url), "utf8")
const match = source.match(/    const loadPlan = async \(\) => \{[\s\S]*?\n    \}\n\n    loadPlan\(\)\.catch/)
assert.ok(match, "account checkout-return entitlement gate must be present")
const definition = match[0].replace(/\n\n    loadPlan\(\)\.catch$/, "")
const makeLoadPlan = new Function("window", "fetchPlan", "PAID_PLANS", "setPlanError", "setPlan", "setBillingSuccess", "setBillingConfirmError", "trackSubscriptionSuccess", "clearBillingQuery", "active", definition + "\nreturn loadPlan")

async function scenario({ name, returnMarker, plans, expectedEvents, expectedClears, expectedPending, expectedCalls }) {
  const seen = { events: [], clears: 0, pending: [], success: [], plans: [], calls: 0 }
  const window = {
    location: { search: returnMarker ? "?billing=success" : "" },
    setTimeout(callback) { callback(); return 1 },
  }
  const fetchPlan = async () => {
    const index = Math.min(seen.calls, plans.length - 1)
    seen.calls += 1
    return { plan: plans[index], period: "2026-11" }
  }
  const loadPlan = makeLoadPlan(
    window, fetchPlan, new Set(["premium", "pro"]),
    (value) => assert.equal(value, false),
    (value) => seen.plans.push(value.plan),
    (value) => seen.success.push(value),
    (value) => seen.pending.push(value),
    (plan, period) => seen.events.push({ plan, period }),
    () => { seen.clears += 1 },
    true,
  )
  await loadPlan()
  assert.equal(seen.events.length, expectedEvents, name + ": subscription conversion count")
  assert.equal(seen.clears, expectedClears, name + ": billing query cleared only after paid entitlement")
  assert.equal(seen.calls, expectedCalls, name + ": entitlement retry count")
  assert.deepEqual(seen.pending, expectedPending, name + ": confirmation state")
  if (expectedEvents) assert.deepEqual(seen.events[0], { plan: "premium", period: "2026-11" })
}
await scenario({ name: "confirmed paid return", returnMarker: true, plans: ["premium"], expectedEvents: 1, expectedClears: 1, expectedPending: [""], expectedCalls: 1 })
await scenario({ name: "delayed webhook entitlement", returnMarker: true, plans: ["basic", "basic", "premium"], expectedEvents: 1, expectedClears: 1, expectedPending: [""], expectedCalls: 3 })
await scenario({ name: "unconfirmed checkout", returnMarker: true, plans: ["basic"], expectedEvents: 0, expectedClears: 0, expectedPending: ["entitlement_pending"], expectedCalls: 5 })
await scenario({ name: "plan without checkout return", returnMarker: false, plans: ["premium"], expectedEvents: 0, expectedClears: 0, expectedPending: [], expectedCalls: 1 })
console.log("Subscription entitlement flow audit: PASS (paid, pending, delayed, direct; no billing/Stripe network)")
