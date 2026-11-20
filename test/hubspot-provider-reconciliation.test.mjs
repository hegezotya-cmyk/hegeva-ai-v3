import test from "node:test";
import assert from "node:assert/strict";
import { reconcileHubspotContact as reconcile } from "../src/hubspot-provider-reconciliation.js";
const opts = { enabled: true, approvedIdentity: true, email: "Lead@Example.com" };
test("default disabled blocks lookup", async () => {
  let called = false;
  assert.equal((await reconcile({ ...opts, enabled: false, lookup: async () => { called = true; return {}; } })).reason, "disabled");
  assert.equal(called, false);
});
test("unapproved identity blocks lookup", async () => assert.equal((await reconcile({ ...opts, approvedIdentity: false })).reason, "identity_not_approved"));
test("suppression blocks lookup", async () => assert.equal((await reconcile({ ...opts, suppressed: true })).reason, "suppressed"));
test("invalid email blocks lookup", async () => assert.equal((await reconcile({ ...opts, email: "invalid" })).reason, "invalid_identity"));
test("missing lookup blocks", async () => assert.equal((await reconcile(opts)).reason, "lookup_unavailable"));
test("lookup normalizes email", async () => {
  let query;
  await reconcile({ ...opts, lookup: async value => { query = value; return { complete: true, results: [] }; } });
  assert.deepEqual(query, { email: "lead@example.com" });
});
test("zero matches cannot prove no delivery", async () => assert.equal((await reconcile({ ...opts, lookup: async () => ({ complete: true, results: [] }) })).reason, "no_record_not_proof_of_non_delivery"));
test("matching contact cannot prove specific event delivery", async () => assert.equal((await reconcile({ ...opts, lookup: async () => ({ complete: true, results: [{ id: "123", properties: { email: "LEAD@EXAMPLE.COM" } }] }) })).reason, "matching_contact_event_unverified"));
test("multiple matches need manual review", async () => assert.equal((await reconcile({ ...opts, lookup: async () => ({ complete: true, results: [{ id: "1" }, { id: "2" }] }) })).reason, "ambiguous_matches"));
test("mismatched email needs manual review", async () => assert.equal((await reconcile({ ...opts, lookup: async () => ({ complete: true, results: [{ id: "123", properties: { email: "other@example.com" } }] }) })).reason, "identity_mismatch"));
test("incomplete results need manual review", async () => assert.equal((await reconcile({ ...opts, lookup: async () => ({ complete: false, results: [] }) })).reason, "incomplete_lookup"));
test("provider errors need manual review", async () => assert.equal((await reconcile({ ...opts, lookup: async () => { throw Error("timeout"); } })).reason, "provider_lookup_failed"));
