import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAssistantTopUpSubscriber } from "../src/assistant-topup.js";

const now = Date.parse("2026-11-09T00:00:00.000Z");
const future = "2026-12-09T00:00:00.000Z";
const eligible = (plan, subscriptionStatus = "active", currentPeriodEnd = future) =>
  isAssistantTopUpSubscriber({ plan, subscriptionStatus, currentPeriodEnd }, now);

assert.equal(eligible("premium"), true, "active Premium subscriber may buy top-up");
assert.equal(eligible("pro"), true, "active Pro subscriber may buy top-up");
assert.equal(eligible("PREMIUM", "ACTIVE"), true, "status and plan comparison is normalized");
assert.equal(eligible("basic"), false, "Basic/free plan cannot buy top-up");
assert.equal(eligible("premium", "canceled"), false, "canceled subscription cannot buy top-up");
assert.equal(eligible("premium", "trialing"), false, "trial is not a paid monthly subscription");
assert.equal(eligible("premium", "past_due"), false, "past-due subscription cannot buy top-up");
assert.equal(eligible("premium", "active", "2026-11-08T23:59:59.999Z"), false, "expired billing period cannot buy top-up");
assert.equal(eligible("premium", "active", null), false, "missing billing period fails closed");

const api = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const routeStart = api.indexOf('if (url.pathname === "/api/billing/topup/checkout")');
const eligibilityCheck = api.indexOf("isAssistantTopUpSubscriber(topUpEligibility)", routeStart);
const stripeCheckout = api.indexOf("createStripeTopUpCheckoutSession(request, env, user, pack)", routeStart);
assert(routeStart >= 0 && eligibilityCheck > routeStart && stripeCheckout > eligibilityCheck,
  "server eligibility check must run before Stripe Checkout is created");
assert.match(api.slice(routeStart, stripeCheckout), /currentPeriodEnd/);
assert.match(api.slice(routeStart, stripeCheckout), /status:\s*403/);

const accountPage = readFileSync(new URL("../v0-app/app/account/page.tsx", import.meta.url), "utf8");
assert.match(accountPage, /const canBuyTopUp = Boolean/);
assert.match(accountPage, /subscriptionStatus\?\.toLowerCase\(\) === "active"/);
assert.match(accountPage, /periodEnd\.getTime\(\) > Date\.now\(\)/);
assert.match(accountPage, /canBuyTopUp \? <div/);

console.log("Top-Up active monthly subscription eligibility regression: PASS");
