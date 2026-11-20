import { planHubspotDeliveryFromClaim } from "./hubspot-delivery-policy.js";
// Draft-only policy bridge. No HTTP calls, D1 writes or production wiring.
// Reclaimed leases MUST NOT cause another provider write.
export async function planHubspotClaimReconciliation({ claim, suppressed = false, email, lookup } = {}) {
  const plan = planHubspotDeliveryFromClaim(claim, { suppressed });
  if (plan.action === "attempt") {
    return { action: "hold", reason: "first_claim_requires_separate_send_authorization" };
  }
  if (plan.reason !== "reconciliation_required") return { action: "block", reason: plan.reason };
  if (typeof lookup !== "function") return { action: "manual_review", reason: "lookup_unavailable" };
  let result;
  try { result = await lookup({ email }); }
  catch { return { action: "manual_review", reason: "provider_lookup_failed" }; }
  if (!result || result.complete !== true) return { action: "manual_review", reason: "provider_lookup_incomplete" };
  if (!Array.isArray(result.results)) return { action: "manual_review", reason: "provider_lookup_invalid" };
  // Neither a missing contact nor a matching contact proves whether the
  // prior event was applied. Never infer permission to resend or finalize.
  return { action: "manual_review", reason: "prior_write_outcome_unverified" };
}
