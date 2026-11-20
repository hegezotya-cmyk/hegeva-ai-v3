// Draft-only read-only HubSpot lookup transport; never used by production routes.
// No embedded credentials. Caller injects fetch and authorizes read-only use.
export async function lookupHubspotContactByEmail({ enabled = false, token, email, fetchImpl } = {}) {
  if (enabled !== true) return { complete: false, results: [], reason: "disabled" };
  if (typeof token !== "string" || !token.trim() || typeof fetchImpl !== "function") {
    return { complete: false, results: [], reason: "transport_unavailable" };
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { complete: false, results: [], reason: "invalid_identity" };
  }
  let response;
  try {
    response = await fetchImpl("https://api.hubapi.com/crm/v3/objects/contacts/search", {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email.trim().toLowerCase() }] }], properties: ["email"], limit: 2 })
    });
  } catch {
    return { complete: false, results: [], reason: "transport_error" };
  }
  if (!response || response.ok !== true || response.status !== 200) {
    return { complete: false, results: [], reason: "provider_error" };
  }
  let body;
  try { body = await response.json(); }
  catch { return { complete: false, results: [], reason: "invalid_response" }; }
  if (!body || !Array.isArray(body.results) || !Number.isInteger(body.total) || body.total < 0 ||
      body.total !== body.results.length || body.total > 1 || body.paging) {
    return { complete: false, results: [], reason: "ambiguous_or_incomplete_results" };
  }
  const expectedEmail = email.trim().toLowerCase();
  if (body.results.some(r => typeof r?.id !== "string" || !r.id.trim() ||
      typeof r?.properties?.email !== "string" ||
      r.properties.email.trim().toLowerCase() !== expectedEmail)) {
    return { complete: false, results: [], reason: "provider_identity_mismatch" };
  }
  return { complete: true, results: body.results.map(r => ({
    id: r?.id,
    properties: { email: r?.properties?.email }
  })) };
}
