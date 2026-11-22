// Pure safety policy for a HubSpot provider request racing with an opt-out.
// No external calls, no D1 writes, no production route. This does not authorize
// a send; it only determines what must happen AFTER a provider request started.
const validStatus = new Set(["accepted", "rejected", "unknown"]);
export function classifyHubspotInFlightOptOut({
  requestStarted = false,
  optOutObserved = false,
  providerStatus = "unknown",
  providerEventCorrelated = false,
} = {}) {
  if (!validStatus.has(providerStatus)) return { action: "block", reason: "invalid_provider_status" };
  if (!requestStarted) return { action: "block", reason: "request_not_started" };
  if (optOutObserved) {
    // Even if the provider accepted, do not mark delivered. A remote record
    // may need owner-approved erasure/suppression; never retry automatically.
    return { action: "manual_review", reason: "opt_out_during_inflight", providerReconciliationRequired: true };
  }
  if (providerStatus === "unknown") return { action: "manual_review", reason: "provider_outcome_unknown", providerReconciliationRequired: true };
  if (providerStatus === "rejected") return { action: "manual_review", reason: "provider_rejection_requires_review", providerReconciliationRequired: true };
  if (!providerEventCorrelated) return { action: "manual_review", reason: "provider_event_not_correlated", providerReconciliationRequired: true };
  // Even correlated provider acceptance does not grant a delivered finalization:
  // lease fencing, suppression and identity still require a separate atomic gate.
  return { action: "manual_review", reason: "fenced_finalize_not_proven", providerReconciliationRequired: false };
}
