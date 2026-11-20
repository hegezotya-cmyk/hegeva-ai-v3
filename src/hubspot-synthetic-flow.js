import { planHubspotDeliveryFromClaim } from "./hubspot-delivery-policy.js";
import { buildHubspotUpsertDraft, inspectHubspotUpsertDraftResult } from "./hubspot-upsert-policy.js";
// Offline-only synthetic flow simulator. No network, D1 or production wiring.
// Explicitly NEVER finalizes delivery, including HTTP 200, until the
// provider identity and exact event reconciliation contract is approved.
export async function simulateHubspotFlow({ claim, suppressed = false, user, legalBasisApproved = false, noticeProvided = false, approvedIdentity = false, fakeProvider } = {}) {
  const plan = planHubspotDeliveryFromClaim(claim, { suppressed });
  if (plan.action !== "attempt") return { action: "block", reason: plan.reason, providerCalled: false };
  const draft = buildHubspotUpsertDraft({ enabled: true, approvedIdentity, legalBasisApproved, noticeProvided, suppressed, user });
  if (!draft.ok) return { action: "block", reason: draft.reason, providerCalled: false };
  if (typeof fakeProvider !== "function") return { action: "block", reason: "synthetic_provider_required", providerCalled: false };
  let result;
  try { result = await fakeProvider(draft); }
  catch { return { action: "manual_review", reason: "provider_outcome_unknown", providerCalled: true }; }
  const classified = inspectHubspotUpsertDraftResult({ expectedEmail: user.email, status: result?.status, body: result?.body });
  return { action: "manual_review", reason: classified.reason, providerCalled: true };
}
