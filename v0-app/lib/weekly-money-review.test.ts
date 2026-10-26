import assert from "node:assert/strict"
import type { CoreDecisionResponse } from "./use-core-decision.ts"
// @ts-expect-error Node's local TypeScript runner requires the extension.
import { getWeeklyMoneyReviewState, selectWeeklyMoneyReview } from "./weekly-money-review.ts"

const core = (input: object) => input as CoreDecisionResponse

const review = selectWeeklyMoneyReview(core({
  businessRules: [
    { ruleId: "follow-up", kind: "customer-followups", sourceIds: ["c1"], count: 2, severity: "high", role: "Sales", href: "/business/customers", requiresApproval: true },
    { ruleId: "quote", kind: "stale-quotes", sourceIds: ["q1"], count: 1, severity: "high", role: "Sales", href: "/business/invoices", requiresApproval: true },
    { ruleId: "invoice", kind: "overdue-invoices", sourceIds: ["i1"], count: 3, severity: "high", role: "Finance", href: "/business/invoices", requiresApproval: true },
    { ruleId: "duplicate", kind: "stale-quotes", sourceIds: ["q2"], count: 4, severity: "high", role: "Sales", href: "/business/invoices", requiresApproval: true },
    { ruleId: "ignored", kind: "draft-invoices", sourceIds: ["d1"], count: 5, severity: "low", role: "Finance", href: "/business/invoices", requiresApproval: true },
  ],
  opportunityRadar: [{ id: "payment", kind: "payment-risk", count: 3, amount: 1200, currency: "GBP", confidence: "high", evidence: [], impactValue: 1200, href: "/business/invoices" }],
}))

assert.deepEqual(review, [
  { id: "overdue-invoices", priority: 3, count: 3, amount: 1200, currency: "GBP", href: "/business/invoices?focus=payment-followup" },
  { id: "stale-quotes", priority: 2, count: 1, href: "/business/invoices?focus=quote-followup" },
  { id: "customer-followups", priority: 1, count: 2, href: "/business/customers" },
])
assert.deepEqual(selectWeeklyMoneyReview(core({ businessRules: [{ ruleId: "zero", kind: "overdue-invoices", sourceIds: [], count: 0, severity: "low", role: "Finance", href: "/business/invoices", requiresApproval: true }], opportunityRadar: [] })), [])
assert.equal(getWeeklyMoneyReviewState("ready", []), "empty")
assert.equal(getWeeklyMoneyReviewState("unauthenticated", []), "unauthenticated")
console.log("Weekly money review selector contracts passed.")
