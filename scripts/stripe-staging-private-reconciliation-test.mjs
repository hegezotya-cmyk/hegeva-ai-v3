import assert from "node:assert/strict";
import {reconcilePrivateStagingIdentity as run} from "../src/stripe-staging-private-reconciliation.js";
const d1=[1,2,3,4].map(i=>({
 userId:"user_"+i,stripeCustomerId:"cus_"+i,
 stripeSubscriptionId:"sub_"+i,subscriptionStatus:"active"
}));
const stripe=[1,2,3,4].map(i=>({
 id:"sub_"+i,customer:"cus_"+i,status:"active",livemode:false,
 metadata:{userId:"user_"+i}
}));
stripe.push({id:"sub_5",customer:"cus_5",status:"active",livemode:false,metadata:{userId:"user_1"}});
const paged=await run({readD1:async()=>d1,
 readStripePage:async cursor=>cursor?{data:stripe.slice(3),has_more:false}:{data:stripe.slice(0,3),has_more:true}});
assert.equal(paged.status,"REVIEW_REQUIRED");
assert.equal(paged.counts.matchedStoredIdentities,4);
assert.equal(paged.counts.unrepresentedActiveSubscriptions,1);
assert.equal(paged.counts.multiCustomerActiveUsers,1);
assert.equal(paged.releaseSafe,false);
assert.deepEqual(await run({readD1:async()=>d1,
 readStripePage:async()=>{throw Error("secret must not be leaked")}}),{
 verified:false,status:"BLOCKED",reason:"stripe-read-unavailable"
});
assert.equal((await run({readD1:async()=>{throw Error("private data")},
 readStripePage:async()=>({data:[],has_more:false})})).status,"BLOCKED");
assert.equal((await run({readD1:async()=>d1,
 readStripePage:async()=>({data:stripe.slice(0,1),has_more:true}),
 maxPages:2})).reason,"duplicate-or-invalid-subscription");
assert.equal((await run({readD1:async()=>d1,
 readStripePage:async()=>({data:stripe.map(s=>({...s,livemode:true})),has_more:false})})).reason,"live-mode-subscription");
assert.equal((await run({readD1:async()=>d1,
 readStripePage:async()=>({data:[{...stripe[0],metadata:{}}],has_more:false})})).reason,"unmapped-subscription");
const good=await run({readD1:async()=>d1,readStripePage:async()=>({data:stripe.slice(0,4),has_more:false})});
assert.equal(good.status,"PASS");
assert.equal(good.releaseSafe,true);
assert.ok(!JSON.stringify(paged).includes("cus_"));
assert.ok(!JSON.stringify(paged).includes("user_"));
console.log("Private remote-reader orchestration PASS (offline fixtures only; no network or secrets).");
