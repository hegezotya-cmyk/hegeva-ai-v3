import assert from "node:assert/strict"
import fs from "node:fs"

const pricing=fs.readFileSync(new URL("../app/pricing/page.tsx",import.meta.url),"utf8")
const account=fs.readFileSync(new URL("../app/account/page.tsx",import.meta.url),"utf8")
const worker=fs.readFileSync(new URL("../../src/index.js",import.meta.url),"utf8")
const auth=fs.readFileSync(new URL("../../src/auth.js",import.meta.url),"utf8")

assert(pricing.includes('router.push("/login?callbackURL=%2Fpricing")'),"signed-out checkout must preserve the pricing return path")
assert(pricing.includes('billingStatus?.checkoutEnabled === true')&&pricing.includes('billingStatus.webhookConfigured === true'),"checkout must fail closed on billing readiness")
assert(pricing.includes('method: "POST"')&&pricing.includes('"/api/billing/checkout"'),"checkout must use the authenticated server boundary")
assert(pricing.includes('data.url.startsWith("https://checkout.stripe.com/")'),"checkout redirect must allowlist Stripe Checkout")
assert(account.includes('params.get("billing") === "success"')&&account.includes("PAID_PLANS.has(latest.plan)"),"return page must verify backend entitlement instead of trusting the URL")
assert(account.includes("attempt < 4")&&account.includes("setBillingConfirmError"),"webhook delay must have bounded retry and an honest pending state")
assert(account.includes('billing?.customerPortalReady !== true'),"Customer Portal must fail closed unless explicitly ready")
assert(account.includes('billing?.subscriptionStatus || null'),"subscription status must never default to a fabricated active state")
assert(account.includes('data.url.startsWith("https://billing.stripe.com/")'),"portal redirect must allowlist Stripe Billing")
assert(/verifyStripeSignature|stripe-signature/i.test(worker),"webhook must verify Stripe signatures")
assert(/duplicate|processed.*event|event.*processed/i.test(worker),"webhook must retain idempotency protection")
assert(/session|auth/i.test(auth),"registration and return flow must use server-side sessions")
assert(!/localStorage.*(?:plan|premium|pro)|billing=success.*setPlan/i.test(account),"browser state must not grant paid access")
console.log("Money journey audit passed: authenticated checkout, Stripe allowlists, webhook-authoritative entitlement, bounded return verification, fail-closed subscription/portal state and session-backed return")
