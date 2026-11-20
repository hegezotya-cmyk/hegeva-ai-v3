// Isolated HubSpot transport. Not wired into HEGEVA request handlers.
// Caller must pass an explicitly approved, purpose-limited payload.
// No tenant workspace records or arbitrary property bags are accepted.
import { hubspotLeadEligibility } from "./hubspot-lead-policy.js";

export function buildHubspotContact({ enabled = false, purpose, legalBasisApproved = false, noticeProvided = false, suppressed = false, user } = {}) {
  const gate = hubspotLeadEligibility({ enabled, purpose, legalBasisApproved, noticeProvided, suppressed, user });
  if (!gate.eligible) return { ok: false, reason: gate.reason };
  // Explicit allowlist: do not include name, workspace records, billing or attribution.
  return { ok: true, properties: { email: user.email.trim().toLowerCase() } };
}

// A retry after an ambiguous remote acceptance MUST NOT create another contact.
// Until an approved provider reconciliation contract exists, reject retries
// rather than issuing a potentially duplicate create request.
export async function sendHubspotContact({ enabled = false, purpose, legalBasisApproved = false, noticeProvided = false, suppressed = false, user, token, fetchImpl = fetch, attempt = 1 } = {}) {
  if (!Number.isSafeInteger(attempt) || attempt < 1) return { sent: false, reason: "invalid_attempt" };
  if (attempt !== 1) return { sent: false, reason: "retry_requires_reconciliation" };
  const payload = buildHubspotContact({ enabled, purpose, legalBasisApproved, noticeProvided, suppressed, user });
  if (!payload.ok) return { sent: false, reason: payload.reason };
  if (typeof token !== "string" || !token.trim()) return { sent: false, reason: "credentials_unavailable" };
  // No live endpoint invocation unless the caller explicitly supplies a fetch implementation.
  // Production integration must add durable deduplication, deletion/suppression checks and retry policy first.
  if (fetchImpl === fetch) return { sent: false, reason: "transport_not_enabled" };
  let response;
  try {
    response = await fetchImpl("https://api.hubapi.com/crm/v3/objects/contacts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties: payload.properties }),
    });
  } catch {
    // The provider may have committed the write before the connection failed.
    // Never classify an ambiguous result as safe for blind retry.
    return { sent: false, reason: "provider_outcome_unknown" };
  }
  if (!response || typeof response.ok !== "boolean" || !Number.isInteger(response.status)) {
    return { sent: false, reason: "provider_outcome_unknown" };
  }
  if (response.status === 409) return { sent: false, reason: "provider_reconciliation_required", status: 409 };
  if (response.status === 429 || response.status >= 500) return { sent: false, reason: "provider_outcome_unknown", status: response.status };
  // HTTP success does not correlate a provider record with this outbox event.
  // The caller must not mark delivered until an approved reconciliation protocol exists.
  if (response.ok) return { sent: false, reason: "provider_acceptance_unverified", status: response.status };
  return { sent: false, reason: "provider_rejected", status: response.status };
}
