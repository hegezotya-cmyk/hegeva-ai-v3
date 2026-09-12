import assert from "node:assert/strict";
import crypto from "node:crypto";

const baseUrl = String(process.env.HEGEVA_TEST_BASE_URL || "").replace(/\/$/, "");
const webhookSecret = String(process.env.STRIPE_TEST_WEBHOOK_SECRET || "");
const userId = String(process.env.HEGEVA_TEST_USER_ID || "stripe-lifecycle-user");

assert(baseUrl.startsWith("http://127.0.0.1:") || baseUrl.startsWith("http://localhost:"), "HEGEVA_TEST_BASE_URL must be a local HTTP URL");
assert(webhookSecret.startsWith("whsec_") && !webhookSecret.includes("live"), "A non-live STRIPE_TEST_WEBHOOK_SECRET is required");

function sign(body, timestamp = Math.floor(Date.now() / 1000)) {
  const digest = crypto.createHmac("sha256", webhookSecret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

async function send(event) {
  const body = JSON.stringify(event);
  const response = await fetch(`${baseUrl}/api/billing/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": sign(body) },
    body,
  });
  const data = await response.json().catch(() => null);
  assert.equal(response.ok, true, `${event.type} failed (${response.status}): ${JSON.stringify(data)}`);
  return data;
}

async function sendExpecting(event, expectedStatus) {
  const body = JSON.stringify(event);
  const response = await fetch(`${baseUrl}/api/billing/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": sign(body) },
    body,
  });
  assert.equal(response.status, expectedStatus, `${event.type} should return ${expectedStatus}`);
  return response.json().catch(() => null);
}

const now = Math.floor(Date.now() / 1000);
const metadata = { userId, hegevaPlan: "premium" };
const checkout = {
  id: `evt_checkout_${now}`, object: "event", type: "checkout.session.completed", created: now,
  livemode: false, data: { object: { id: `cs_test_${now}`, mode: "subscription", payment_status: "paid", customer: `cus_test_${now}`, subscription: `sub_test_${now}`, metadata } },
};

const unauthenticatedPortal = await fetch(`${baseUrl}/api/billing/portal`, { method: "POST" });
assert.equal(unauthenticatedPortal.status, 401, "Customer Portal must require an authenticated account");

const liveRejection = await sendExpecting({ ...checkout, id: `evt_live_${now}`, livemode: true }, 400);
assert.match(String(liveRejection?.error || ""), /Stripe event mode does not match the active payment mode/, "Test mode must explicitly reject live webhook events");

const checkoutResult = await send(checkout);
assert.equal(checkoutResult.entitlementChanged, true, "Checkout must grant Premium through the verified webhook");
const duplicateResult = await send(checkout);
assert.equal(duplicateResult.duplicate, true, "Duplicate webhook must be ignored idempotently");

const scheduledCancellation = await send({
  id: `evt_cancel_scheduled_${now}`, object: "event", type: "customer.subscription.updated", created: now + 10,
  livemode: false, data: { object: { id: `sub_test_${now}`, customer: `cus_test_${now}`, status: "active", cancel_at_period_end: true, current_period_end: now + 86400, metadata } },
});
assert.equal(scheduledCancellation.entitlementChanged, false, "Cancel-at-period-end must preserve access until termination");

const renewal = await send({
  id: `evt_renewal_${now}`, object: "event", type: "invoice.paid", created: now + 20,
  livemode: false, data: { object: { id: `in_test_${now}`, customer: `cus_test_${now}`, status: "paid", parent: { subscription_details: { subscription: `sub_test_${now}`, metadata } } } },
});
assert.equal(renewal.resultingPlan, "premium", "Paid renewal must preserve Premium");

const failedPayment = await send({
  id: `evt_failed_${now}`, object: "event", type: "invoice.payment_failed", created: now + 30,
  livemode: false, data: { object: { id: `in_failed_${now}`, customer: `cus_test_${now}`, parent: { subscription_details: { subscription: `sub_test_${now}`, metadata } } } },
});
assert.equal(failedPayment.entitlementChanged, false, "A single failed invoice must not immediately revoke access");

const terminal = await send({
  id: `evt_terminal_${now}`, object: "event", type: "customer.subscription.updated", created: now + 40,
  livemode: false, data: { object: { id: `sub_test_${now}`, customer: `cus_test_${now}`, status: "unpaid", cancel_at_period_end: false, metadata } },
});
assert.equal(terminal.resultingPlan, "basic", "Terminal unpaid subscription must revoke paid entitlement");

const stale = await send({ ...checkout, id: `evt_stale_${now}`, created: now - 100 });
assert.equal(stale.stale, true, "Older events must not overwrite a newer applied lifecycle event");

console.log("Stripe test lifecycle passed: portal authentication, live-event rejection, checkout, duplicate, scheduled cancellation, renewal, payment failure, terminal downgrade, and stale-event protection");
