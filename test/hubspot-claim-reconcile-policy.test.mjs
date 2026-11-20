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
test("reclaimed lease with matching record cannot auto-finalize", async () => assert.equal((await plan({ claim: claim(2), lookup: async () => ({ complete: true, results: [{ id: "123" }] }) })).action, "manual_review"));
test("suppression blocks before lookup", async () => {
  let called = false;
  const result = await plan({ claim: claim(2), suppressed: true, lookup: async () => { called = true; } });
  assert.equal(result.action, "block");
  assert.equal(called, false);
});
test("missing proof blocks", async () => assert.equal((await plan({})).action, "block"));
test("lookup errors require manual review", async () => assert.equal((await plan({ claim: claim(2), lookup: async () => { throw Error("timeout"); } })).reason, "provider_lookup_failed"));
test("incomplete lookup requires manual review", async () => assert.equal((await plan({ claim: claim(2), lookup: async () => ({ complete: false, results: [] }) })).reason, "provider_lookup_incomplete"));
