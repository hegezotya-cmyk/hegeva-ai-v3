import assert from "node:assert/strict";
import {compareStripeTestAndStagingD1 as compare} from "../src/stripe-staging-identity-compare.js";
const subscription=(u,c,s,status="active")=>({
  userId:u,customerId:c,id:s,status,livemode:false
});
const identity=(u,c,s,status="active")=>({
  userId:u,stripeCustomerId:c,stripeSubscriptionId:s,subscriptionStatus:status
});
const stripe=[
  subscription("user_1","cus_1","sub_1"),
  subscription("user_1","cus_2","sub_2"),
  subscription("user_2","cus_3","sub_3"),
  subscription("user_3","cus_4","sub_4"),
  subscription("user_4","cus_5","sub_5"),
];
const d1=[
  identity("user_1","cus_1","sub_1"),
  identity("user_2","cus_3","sub_3"),
  identity("user_3","cus_4","sub_4"),
  identity("user_4","cus_5","sub_5"),
];
const result=compare({d1Identities:d1,stripeSubscriptions:stripe,stripeComplete:true});
assert.equal(result.status,"REVIEW_REQUIRED");
assert.equal(result.counts.stripeActiveSubscriptions,5);
assert.equal(result.counts.d1IdentityRows,4);
assert.equal(result.counts.matchedStoredIdentities,4);
assert.equal(result.counts.unrepresentedActiveSubscriptions,1);
assert.equal(result.counts.multiCustomerActiveUsers,1);
assert.deepEqual(result.counts.unrepresentedStripeSubscriptionStatuses,{});
assert.equal(result.releaseSafe,false);
const other=compare({d1Identities:d1.map((r,i)=>i===0?identity("user_1","cus_2","sub_2"):r),stripeSubscriptions:stripe,stripeComplete:true});
assert.equal(other.counts.matchedStoredIdentities,4);
assert.equal(other.counts.unrepresentedActiveSubscriptions,1);
const complete=compare({d1Identities:[identity("user_1","cus_1","sub_1")],
 stripeSubscriptions:[subscription("user_1","cus_1","sub_1")],stripeComplete:true});
assert.equal(complete.status,"PASS");
assert.equal(complete.releaseSafe,true);
const orphanStatus=compare({d1Identities:[],
 stripeSubscriptions:[subscription("user_orphan","cus_orphan","sub_orphan","canceled")],stripeComplete:true});
assert.equal(orphanStatus.counts.stripeUsersWithoutD1Identity,1);
assert.equal(orphanStatus.counts.unrepresentedStripeSubscriptionStatuses.canceled,1);
assert.equal(orphanStatus.counts.unrepresentedActiveSubscriptions,0);
const authPresent=compare({d1Identities:[],
 stripeSubscriptions:[subscription("user_orphan","cus_orphan","sub_orphan","canceled")],
 d1UserIds:["user_orphan"],stripeComplete:true});
assert.equal(authPresent.counts.unrepresentedStripeUsersWithD1AuthRecord,1);
assert.equal(authPresent.counts.unrepresentedStripeUsersWithoutD1AuthRecord,0);
assert.ok(!JSON.stringify(authPresent).includes("user_orphan"));

const historicalCanceled=compare({
 d1Identities:[identity("user_current","cus_current","sub_current")],
 stripeSubscriptions:[
  subscription("user_current","cus_current","sub_current"),
  subscription("user_deleted","cus_deleted","sub_deleted","canceled"),
 ],
 d1UserIds:["user_current"],stripeComplete:true
});
assert.equal(historicalCanceled.status,"PASS");
assert.equal(historicalCanceled.releaseSafe,true);
assert.equal(historicalCanceled.counts.nonblockingCanceledOrphanSubscriptions,1);
assert.equal(historicalCanceled.counts.unrepresentedStripeUsersWithoutD1AuthRecord,1);
assert.ok(!JSON.stringify(historicalCanceled).includes("user_deleted"));

const nonCanceledOrphan=compare({
 d1Identities:[identity("user_current","cus_current","sub_current")],
 stripeSubscriptions:[
  subscription("user_current","cus_current","sub_current"),
  subscription("user_deleted","cus_deleted","sub_deleted","past_due"),
 ],
 d1UserIds:["user_current"],stripeComplete:true
});
assert.equal(nonCanceledOrphan.releaseSafe,false);
assert.equal(nonCanceledOrphan.counts.nonblockingCanceledOrphanSubscriptions,0);
const unknownAuthState=compare({
 d1Identities:[identity("user_current","cus_current","sub_current")],
 stripeSubscriptions:[
  subscription("user_current","cus_current","sub_current"),
  subscription("user_deleted","cus_deleted","sub_deleted","canceled"),
 ],
 stripeComplete:true
});
assert.equal(unknownAuthState.releaseSafe,false);


const mismatch=compare({d1Identities:[identity("user_1","cus_1","sub_1","canceled")],
 stripeSubscriptions:[subscription("user_1","cus_1","sub_1")],stripeComplete:true});
assert.equal(mismatch.counts.matchingIdentityStatusDisagreements,1);
assert.equal(mismatch.releaseSafe,false);
const wrongOwner=compare({d1Identities:[identity("user_2","cus_1","sub_1")],stripeSubscriptions:[subscription("user_1","cus_1","sub_1")],stripeComplete:true});
assert.equal(wrongOwner.counts.unmatchedStoredIdentities,1);
assert.equal(wrongOwner.releaseSafe,false);
assert.equal(compare({d1Identities:d1,stripeSubscriptions:stripe,stripeComplete:false}).status,"BLOCKED");
assert.equal(compare({d1Identities:d1,stripeSubscriptions:[...stripe,stripe[0]],stripeComplete:true}).status,"BLOCKED");
assert.equal(compare({d1Identities:d1,stripeSubscriptions:stripe.map(s=>({...s,livemode:true})),stripeComplete:true}).status,"BLOCKED");
assert.equal(compare({d1Identities:d1,stripeSubscriptions:[...stripe,{...stripe[1],id:"sub_extra",userId:"user_X"}],stripeComplete:true}).status,"BLOCKED");
assert.ok(!JSON.stringify(result).includes("cus_"));
assert.ok(!JSON.stringify(result).includes("user_"));
assert.ok(!JSON.stringify(result).includes("sub_"));
console.log("Staging D1 ↔ Stripe TEST offline exact identity comparison PASS (synthetic data only).");
