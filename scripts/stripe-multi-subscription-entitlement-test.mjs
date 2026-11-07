import assert from "node:assert/strict";
import { decideStripeEntitlement } from "../src/stripe-entitlement-reconciliation-policy.js";

const userId = "test-user";
const sub = (id, customerId, status, plan = "premium") => ({
  id, customerId, status, plan, userId, livemode: false,
});
const older = sub("sub_old", "cus_old", "canceled");
const newer = sub("sub_new", "cus_new", "active");
const decide = (subscriptions, inventoryComplete = true) =>
  decideStripeEntitlement({ userId, subscriptions, inventoryComplete, livemode: false });

assert.deepEqual(decide([older, newer]), {decision:"retain", plan:"premium"},
  "canceling one of two subscriptions across different customers cannot revoke entitlement");
assert.deepEqual(decide([older, {...newer,status:"trialing"}]), {decision:"retain",plan:"premium"});
assert.deepEqual(decide([older, {...newer,status:"past_due"}]), {decision:"retain",plan:"premium"});
assert.deepEqual(decide([older, {...newer,status:"canceled"}]), {decision:"downgrade",plan:"basic"},
  "downgrade only when the complete inventory has no eligible subscriptions");
assert.deepEqual(decide([older, {...newer,status:"active",plan:"pro"}]), {decision:"retain",plan:"pro"});
assert.deepEqual(decide([older], false), {decision:"defer",reason:"unverified-inventory"},
  "a single cancellation event is not an authoritative complete inventory");
assert.deepEqual(decide(null), {decision:"defer",reason:"unverified-inventory"});
assert.deepEqual(decide([older,{...newer,userId:"other-tenant"}]),
  {decision:"defer",reason:"invalid-inventory-entry"}, "cross-tenant inventory fails closed");
assert.deepEqual(decide([older, {...newer,status:"unknown"}]),
  {decision:"defer",reason:"unknown-subscription-status"});
assert.deepEqual(decide([older, {...newer,plan:"undefined-plan"}]),
  {decision:"defer",reason:"unknown-active-plan"});
assert.deepEqual(decide([older,newer,newer]),
  {decision:"defer",reason:"duplicate-subscription-id"});

assert.deepEqual(decide([{...newer,livemode:true}]),
  {decision:"defer",reason:"invalid-inventory-entry"}, "mixed TEST/LIVE inventory fails closed");
assert.deepEqual(decideStripeEntitlement({userId,subscriptions:[newer],inventoryComplete:true}),
  {decision:"defer",reason:"unverified-inventory"}, "missing explicit Stripe mode fails closed");

console.log("Stripe multi-subscription entitlement policy test PASS");
