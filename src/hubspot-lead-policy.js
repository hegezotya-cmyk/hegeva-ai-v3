// Pure, fail-closed lead eligibility policy. No network calls or CRM writes.
// This module is NOT wired to any production endpoint.
export function hubspotLeadEligibility({ enabled = false, purpose, legalBasisApproved = false, noticeProvided = false, user, suppressed = false } = {}) {
  if (enabled !== true) return { eligible: false, reason: "disabled" };
  if (purpose !== "hegeva_sales_followup") return { eligible: false, reason: "purpose_not_allowed" };
  if (legalBasisApproved !== true || noticeProvided !== true) return { eligible: false, reason: "privacy_gate" };
  if (suppressed === true) return { eligible: false, reason: "suppressed" };
  if (!user || typeof user.id !== "string" || !user.id.trim()) return { eligible: false, reason: "invalid_identity" };
  if (user.emailVerified !== true) return { eligible: false, reason: "unverified" };
  if (typeof user.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) return { eligible: false, reason: "invalid_email" };
  return { eligible: true, reason: "eligible" };
}
