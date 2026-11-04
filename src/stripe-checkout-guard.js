export const ACTIVE_STRIPE_SUBSCRIPTION_STATUSES = Object.freeze([
  "active",
  "trialing",
  "past_due"
]);

export const CHECKOUT_LOCK_TTL_MS = 15 * 60 * 1000;

export function hasActiveStripeSubscription(row) {
  return ACTIVE_STRIPE_SUBSCRIPTION_STATUSES.includes(
    String(row?.subscriptionStatus || "").trim().toLowerCase()
  );
}

export function checkoutLockIsFresh(row, nowMs = Date.now()) {
  const updatedMs = Date.parse(String(row?.updatedAt || ""));
  if (!Number.isFinite(updatedMs)) return false;
  const ageMs = nowMs - updatedMs;
  return ageMs >= 0 && ageMs < CHECKOUT_LOCK_TTL_MS;
}
