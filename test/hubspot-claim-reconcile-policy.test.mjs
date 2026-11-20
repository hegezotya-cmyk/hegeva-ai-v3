import test from "node:test";
import assert from "node:assert/strict";
import { planHubspotClaimReconciliation as plan } from "../src/hubspot-claim-reconcile-policy.js";
const claim = attempts => ({ claimed: true, eventId: "event_1", eventType: "lead_upsert", claimAttempts: attempts });
test("first claim cannot send through reconciliation bridge", async () => {
  let called = false;
  assert.deepEqual(await plan({ claim: claim(1), lookup: async () => { called = true; } }), { action: "hold", reason: "first_claim_requires_separate_send_authorization" });
  assert.equal(called, false);
});
test("reclaimed lease with no provider record cannot retry", async () => assert.deepEqual(await plan({ claim: claim(2), email: "lead@example.com", lookup: async () => ({ complete: true, results: [] }) }), { action: "manual_review", reason: "prior_write_outcome_unverified" }));
test("reclaimed lease with matching record cannot auto-finalize", async () => assert.equal((await plan({ claim: claim(2), email: "lead@example.com", lookup: async () => ({ complete: true, results: [{ id: "123" }] }) })).action, "manual_review"));
test("suppression blocks before lookup", async () => {
  let called = false;
  const result = await plan({ claim: claim(2), suppressed: true, lookup: async () => { called = true; } });
  assert.equal(result.action, "block");
  assert.equal(called, false);
});
test("missing proof blocks", async () => assert.equal((await plan({})).action, "block"));
test("lookup errors require manual review", async () => assert.equal((await plan({ claim: claim(2), email: "lead@example.com", lookup: async () => { throw Error("timeout"); } })).reason, "provider_lookup_failed"));
test("incomplete lookup requires manual review", async () => assert.equal((await plan({ claim: claim(2), email: "lead@example.com", lookup: async () => ({ complete: false, results: [] }) })).reason, "provider_lookup_incomplete"));

test("invalid or missing identity cannot invoke provider reconciliation lookup", async () => {
  for (const email of [undefined, "", "invalid", "a@b", null]) {
    let called = false;
    const result = await plan({ claim: claim(2), email, lookup: async () => { called = true; return { complete: true, results: [] }; } });
    assert.deepEqual(result, { action: "manual_review", reason: "invalid_lookup_identity" });
    assert.equal(called, false);
  }
});
test("provider lookup receives normalized identity", async () => {
  let actual;
  const result = await plan({ claim: claim(2), email: " LEAD@EXAMPLE.COM ", lookup: async ({ email }) => { actual = email; return { complete: true, results: [] }; } });
  assert.equal(actual, "lead@example.com");
  assert.equal(result.action, "manual_review");
});
