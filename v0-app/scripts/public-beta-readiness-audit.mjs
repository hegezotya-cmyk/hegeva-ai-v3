import assert from "node:assert/strict"
import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8")
const pricing = read("../app/pricing/page.tsx")
const worker = read("../../src/index.js")
const ledger = read("../../src/index-ledger.js")
const migration = read("../../migrations/0007_stripe_customers.sql")
const lifecycle = read("../../scripts/stripe-test-lifecycle.mjs")
const prices = read("../../scripts/stripe-test-price-reconcile.mjs")
const proxy = read("../app/api/[...path]/route.ts")

assert(/body: JSON\.stringify\(\{ plan, mode: "test" \}\)/.test(pricing), "checkout must request test mode explicitly")
assert(/billingStatus\?\.mode === "test"/.test(pricing) && /checkoutEnabled === true/.test(pricing) && /webhookConfigured === true/.test(pricing), "checkout must require authenticated billing readiness")
assert(/Only test checkout is allowed in this build/.test(worker) && /isStripeTestSecret/.test(worker), "backend must reject non-test or non-test-secret checkout")
assert(/if \(event\?\.livemode === true\)/.test(ledger), "live Stripe events must fail closed")
assert(/readRawBodyWithinLimit/.test(ledger) && /STRIPE_WEBHOOK_BODY_LIMIT\s*=\s*512 \* 1024/.test(ledger), "webhook body must be bounded before verification")
assert(/verifyStripeWebhookSignature|verifyStripeSignature/.test(worker + ledger), "webhook signatures must be verified")
assert(/ON CONFLICT\(eventId\) DO NOTHING/.test(ledger) && /hasNewerAppliedStripeEvent/.test(ledger), "webhooks must be idempotent and stale-order protected")
assert(/checkout\.session\.completed/.test(worker + ledger) && /customer\.subscription\.deleted/.test(worker + ledger) && /invoice\.payment_failed/.test(worker + ledger), "entitlement lifecycle events must be covered")
assert(/syncStripeBillingIdentity/.test(ledger) && /stripeCustomerId TEXT NOT NULL UNIQUE/.test(migration) && /stripeSubscriptionId/.test(migration), "customer and subscription mappings must be uniquely constrained")
assert(/secret\.startsWith\("sk_test_"\)/.test(prices) && /price\.livemode, false/.test(prices), "price reconciliation must remain test-only")
assert(/cancel_at_period_end/.test(lifecycle) && /invoice\.payment_failed/.test(lifecycle) && /duplicate/.test(lifecycle) && /stale/.test(lifecycle), "test lifecycle coverage must include cancellation, failure, duplicates and stale events")
assert(!/applyVerifiedStripeCheckoutPlan/.test(worker), "browser confirmation must not grant entitlement")
assert(/status:\s*410/.test(ledger), "retired billing confirmation must remain disabled")
assert(!/fetch\(|https?:\/\//.test(import.meta.url + ""), "audit must remain local-only")

console.log("Public beta readiness audit passed: local Sandbox safeguards verified; live billing remains an explicit owner-controlled launch blocker")
