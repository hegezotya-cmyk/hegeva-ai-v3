import test from "node:test";
import assert from "node:assert/strict";
import { buildHubspotUpsertDraft as build, classifyHubspotUpsertDraftResponse as classify, inspectHubspotUpsertDraftResult as inspect } from "../src/hubspot-upsert-policy.js";
const valid = { enabled: true, approvedIdentity: true, legalBasisApproved: true, noticeProvided: true, user: { id: "synthetic", email: "LEAD@EXAMPLE.COM", emailVerified: true, workspace: { customers: ["never_export"] } } };
test("upsert draft is allowlisted to one verified email", () => {
  assert.deepEqual(build(valid), { ok: true, path: "/crm/v3/objects/contacts/batch/upsert", body: { inputs: [{ id: "lead@example.com", idProperty: "email", properties: { email: "lead@example.com" } }] } });
});
test("feature disabled by default", () => assert.equal(build({ ...valid, enabled: false }).reason, "disabled"));
test("unapproved identity blocks draft", () => assert.equal(build({ ...valid, approvedIdentity: false }).reason, "identity_not_approved"));
test("missing legal basis blocks draft", () => assert.equal(build({ ...valid, legalBasisApproved: false }).reason, "privacy_gate"));
test("suppression blocks draft", () => assert.equal(build({ ...valid, suppressed: true }).reason, "suppressed"));
test("unverified email blocks draft", () => assert.equal(build({ ...valid, user: { ...valid.user, emailVerified: false } }).reason, "invalid_identity"));
for (const [status, reason] of [[207,"partial_result"],[409,"conflict"],[429,"ambiguous_provider_outcome"],[503,"ambiguous_provider_outcome"]]) {
  test("status " + status + " never authorizes blind retry", () => assert.deepEqual(classify({ status }), { action: "reconcile", reason }));
}
test("200 without verified results requires reconciliation", () => assert.equal(classify({ status: 200, body: {} }).reason, "unverified_success"));
test("200 with result still requires identity verification", () => assert.equal(classify({ status: 200, body: { results: [{ id: "123" }] } }).reason, "provider_identity_not_verified"));
test("400 blocks instead of retrying", () => assert.deepEqual(classify({ status: 400 }), { action: "block", reason: "provider_rejected" }));
test("missing status requires reconciliation", () => assert.equal(classify({}).reason, "unknown_outcome"));

test("correlated synthetic response still requires provider reconciliation", () => {
  assert.deepEqual(inspect({ expectedEmail: "lead@example.com", status: 200, body: { results: [{ id: "123", properties: { email: "LEAD@EXAMPLE.COM" } }] } }), { action: "reconcile", reason: "identity_correlated_not_verified" });
});
test("mismatched synthetic response cannot authorize success", () => {
  assert.deepEqual(inspect({ expectedEmail: "lead@example.com", status: 200, body: { results: [{ id: "123", properties: { email: "other@example.com" } }] } }), { action: "reconcile", reason: "identity_mismatch" });
});
test("missing email in provider result fails closed", () => {
  assert.equal(inspect({ expectedEmail: "lead@example.com", status: 200, body: { results: [{ id: "123" }] } }).reason, "identity_mismatch");
});
test("invalid expected identity fails closed", () => {
  assert.equal(inspect({ expectedEmail: "not-email", status: 200, body: { results: [{ id: "123", properties: { email: "lead@example.com" } }] } }).reason, "invalid_expected_identity");
});

test("truthy strings and numbers never satisfy provider/privacy approval gates", () => {
  for (const field of ["enabled", "approvedIdentity", "legalBasisApproved", "noticeProvided"]) {
    for (const value of ["true", 1, {}, []]) {
      const result = build({ ...valid, [field]: value });
      assert.equal(result.ok, false, field + " accepted non-boolean approval");
    }
  }
  for (const value of ["false", 0, null]) {
    const result = build({ ...valid, suppressed: value });
    if (value !== false) assert.equal(result.ok, false, "suppression unknown must fail closed");
  }
});
