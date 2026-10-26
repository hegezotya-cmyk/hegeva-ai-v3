import assert from "node:assert/strict"
import type { CoreDecisionResponse } from "./use-core-decision.ts"
import { selectMoneyTodayActions } from "./money-today.ts"

const coreWithPaymentRisk = {
  businessRules: [{
    ruleId: "overdue-invoice",
    kind: "overdue-invoices",
    sourceIds: ["invoice-1", "invoice-2"],
    count: 2,
    severity: "high",
    role: "Finance",
    href: "/business/intelligence#customer-follow-up",
    requiresApproval: true,
  }],
  opportunityRadar: [{
    id: "payment-risk",
    kind: "payment-risk",
    count: 2,
    amount: 1200,
    currency: "GBP",
    confidence: "high",
    evidence: ["invoice-1", "invoice-2"],
    impactValue: 1300,
    href: "/business/intelligence#customer-follow-up",
  }],
} as CoreDecisionResponse

assert.deepEqual(selectMoneyTodayActions(coreWithPaymentRisk), [{
  id: "overdue-invoices",
  priority: 3,
  count: 2,
  amount: 1200,
  currency: "GBP",
  href: "/business/intelligence#customer-follow-up",
}])

assert.deepEqual(selectMoneyTodayActions({
  businessRules: [],
  opportunityRadar: [],
} as CoreDecisionResponse), [])

const mixedCurrencyAndDuplicateRules = {
  businessRules: [
    { ruleId: "quote-a", kind: "stale-quotes", sourceIds: ["quote-1"], count: 1, severity: "high", role: "Sales", href: "/business/intelligence#customer-follow-up", requiresApproval: true },
    { ruleId: "follow-up", kind: "customer-followups", sourceIds: ["customer-1"], count: 3, severity: "high", role: "Sales", href: "/business/customers", requiresApproval: true },
    { ruleId: "quote-b", kind: "stale-quotes", sourceIds: ["quote-2"], count: 1, severity: "high", role: "Sales", href: "/business/intelligence#customer-follow-up", requiresApproval: true },
  ],
  opportunityRadar: [{
    id: "quote-leakage",
    kind: "quote-leakage",
    count: 1,
    amount: 850,
    currency: "EUR",
    confidence: "high",
    evidence: ["quote-1"],
    impactValue: 930,
    href: "/business/intelligence#customer-follow-up",
  }],
} as CoreDecisionResponse

assert.deepEqual(selectMoneyTodayActions(mixedCurrencyAndDuplicateRules), [
  { id: "stale-quotes", priority: 2, count: 1, href: "/business/intelligence#customer-follow-up" },
  { id: "customer-followups", priority: 1, count: 3, href: "/business/customers" },
])

console.log("Money Today selector contracts passed.")
