// Draft-only, pure HubSpot batch-upsert request/response policy.
// This module cannot make network requests and is not wired to production.
// Email is a candidate identity, not an approved portal-level unique key.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function buildHubspotUpsertDraft({ enabled = false, approvedIdentity = false, legalBasisApproved = false, noticeProvided = false, suppressed = false, user } = {}) {
  if (!enabled) return { ok: false, reason: "disabled" };
  if (!approvedIdentity) return { ok: false, reason: "identity_not_approved" };
  if (!legalBasisApproved || !noticeProvided) return { ok: false, reason: "privacy_gate" };
  if (suppressed) return { ok: false, reason: "suppressed" };
  if (!user || user.emailVerified !== true || typeof user.email !== "string" || !emailPattern.test(user.email.trim())) return { ok: false, reason: "invalid_identity" };
  const email = user.email.trim().toLowerCase();
  return { ok: true, path: "/crm/v3/objects/contacts/batch/upsert", body: { inputs: [{ id: email, idProperty: "email", properties: { email } }] } };
}
export function classifyHubspotUpsertDraftResponse({ status, body } = {}) {
  if (!Number.isInteger(status) || status < 100 || status > 599) return { action: "reconcile", reason: "unknown_outcome" };
  if (status === 409) return { action: "reconcile", reason: "conflict" };
  if (status === 429 || status >= 500) return { action: "reconcile", reason: "ambiguous_provider_outcome" };
  if (status === 207) return { action: "reconcile", reason: "partial_result" };
  if (status < 200 || status >= 300) return { action: "block", reason: "provider_rejected" };
  // A successful HTTP response is not proof of the specific input's acceptance.
  // Reconciliation remains required until the response schema is verified.
  if (!body || !Array.isArray(body.results) || body.results.length !== 1 ||
      typeof body.results[0]?.id !== "string" || !body.results[0].id) return { action: "reconcile", reason: "unverified_success" };
  return { action: "reconcile", reason: "provider_identity_not_verified" };
}
