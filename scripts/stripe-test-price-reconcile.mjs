import assert from "node:assert/strict";

const secret = String(process.env.STRIPE_TEST_SECRET_KEY || "");
assert(secret.startsWith("sk_test_"), "STRIPE_TEST_SECRET_KEY must be a Stripe test secret; live keys are rejected");

const expected = [
  ["Premium", String(process.env.STRIPE_PREMIUM_PRICE_ID || ""), 1499],
  ["Pro", String(process.env.STRIPE_PRO_PRICE_ID || ""), 2999],
];

for (const [name, priceId, amount] of expected) {
  assert(priceId.startsWith("price_"), `${name} test Price ID is missing`);
  const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const price = await response.json().catch(() => null);
  assert.equal(response.ok, true, `${name} Price lookup failed (${response.status}): ${price?.error?.message || "unknown Stripe error"}`);
  assert.equal(price.livemode, false, `${name} Price must be a test-mode object`);
  assert.equal(price.active, true, `${name} Price must be active`);
  assert.equal(price.currency, "gbp", `${name} Price must use GBP`);
  assert.equal(price.unit_amount, amount, `${name} Price must be £${(amount / 100).toFixed(2)}`);
  assert.equal(price.type, "recurring", `${name} Price must be recurring`);
  assert.equal(price.recurring?.interval, "month", `${name} Price must recur monthly`);
}

console.log("Stripe test prices reconciled: Premium £14.99/month and Pro £29.99/month, active GBP recurring test Prices");
