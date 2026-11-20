import test from "node:test";
import assert from "node:assert/strict";
import { simulateHubspotFlow as simulate } from "../src/hubspot-synthetic-flow.js";
const claim = n => ({ claimed: true, eventId: "event_1", eventType: "lead_upsert", claimAttempts: n });
const user = { email: "lead@example.com", emailVerified: true, workspace: { customers: ["NEVER_SEND"] } };
const opts = { claim: claim(1), user, approvedIdentity: true, legalBasisApproved: true, noticeProvided: true };
test("first synthetic claim calls fake provider with email only and never finalizes", async () => {
  let count = 0;
  const result = await simulate({ ...opts, fakeProvider: async draft => {
    count++;
    assert.deepEqual(draft.body, { inputs: [{ id: "lead@example.com", idProperty: "email", properties: { email: "lead@example.com" } }] });
    return { status: 200, body: { results: [{ id: "synthetic_123", properties: { email: "lead@example.com" } }] } };
  } });
  assert.equal(count, 1);
  assert.deepEqual(result, { action: "manual_review", reason: "identity_correlated_not_verified", providerCalled: true });
});
test("reclaimed lease cannot invoke fake provider", async () => {
  let count = 0;
  const result = await simulate({ ...opts, claim: claim(2), fakeProvider: async () => { count++; return {}; } });
  assert.equal(count, 0);
  assert.deepEqual(result, { action: "block", reason: "reconciliation_required", providerCalled: false });
});
test("suppression blocks fake provider", async () => {
  let count = 0;
  const result = await simulate({ ...opts, suppressed: true, fakeProvider: async () => { count++; return {}; } });
  assert.equal(count, 0);
  assert.equal(result.reason, "suppressed");
});
test("missing legal basis blocks", async () => assert.equal((await simulate({ ...opts, legalBasisApproved: false })).reason, "privacy_gate"));
test("unapproved identity blocks", async () => assert.equal((await simulate({ ...opts, approvedIdentity: false })).reason, "identity_not_approved"));
test("no injected provider blocks", async () => assert.equal((await simulate(opts)).reason, "synthetic_provider_required"));
test("timeout is never treated as failed delivery or retry authorization", async () => assert.deepEqual(await simulate({ ...opts, fakeProvider: async () => { throw Error("timeout"); } }), { action: "manual_review", reason: "provider_outcome_unknown", providerCalled: true }));
test("429 requires manual review", async () => assert.equal((await simulate({ ...opts, fakeProvider: async () => ({ status: 429 }) })).reason, "ambiguous_provider_outcome"));
test("partial success requires manual review", async () => assert.equal((await simulate({ ...opts, fakeProvider: async () => ({ status: 207 }) })).reason, "partial_result"));
test("identity mismatch requires manual review", async () => assert.equal((await simulate({ ...opts, fakeProvider: async () => ({ status: 200, body: { results: [{ id: "123", properties: { email: "other@example.com" } }] } }) })).reason, "identity_mismatch"));
