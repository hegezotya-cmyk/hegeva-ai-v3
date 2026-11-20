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

export async function sendHubspotContact({ enabled = false, purpose, legalBasisApproved = false, noticeProvided = false, suppressed = false, user, token, fetchImpl = fetch } = {}) {
  const payload = buildHubspotContact({ enabled, purpose, legalBasisApproved, noticeProvided, suppressed, user });
  if (!payload.ok) return { sent: false, reason: payload.reason };
  if (typeof token !== "string" || !token.trim()) return { sent: false, reason: "credentials_unavailable" };
  // No live endpoint invocation unless the caller explicitly supplies a fetch implementation.
  // Production integration must add durable deduplication, deletion/suppression checks and retry policy first.
  if (fetchImpl === fetch) return { sent: false, reason: "transport_not_enabled" };
  const response = await fetchImpl("https://api.hubapi.com/crm/v3/objects/contacts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties: payload.properties }),
  });
  return { sent: response.ok, reason: response.ok ? "accepted" : "provider_rejected", status: response.status };
}
