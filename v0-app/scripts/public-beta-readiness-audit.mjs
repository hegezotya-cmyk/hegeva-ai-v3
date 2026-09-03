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

assert(/body: JSON\.stringify\(\{ plan, mode: billingMode \}\)/.test(pricing), "checkout must request the backend-declared payment mode")
assert(/billingStatus\?\.mode === "test"/.test(pricing) && /billingStatus\?\.mode === "live"/.test(pricing) && /checkoutEnabled === true/.test(pricing) && /webhookConfigured === true/.test(pricing), "checkout must require authenticated billing readiness")
assert(/requestedMode !== paymentMode/.test(worker) && /isStripeSecretForMode/.test(worker), "backend must reject payment-mode and secret-mode mismatches")
assert(/eventMatchesMode/.test(ledger), "cross-mode Stripe events must fail closed")
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

console.log("Public beta readiness audit passed: local payment safeguards verified; live billing remains an explicit owner-controlled launch step")
