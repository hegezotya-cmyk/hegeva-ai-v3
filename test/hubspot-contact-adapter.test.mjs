import test from "node:test";
import assert from "node:assert/strict";
import { buildHubspotContact, sendHubspotContact } from "../src/hubspot-contact-adapter.js";

const valid = { enabled: true, purpose: "hegeva_sales_followup", legalBasisApproved: true, noticeProvided: true, user: { id: "u1", email: "LEAD@EXAMPLE.COM", emailVerified: true, workspace: { customers: ["private"] }, name: "Private Name" } };
test("allowlist excludes tenant workspace and names", () => assert.deepEqual(buildHubspotContact(valid), { ok: true, properties: { email: "lead@example.com" } }));
test("disabled adapter never sends", async () => { let called = false; const result = await sendHubspotContact({ ...valid, enabled: false, token: "fake", fetchImpl: async () => { called = true; return { ok: true, status: 201 }; } }); assert.equal(called, false); assert.equal(result.reason, "disabled"); });
test("missing credentials blocks request", async () => assert.equal((await sendHubspotContact({ ...valid, token: "" })).reason, "credentials_unavailable"));
test("no implicit live network request", async () => assert.equal((await sendHubspotContact({ ...valid, token: "fake" })).reason, "transport_not_enabled"));
test("mock transport sends only allowlisted email", async () => { let body; const result = await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async (_url, init) => { body = JSON.parse(init.body); return { ok: true, status: 201 }; } }); assert.deepEqual(result, { sent: false, reason: "provider_acceptance_unverified", status: 201 }); assert.deepEqual(body, { properties: { email: "lead@example.com" } }); });
test("provider rejection reports generic error", async () => assert.deepEqual(await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async () => ({ ok: false, status: 429 }) }), { sent: false, reason: "provider_outcome_unknown", status: 429 }));

test("retry after ambiguous acceptance is blocked without transport", async () => {
  let calls = 0;
  const result = await sendHubspotContact({ ...valid, token: "fake", attempt: 2, fetchImpl: async () => { calls++; return { ok: true, status: 201 }; } });
  assert.equal(result.sent, false);
  assert.equal(result.reason, "retry_requires_reconciliation");
  assert.equal(calls, 0);
});
test("invalid attempt fails closed", async () => {
  let calls = 0;
  const result = await sendHubspotContact({ ...valid, token: "fake", attempt: 0, fetchImpl: async () => { calls++; return { ok: true, status: 201 }; } });
  assert.equal(result.reason, "invalid_attempt");
  assert.equal(calls, 0);
});

test("transport timeout is ambiguous and must not be blindly retried", async () => {
  let calls = 0;
  const result = await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async () => { calls++; throw new Error("network timeout"); } });
  assert.deepEqual(result, { sent: false, reason: "provider_outcome_unknown" });
  assert.equal(calls, 1);
});
test("malformed provider response is ambiguous", async () => {
  const result = await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async () => ({}) });
  assert.deepEqual(result, { sent: false, reason: "provider_outcome_unknown" });
});
test("conflict requires provider reconciliation", async () => {
  const result = await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async () => ({ ok: false, status: 409 }) });
  assert.deepEqual(result, { sent: false, reason: "provider_reconciliation_required", status: 409 });
});

test("all successful HTTP statuses require event reconciliation", async () => {
  for (const status of [200, 201, 202, 204]) {
    const result = await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async () => ({ ok: true, status }) });
    assert.deepEqual(result, { sent: false, reason: "provider_acceptance_unverified", status });
  }
});
test("server failures never authorize automatic retry", async () => {
  for (const status of [429, 500, 502, 503, 504]) {
    const result = await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async () => ({ ok: false, status }) });
    assert.deepEqual(result, { sent: false, reason: "provider_outcome_unknown", status });
  }
});
