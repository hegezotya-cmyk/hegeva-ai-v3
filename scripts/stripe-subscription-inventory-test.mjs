import assert from "node:assert/strict";
import { collectStripeUserSubscriptions } from "../src/stripe-subscription-inventory.js";
import { decideStripeEntitlement } from "../src/stripe-entitlement-reconciliation-policy.js";
const userId = "staging-user";
const make = (id, customer, status, extra = {}) => ({
  id, customer, status, livemode:false, metadata:{userId,hegevaPlan:"premium"},...extra
});
const older = make("sub_old", "cus_first", "canceled");
const newer = make("sub_new", "cus_second", "active");
function mock(pages) {
  const requested = [];
  const fetchImpl = async (url, options) => {
    const u = new URL(url);
    assert.equal(u.hostname,"api.stripe.com");
    assert.equal(u.pathname,"/v1/subscriptions");
    assert.equal(u.searchParams.get("status"),"all");
    assert.equal(options.method,"GET");
    requested.push(u.searchParams.get("starting_after"));
    return { ok:true, json:async()=>pages[requested.length-1] };
  };
  return { fetchImpl,requested };
}
const client=mock([
  {data:[older],has_more:true},
  {data:[newer],has_more:false}
]);
const inventory=await collectStripeUserSubscriptions({
  userId, livemode:false, secretKey:"sk_test_fixture",fetchImpl:client.fetchImpl
});
assert.equal(inventory.complete,true);
assert.deepEqual(client.requested,[null,"sub_old"]);
assert.equal(inventory.subscriptions.length,2);
assert.deepEqual(decideStripeEntitlement({
  userId, livemode:false, subscriptions:inventory.subscriptions,inventoryComplete:inventory.complete
}), {decision:"retain",plan:"premium"});
const terminal=mock([{data:[older,{...newer,status:"canceled"}],has_more:false}]);
const completed=await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",fetchImpl:terminal.fetchImpl
});
assert.deepEqual(decideStripeEntitlement({
  userId,livemode:false,subscriptions:completed.subscriptions,inventoryComplete:completed.complete
}),{decision:"downgrade",plan:"basic"});
const incomplete=mock([{data:[older],has_more:true}]);
const truncated=await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",fetchImpl:incomplete.fetchImpl,maxPages:1
});
assert.equal(truncated.complete,false);
assert.equal(truncated.reason,"pagination-limit");
assert.deepEqual(decideStripeEntitlement({
  userId,livemode:false,subscriptions:truncated.subscriptions,inventoryComplete:truncated.complete
}),{decision:"defer",reason:"unverified-inventory"});
const wrongTenant=mock([{data:[{...newer,metadata:{userId:"another-user",hegevaPlan:"premium"}}],has_more:false}]);
const filtered=await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",fetchImpl:wrongTenant.fetchImpl
});
assert.equal(filtered.complete,true);
assert.equal(filtered.subscriptions.length,0);
const invalidMode=mock([{data:[{...newer,livemode:true}],has_more:false}]);
const mismatch=await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",fetchImpl:invalidMode.fetchImpl
});
assert.equal(mismatch.complete,false);
assert.equal(mismatch.reason,"invalid-subscription");
const badPage=mock([{has_more:false}]);
assert.equal((await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",fetchImpl:badPage.fetchImpl
})).complete,false);
const fail=await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",
  fetchImpl:async()=>{throw new Error("simulated outage");}
});
assert.equal(fail.complete,false);
assert.equal(fail.reason,"provider-unavailable");
const legacyActive=mock([{data:[{...newer,metadata:{}}],has_more:false}]);
const legacyResult=await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",fetchImpl:legacyActive.fetchImpl
});
assert.equal(legacyResult.complete,false);
assert.equal(legacyResult.reason,"unmapped-active-subscription");
assert.deepEqual(decideStripeEntitlement({
  userId,livemode:false,subscriptions:legacyResult.subscriptions,
  inventoryComplete:legacyResult.complete
}),{decision:"defer",reason:"unverified-inventory"});

const legacyTerminal=mock([{data:[{...older,metadata:{}}],has_more:false}]);
const oldTerminalResult=await collectStripeUserSubscriptions({
  userId,livemode:false,secretKey:"sk_test_fixture",fetchImpl:legacyTerminal.fetchImpl
});
assert.equal(oldTerminalResult.complete,true);
assert.equal(oldTerminalResult.subscriptions.length,0);

console.log("Stripe cross-customer inventory integration test PASS");
