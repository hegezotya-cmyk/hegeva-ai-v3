import test from "node:test";
import assert from "node:assert/strict";
import { lookupHubspotContactByEmail as lookup } from "../src/hubspot-readonly-lookup.js";
import { reconcileHubspotContact as reconcile } from "../src/hubspot-provider-reconciliation.js";
const opts = { enabled: true, token: "synthetic-token", email: "LEAD@EXAMPLE.COM" };
const response = body => ({ ok: true, status: 200, json: async () => body });
test("disabled lookup makes no request", async () => {
  let called = false;
  assert.equal((await lookup({ ...opts, enabled: false, fetchImpl: async () => { called = true; } })).reason, "disabled");
  assert.equal(called, false);
});
test("read-only contact search is minimal and normalized", async () => {
  let url, init;
  const result = await lookup({ ...opts, fetchImpl: async (u, i) => { url = u; init = i; return response({ total: 1, results: [{ id: "123", properties: { email: "lead@example.com", firstname: "must_not_export" } }] }); } });
  assert.equal(url, "https://api.hubapi.com/crm/v3/objects/contacts/search");
  assert.equal(init.method, "POST");
  assert.deepEqual(JSON.parse(init.body), { filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: "lead@example.com" }] }], properties: ["email"], limit: 2 });
  assert.deepEqual(result, { complete: true, results: [{ id: "123", properties: { email: "lead@example.com" } }] });
});
test("missing token blocks", async () => assert.equal((await lookup({ ...opts, token: "" })).reason, "transport_unavailable"));
test("network failure is incomplete", async () => assert.equal((await lookup({ ...opts, fetchImpl: async () => { throw Error("offline"); } })).complete, false));
test("provider 429 is incomplete", async () => assert.equal((await lookup({ ...opts, fetchImpl: async () => ({ ok: false, status: 429 }) })).reason, "provider_error"));
test("invalid JSON is incomplete", async () => assert.equal((await lookup({ ...opts, fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw Error("bad"); } }) })).reason, "invalid_response"));
test("multiple results fail closed", async () => assert.equal((await lookup({ ...opts, fetchImpl: async () => response({ total: 2, results: [{ id: "1" }, { id: "2" }] }) })).complete, false));
test("inconsistent totals fail closed", async () => assert.equal((await lookup({ ...opts, fetchImpl: async () => response({ total: 2, results: [{ id: "1" }] }) })).complete, false));
test("paging fails closed", async () => assert.equal((await lookup({ ...opts, fetchImpl: async () => response({ total: 1, results: [{ id: "1" }], paging: { next: { after: "1" } } }) })).complete, false));
test("adapter integrates with reconciliation without marking delivery", async () => {
  const result = await reconcile({ enabled: true, approvedIdentity: true, email: "lead@example.com", lookup: ({ email }) => lookup({ ...opts, email, fetchImpl: async () => response({ total: 1, results: [{ id: "123", properties: { email } }] }) }) });
  assert.deepEqual(result, { action: "manual_review", reason: "matching_contact_event_unverified" });
});

test("read-only lookup never accepts truthy non-boolean enable flags", async () => {
  for (const enabled of ["true", 1, {}, []]) {
    let called = false;
    const result = await lookup({ ...opts, enabled, fetchImpl: async () => { called = true; return response({ total: 0, results: [] }); } });
    assert.equal(result.reason, "disabled");
    assert.equal(called, false);
  }
});

test("malformed or mismatched HubSpot search records are never complete", async () => {
  const rows = [
    { id: "", properties: { email: "lead@example.com" } },
    { id: 123, properties: { email: "lead@example.com" } },
    { id: "123", properties: {} },
    { id: "123", properties: { email: "other@example.com" } },
    { id: "123", properties: { email: null } },
  ];
  for (const row of rows) {
    const result = await lookup({ ...opts, fetchImpl: async () => response({ total: 1, results: [row] }) });
    assert.deepEqual(result, { complete: false, results: [], reason: "provider_identity_mismatch" });
  }
});
