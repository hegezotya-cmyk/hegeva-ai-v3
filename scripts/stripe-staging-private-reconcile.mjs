// Run from the isolated checkout: node scripts/stripe-staging-private-reconcile.mjs
// Opt-in: node scripts/stripe-staging-private-reconcile.mjs --execute
// Remote operations are GET/SELECT only. Nothing is sent to GitHub.
// Local console output contains only aggregate counts or a generic error.
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import assert from "node:assert/strict";
import {reconcilePrivateStagingIdentity} from "../src/stripe-staging-private-reconciliation.js";

const config=readFileSync(new URL("../wrangler.staging.jsonc",import.meta.url),"utf8");
assert.match(config, /"database_name"\s*:\s*"hegeva-ai-staging-db"/);
assert.match(config, /"PAYMENT_MODE"\s*:\s*"test"/);
assert.doesNotMatch(config, /"PAYMENT_MODE"\s*:\s*"live"/);
const execute=process.argv.includes("--execute");
if(!execute){
 console.log("DRY RUN: no remote reads. --execute requires scoped D1 read access and STRIPE_TEST_READONLY_KEY.");
 process.exit(0);
}
const token=process.env.STRIPE_TEST_READONLY_KEY?.trim();
if(!token || !/^(rk_test_|sk_test_)/.test(token)){
 console.log(JSON.stringify({verified:false,status:"BLOCKED",reason:"stripe-test-readonly-key-unavailable"}));
 process.exitCode=2;
} else {
 const readD1=async()=>{
   const args=["wrangler","d1","execute","hegeva-ai-staging-db",
     "--remote","--config","wrangler.staging.jsonc","--json",
     "--command","SELECT userId, stripeCustomerId, stripeSubscriptionId, subscriptionStatus FROM stripe_customers"];
   // No shell interpolation and no stdout/stderr forwarding. Staging config pinned.
   const bin=process.platform==="win32"?"npx.cmd":"npx";
   const raw=execFileSync(bin,args,{cwd:new URL("../",import.meta.url),
      encoding:"utf8",timeout:30000,maxBuffer:8*1024*1024,
      stdio:["ignore","pipe","pipe"]});
   const blocks=JSON.parse(raw);
   if(!Array.isArray(blocks)||blocks.length===0||
      !blocks.every(b=>b?.success===true&&Array.isArray(b.results)))
     throw Error("untrusted-d1-response");
   return blocks.flatMap(b=>b.results);
 };
 const readStripePage=async cursor=>{
   const url=new URL("https://api.stripe.com/v1/subscriptions");
   url.searchParams.set("status","all");
   url.searchParams.set("limit","100");
   if(cursor) url.searchParams.set("starting_after",cursor);
   const res=await fetch(url,{headers:{
       Authorization:`Bearer ${token}`,Accept:"application/json"
     },cache:"no-store",signal:AbortSignal.timeout(30000)});
   if(!res.ok)throw Error("stripe-read-failed");
   return res.json();
 };
 const result=await reconcilePrivateStagingIdentity({readD1,readStripePage});
 console.log(JSON.stringify(result,null,2));
 if(result.status!=="PASS")process.exitCode=2;
}
