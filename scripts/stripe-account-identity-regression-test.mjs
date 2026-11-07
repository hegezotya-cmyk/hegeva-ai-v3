import assert from "node:assert/strict";
import { createRequestHandler } from "../src/index.js";

const originalFetch = globalThis.fetch;
let calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url: String(url), options });
  return Response.json({ id: "acct_test123", livemode: false });
};
const request = (method = "GET") => new Request("https://staging.hegevaai.co.uk/api/admin/stripe-account-identity", { method });
const owner = { id: "owner-1", email: "owner@example.test" };
const ownerHandler = createRequestHandler({ getLoggedInUserFn: async () => owner });
const env = { ADMIN_EMAIL: "owner@example.test", PAYMENT_MODE: "test", STRIPE_SECRET_KEY: "sk_test_nonsecret_fixture" };

try {
  let response = await ownerHandler.fetch(request(), env, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, accountId: "acct_test123" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.stripe.com/v1/account");
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.headers.Authorization, "Bearer sk_test_nonsecret_fixture");
  assert.match(response.headers.get("Cache-Control"), /no-store/);

  calls = [];
  const anonymous = createRequestHandler({ getLoggedInUserFn: async () => null });
  response = await anonymous.fetch(request(), env, {});
  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);

  const nonOwner = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "user-2", email: "other@example.test" }) });
  response = await nonOwner.fetch(request(), env, {});
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);

  response = await ownerHandler.fetch(request("POST"), env, {});
  assert.equal(response.status, 405);
  assert.equal(calls.length, 0);

  response = await ownerHandler.fetch(request(), { ...env, PAYMENT_MODE: "live" }, {});
  assert.equal(response.status, 503);
  assert.equal(calls.length, 0);

  globalThis.fetch = async () => Response.json({ id: "acct_test123", livemode: true });
  response = await ownerHandler.fetch(request(), env, {});
  assert.equal(response.status, 503, "live account response must fail closed in test mode");

  globalThis.fetch = async () => new Response("private upstream error", { status: 401 });
  response = await ownerHandler.fetch(request(), env, {});
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private upstream error|sk_test_nonsecret_fixture/);
} finally {
  globalThis.fetch = originalFetch;
}
console.log("Stripe account identity diagnostic regression: PASS");
