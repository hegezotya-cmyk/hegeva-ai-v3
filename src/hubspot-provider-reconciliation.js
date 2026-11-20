// Draft-only, read-only HubSpot contact reconciliation.
// No network, tokens, real CRM access or production route. Inject a fake lookup in tests.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function reconcileHubspotContact({ enabled = false, approvedIdentity = false, suppressed = false, email, lookup } = {}) {
  if (!enabled) return { action: "block", reason: "disabled" };
  if (!approvedIdentity) return { action: "block", reason: "identity_not_approved" };
  if (suppressed) return { action: "block", reason: "suppressed" };
  if (typeof email !== "string" || !emailPattern.test(email.trim())) return { action: "block", reason: "invalid_identity" };
  if (typeof lookup !== "function") return { action: "block", reason: "lookup_unavailable" };
  const expected = email.trim().toLowerCase();
  let result;
  try { result = await lookup({ email: expected }); }
  catch { return { action: "manual_review", reason: "provider_lookup_failed" }; }
  if (!result || !Array.isArray(result.results) || result.complete !== true) {
    return { action: "manual_review", reason: "incomplete_lookup" };
  }
  // Zero matches is not proof that a timed-out write never arrived.
  if (result.results.length === 0) return { action: "manual_review", reason: "no_record_not_proof_of_non_delivery" };
  if (result.results.length !== 1) return { action: "manual_review", reason: "ambiguous_matches" };
  const contact = result.results[0];
  if (typeof contact?.id !== "string" || !contact.id ||
      typeof contact?.properties?.email !== "string" ||
      contact.properties.email.trim().toLowerCase() !== expected) {
    return { action: "manual_review", reason: "identity_mismatch" };
  }
  // Matching email is not proof this particular outbox event was delivered.
  return { action: "manual_review", reason: "matching_contact_event_unverified" };
}
