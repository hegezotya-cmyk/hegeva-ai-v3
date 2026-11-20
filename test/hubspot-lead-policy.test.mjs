import test from "node:test";
import assert from "node:assert/strict";
import { hubspotLeadEligibility } from "../src/hubspot-lead-policy.js";

const valid = { enabled: true, purpose: "hegeva_sales_followup", legalBasisApproved: true, noticeProvided: true, user: { id: "u1", email: "lead@example.com", emailVerified: true } };
test("disabled by default", () => assert.equal(hubspotLeadEligibility().reason, "disabled"));
test("verified first-party lead requires all privacy gates", () => assert.equal(hubspotLeadEligibility(valid).eligible, true));
test("rejects missing privacy approval", () => assert.equal(hubspotLeadEligibility({ ...valid, legalBasisApproved: false }).reason, "privacy_gate"));
test("rejects missing notice", () => assert.equal(hubspotLeadEligibility({ ...valid, noticeProvided: false }).reason, "privacy_gate"));
test("rejects unsupported purpose", () => assert.equal(hubspotLeadEligibility({ ...valid, purpose: "tenant_customer_export" }).reason, "purpose_not_allowed"));
test("rejects unverified email", () => assert.equal(hubspotLeadEligibility({ ...valid, user: { ...valid.user, emailVerified: false } }).reason, "unverified"));
test("rejects suppressed lead", () => assert.equal(hubspotLeadEligibility({ ...valid, suppressed: true }).reason, "suppressed"));
test("rejects invalid identity", () => assert.equal(hubspotLeadEligibility({ ...valid, user: { ...valid.user, id: "" } }).reason, "invalid_identity"));
