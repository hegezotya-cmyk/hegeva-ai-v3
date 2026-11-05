// Account-wide read-only Stripe subscription inventory used for isolated tests.
// NOT wired into the webhook until consistency, auth, scale and deployment gates pass.
// Stripe Search is intentionally avoided because Stripe warns it is eventually consistent.
const PAGE_LIMIT = 100;
const MAX_PAGES = 20;
const parseId = (v, prefix) => typeof v === "string" && v.startsWith(prefix) ? v : null;

export async function collectStripeUserSubscriptions({
  userId, livemode, secretKey, fetchImpl = fetch, maxPages = MAX_PAGES,
} = {}) {
  if (typeof userId !== "string" || !userId.trim() ||
      (livemode !== true && livemode !== false) ||
      typeof secretKey !== "string" ||
      !secretKey.startsWith(livemode ? "sk_live_" : "sk_test_") ||
      !Number.isInteger(maxPages) || maxPages < 1 || maxPages > MAX_PAGES) {
    return { complete: false, reason: "invalid-request", subscriptions: [] };
  }

  const found = [];
  const visited = new Set();
  let after = null;
  for (let page = 0; page < maxPages; page++) {
    const url = new URL("https://api.stripe.com/v1/subscriptions");
    url.searchParams.set("status", "all");
    url.searchParams.set("limit", String(PAGE_LIMIT));
    if (after) url.searchParams.set("starting_after", after);
    let response, data;
    try {
      response = await fetchImpl(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("provider-failed");
      data = await response.json();
    } catch {
      return { complete: false, reason: "provider-unavailable", subscriptions: [] };
    }
    if (!data || !Array.isArray(data.data) || typeof data.has_more !== "boolean" ||
        data.data.length > PAGE_LIMIT ||
        (data.has_more && data.data.length === 0)) {
      return { complete: false, reason: "malformed-page", subscriptions: [] };
    }
    for (const row of data.data) {
      const id = parseId(row?.id, "sub_");
      if (!id || visited.has(id) || row.livemode !== livemode) {
        return { complete: false, reason: "invalid-subscription", subscriptions: [] };
      }
      visited.add(id);
      // Legacy subscriptions may have missing HEGEVA user metadata, even under
      // a different Stripe Customer ID. We cannot prove they do not belong to
      // the requested user, so an active unmapped record invalidates a complete
      // inventory claim. This deliberately favors review over a false downgrade.
      const mappedUserId = row.metadata?.userId;
      const status = String(row.status || "").trim().toLowerCase();
      if (["active", "trialing", "past_due"].includes(status) &&
          (typeof mappedUserId !== "string" || !mappedUserId.trim())) {
        return { complete: false, reason: "unmapped-active-subscription", subscriptions: [] };
      }
      // Never infer user identity from email or Stripe Customer ID alone.
      if (mappedUserId !== userId) continue;
      const customerId = parseId(row.customer, "cus_");
      const plan = row.metadata?.hegevaPlan;
      if (!customerId || typeof row.status !== "string") {
        return { complete: false, reason: "invalid-matched-subscription", subscriptions: [] };
      }
      found.push({ id, customerId, userId, plan, status: row.status, livemode });
    }
    if (!data.has_more) return { complete: true, subscriptions: found };
    const next = data.data.at(-1)?.id;
    if (!next || next === after) {
      return { complete: false, reason: "invalid-pagination", subscriptions: [] };
    }
    after = next;
  }
  // Never treat partial account inventory as complete and never downgrade on it.
  return { complete: false, reason: "pagination-limit", subscriptions: [] };
}
