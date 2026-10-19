import assert from "node:assert/strict"
import { PLAN_LIMITS, resolveAssistantPlan } from "../../src/assistant-plan.js"

assert.deepEqual(PLAN_LIMITS, { basic: 50, premium: 300, pro: 1000 })
assert.deepEqual(resolveAssistantPlan({ plan: "basic" }).limit, 50)
assert.deepEqual(resolveAssistantPlan({ plan: "premium" }).limit, 300)
assert.deepEqual(resolveAssistantPlan({ plan: "pro" }).limit, 1000)

const enterprise = resolveAssistantPlan({ plan: "enterprise" })
assert.equal(enterprise.plan, "enterprise")
assert.equal(enterprise.limit, null)
assert.equal(enterprise.assistantAvailable, false)
assert.equal(enterprise.reason, "custom-entitlement-required")

assert.equal(resolveAssistantPlan({ plan: "enterprise" }).limit, null)
assert.equal(resolveAssistantPlan({ plan: "unknown" }).limit, 50)
assert.equal(resolveAssistantPlan(null).limit, 50)

console.log("ASSISTANT ENTERPRISE QUOTA AUDIT PASSED")
