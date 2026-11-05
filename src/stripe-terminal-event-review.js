import { decideStripeEntitlement } from "./stripe-entitlement-reconciliation-policy.js";

// Signed terminal-event decision boundary used by the draft webhook wrapper.
// Verify the triggering subscription belongs to this user's complete Stripe
// inventory even when another subscription would otherwise retain paid access.
export async function reviewTerminalStripeEvent({
  event, userId, livemode, getCompleteInventory,
} = {}) {
  const terminal = new Set(["canceled", "unpaid", "incomplete_expired"]);
  if (!event || !["customer.subscription.deleted", "customer.subscription.updated"].includes(event.type) ||
      !terminal.has(event.data?.object?.status) ||
      typeof userId !== "string" || !userId ||
      typeof event.data?.object?.id !== "string" ||
      !event.data.object.id.startsWith("sub_") ||
      typeof event.data?.object?.customer !== "string" ||
      !event.data.object.customer.startsWith("cus_") ||
      (livemode !== true && livemode !== false) ||
      event.livemode !== livemode ||
      typeof getCompleteInventory !== "function") {
    return {decision:"defer",reason:"unverified-terminal-event"};
  }
  let inventory;
  try {
    inventory = await getCompleteInventory({userId,livemode});
  } catch {
    return {decision:"defer",reason:"inventory-error"};
  }
  if (!inventory || inventory.complete !== true) {
    return {decision:"defer",reason:"incomplete-inventory"};
  }
  const decision = decideStripeEntitlement({
    userId,livemode,subscriptions:inventory.subscriptions,
    inventoryComplete:inventory.complete
  });
  // Both retention AND downgrade require proof that the terminal event
  // references this exact user's subscription and Customer ID. Otherwise a
  // signed event containing incorrect metadata could touch another account.
  if (!Array.isArray(inventory.subscriptions) ||
      !inventory.subscriptions.some(s => s.id === event.data.object.id &&
        s.userId === userId &&
        s.customerId === event.data.object.customer &&
        s.livemode === livemode &&
        s.status === event.data.object.status)) {
    return {decision:"defer",reason:"terminal-subscription-unconfirmed"};
  }
  return decision;
}
