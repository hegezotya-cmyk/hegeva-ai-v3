import test from "node:test";
import assert from "node:assert/strict";
import { buildHubspotContact, sendHubspotContact } from "../src/hubspot-contact-adapter.js";

const valid = { enabled: true, purpose: "hegeva_sales_followup", legalBasisApproved: true, noticeProvided: true, user: { id: "u1", email: "LEAD@EXAMPLE.COM", emailVerified: true, workspace: { customers: ["private"] }, name: "Private Name" } };
test("allowlist excludes tenant workspace and names", () => assert.deepEqual(buildHubspotContact(valid), { ok: true, properties: { email: "lead@example.com" } }));
test("disabled adapter never sends", async () => { let called = false; const result = await sendHubspotContact({ ...valid, enabled: false, token: "fake", fetchImpl: async () => { called = true; return { ok: true, status: 201 }; } }); assert.equal(called, false); assert.equal(result.reason, "disabled"); });
test("missing credentials blocks request", async () => assert.equal((await sendHubspotContact({ ...valid, token: "" })).reason, "credentials_unavailable"));
test("no implicit live network request", async () => assert.equal((await sendHubspotContact({ ...valid, token: "fake" })).reason, "transport_not_enabled"));
test("mock transport sends only allowlisted email", async () => { let body; const result = await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async (_url, init) => { body = JSON.parse(init.body); return { ok: true, status: 201 }; } }); assert.equal(result.sent, true); assert.deepEqual(body, { properties: { email: "lead@example.com" } }); });
test("provider rejection reports generic error", async () => assert.deepEqual(await sendHubspotContact({ ...valid, token: "fake", fetchImpl: async () => ({ ok: false, status: 429 }) }), { sent: false, reason: "provider_rejected", status: 429 }));
