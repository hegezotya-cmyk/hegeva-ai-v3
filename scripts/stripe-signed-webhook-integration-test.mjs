// Signed HTTP webhook regression using the real draft index-ledger.js module,
// mocked Stripe network and an in-memory D1-shaped query executor. No secrets,
// real Stripe calls, D1 writes, deployed Worker, or production data.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHmac, webcrypto } from "node:crypto";

const temp=mkdtempSync(join(tmpdir(),"hegeva-stripe-webhook-"));
const original=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const dep=(name)=>new URL("../src/"+name,import.meta.url).href;
const source=original
 .replace('import { getLoggedInUser } from "./auth.js";',
   'const getLoggedInUser=async()=>null;')
 .replace('import { readOwnerAccess } from "./admin-registrations.js";',
   'const readOwnerAccess=async()=>({ok:false});')
 .replace('import { reconcilePrivateStagingIdentity } from "./stripe-staging-private-reconciliation.js";',
   'const reconcilePrivateStagingIdentity=async()=>({verified:false,status:"BLOCKED"});')
 .replace('import hegevaWorker, { emitMonitor } from "./index.js";',
   'const hegevaWorker={fetch:async()=>Response.json({delegated:true})}; const emitMonitor=()=>{};')
 .replace('import { reconcileReferralRewardForUser, reverseApprovedReferralRewards } from "./referral-reward-review.js";',
   'const reconcileReferralRewardForUser=async()=>{}; const reverseApprovedReferralRewards=async()=>{};')
 .replace('import { processNextTerminalEffect } from "./stripe-terminal-effects-processor.js";',
   'const processNextTerminalEffect=async()=>({status:"disabled-in-isolated-webhook-fixture"});')
 .replace('from "./stripe-terminal-effects-state-checker.js"',`from "${dep("stripe-terminal-effects-state-checker.js")}"`)
 .replace('export { UserRateLimiter } from "./user-rate-limiter-do.js";','')
 .replace('from "./stripe-subscription-inventory.js"',`from "${dep("stripe-subscription-inventory.js")}"`)
 .replace('from "./stripe-terminal-event-review.js"',`from "${dep("stripe-terminal-event-review.js")}"`)
 .replace('from "./stripe-terminal-effects-outbox.js"',`from "${dep("stripe-terminal-effects-outbox.js")}"`)
 .replace('from "./stripe-terminal-billing-identity.js"',`from "${dep("stripe-terminal-billing-identity.js")}"`);
writeFileSync(join(temp,"ledger.mjs"),source);
let handler;
try { handler=(await import(pathToFileURL(join(temp,"ledger.mjs")).href)).default; }
finally { rmSync(temp,{recursive:true,force:true}); }

const old={id:"sub_old",customer:"cus_old",livemode:false,status:"canceled",
 metadata:{userId:"test_user",hegevaPlan:"premium"}};
const active={id:"sub_active",customer:"cus_other",livemode:false,status:"active",
 metadata:{userId:"test_user",hegevaPlan:"premium"}};
const makeDb=()=> {
 const operations=[];let claims=new Set();const outcomes=new Map();
 const DB={prepare(sql){return {bind(...args){return {
  async run(){
    operations.push({sql,args});
    if(sql.includes("INSERT INTO stripe_webhook_events")){
      if(claims.has(args[0]))return {meta:{changes:0}};
      claims.add(args[0]);outcomes.set(args[0],"ignored");return {meta:{changes:1}};
    }
    if(sql.includes("DELETE FROM stripe_webhook_events")){ claims.delete(args[0]);outcomes.delete(args[0]); }
    if(sql.includes("UPDATE stripe_webhook_events"))outcomes.set(args[2],args[0]);
    return {meta:{changes:1}};
  },
  async first(){
    if(sql.includes("SELECT outcome FROM stripe_webhook_events")){
      return outcomes.has(args[0]) ? {outcome:outcomes.get(args[0])} : null;
    }
    return null;
  },
  async all(){return {results:[]};},
 };}};}};
 DB.batch=async statements=>{const results=[];for(const statement of statements)results.push(await statement.run());return results;};
 return {DB,operations,claims,outcomes};
};
const secret="whsec_local_fixture";
const previousFetch=globalThis.fetch;
const previousCrypto=globalThis.crypto;
Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true});
const requestFor=(event,{sign=true,path="/api/billing/webhook",signingSecret=secret}={})=>{
 const body=JSON.stringify(event);
 const timestamp=Math.floor(Date.now()/1000);
 const signature=createHmac("sha256",signingSecret).update(`${timestamp}.${body}`).digest("hex");
 return new Request(`https://staging.invalid${path}`,{
  method:"POST",headers:{"Stripe-Signature":`t=${timestamp},v1=${sign?signature:"0".repeat(64)}`},
  body
 });
};
const eventFor=(type,status="canceled",id="evt_one")=>({
 id,type,livemode:false,created:Math.floor(Date.now()/1000),
 data:{object:{...old,status}}
});
async function send(event,rows,{networkFailure=false,sign=true}={}){
 const {DB,operations}=makeDb();
 globalThis.fetch=async url=>{
  if(networkFailure)throw Error("mock Stripe offline");
  assert.equal(new URL(url).pathname,"/v1/subscriptions");
  return {ok:true,json:async()=>({data:rows,has_more:false})};
 };
 const response=await handler.fetch(requestFor(event,{sign}),{
  DB,PAYMENT_MODE:"test",STRIPE_SECRET_KEY:"sk_test_fixture",
  STRIPE_WEBHOOK_SECRET:secret
 },{});
 return {status:response.status,json:await response.json(),operations};
}
const planWrites=(ops)=>ops.filter(o=>o.sql.includes("INSERT INTO user_plans"));
const sandboxSecret="whsec_sandbox_fixture";
const sandboxApiKey="sk_test_sandbox_fixture";
try {
 // Missing sandbox credentials must fail closed instead of delegating to the
 // primary webhook or invoking Stripe.
 {
  const {DB}=makeDb();
  const response=await handler.fetch(requestFor(eventFor("customer.subscription.deleted","canceled","evt_sandbox_missing"),{path:"/api/billing/sandbox-webhook",signingSecret:sandboxSecret}),{
   DB,PAYMENT_MODE:"test",STRIPE_SECRET_KEY:"sk_test_primary_fixture",STRIPE_WEBHOOK_SECRET:secret
  },{});
  assert.equal(response.status,503);
 }
 // The dedicated sandbox endpoint must use its own signature and API secrets,
 // while the established billing endpoint continues to use the primary pair. Test first.
 {
  const {DB,operations}=makeDb();
  let authorization;
  globalThis.fetch=async(url,options)=>{
   assert.equal(new URL(url).pathname,"/v1/subscriptions");
   authorization=options.headers.Authorization;
   return {ok:true,json:async()=>({data:[old,active],has_more:false})};
  };
  const event=eventFor("customer.subscription.deleted","canceled","evt_sandbox_route");
  const response=await handler.fetch(requestFor(event,{path:"/api/billing/sandbox-webhook",signingSecret:sandboxSecret}),{
   DB,PAYMENT_MODE:"test",STRIPE_SECRET_KEY:"sk_test_primary_fixture",
   STRIPE_WEBHOOK_SECRET:secret,STRIPE_SANDBOX_SECRET_KEY:sandboxApiKey,
   STRIPE_SANDBOX_WEBHOOK_SECRET:sandboxSecret
  },{});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.verified,true);
  assert.equal(result.resultingPlan,"premium");
  assert.equal(authorization,`Bearer ${sandboxApiKey}`);
  assert.equal(planWrites(operations)[0].args[1],"premium");
 }
 for(const type of ["customer.subscription.updated","customer.subscription.deleted"]){
  const kept=await send(eventFor(type),[old,active]);
  assert.equal(kept.status,200);
  assert.equal(kept.json.inventoryReconciled,true);
  assert.equal(kept.json.resultingPlan,"premium");
  assert.equal(planWrites(kept.operations).length,1);
  assert.equal(planWrites(kept.operations)[0].args[1],"premium");

  const final=await send(eventFor(type),[old]);
  assert.equal(final.status,200);
  assert.equal(final.json.resultingPlan,"basic");
  assert.equal(planWrites(final.operations)[0].args[1],"basic");

  const offline=await send(eventFor(type),[],{networkFailure:true});
  assert.equal(offline.status,503);
  assert.equal(planWrites(offline.operations).length,0);
  assert(offline.operations.some(o=>o.sql.includes("DELETE FROM stripe_webhook_events")));

  const invalid=await send(eventFor(type),[old,active],{sign:false});
  assert.equal(invalid.status,400);
  assert.equal(planWrites(invalid.operations).length,0);
 }
 const malformed=await send(eventFor("customer.subscription.deleted",undefined),[old,active]);
 // The default canceled status above still allows reconciliation.
 assert.equal(malformed.status,200);

// Repeated delivery shares the same D1 state. The first claim is pending;
// the second must be retryable instead of claiming success before reconciliation.
{
 const {DB,operations}=makeDb();
 globalThis.fetch=async()=>({ok:true,json:async()=>({data:[old,active],has_more:false})});
 const env={DB,PAYMENT_MODE:"test",STRIPE_SECRET_KEY:"sk_test_fixture",STRIPE_WEBHOOK_SECRET:secret};
 const evt=eventFor("customer.subscription.deleted","canceled","evt_repeat");
 // Simulate another Worker having claimed this event but not yet finalized it.
 await DB.prepare("INSERT INTO stripe_webhook_events").bind("evt_repeat").run();
 const duplicatePending=await handler.fetch(requestFor(evt),env,{});
 assert.equal(duplicatePending.status,503);
 assert.equal(planWrites(operations).length,0);
 // Once a previous event is marked as reconciled, it is safe to ack without
 // repeating any plan write, regardless of whether it changed the plan.
 await DB.prepare("UPDATE stripe_webhook_events").bind("reconciled",new Date().toISOString(),"evt_repeat").run();
 const duplicateSettled=await handler.fetch(requestFor(evt),env,{});
 assert.equal(duplicateSettled.status,200);
 assert.equal((await duplicateSettled.json()).duplicate,true);
 assert.equal(planWrites(operations).length,0);
}
 // Deferred terminal reconciliation emits only the fixed policy reason and
 // must not log Stripe event, customer, subscription, or user identifiers.
 {
  const {DB}=makeDb();
  const warnings=[];
  const previousWarn=console.warn;
  globalThis.fetch=async()=>{throw Error("private-fixture-network-detail");};
  console.warn=(...args)=>warnings.push(args);
  try {
   const event=eventFor("customer.subscription.deleted","canceled","evt_log_privacy");
   const response=await handler.fetch(requestFor(event),{
    DB,PAYMENT_MODE:"test",STRIPE_SECRET_KEY:"sk_test_fixture",
    STRIPE_WEBHOOK_SECRET:secret
   },{});
   assert.equal(response.status,503);
   assert.equal(warnings.length,1);
   assert.equal(warnings[0][0],"HEGEVA_REQUEST_FAILURE");
   assert.deepEqual(warnings[0][1],{
    reason:"stripe_terminal_reconciliation_deferred",
    decisionReason:"incomplete-inventory"
   });
   const logged=JSON.stringify(warnings);
   for(const privateValue of ["evt_log_privacy","sub_old","cus_old","test_user","private-fixture-network-detail"]){
    assert.equal(logged.includes(privateValue),false);
   }
  } finally {
   console.warn=previousWarn;
  }
 }
 console.log("Signed terminal Stripe Worker + mocked D1 integration PASS (updated/deleted; keep, downgrade, retry, bad signature)");
} finally {
 globalThis.fetch=previousFetch;
 if(previousCrypto===undefined)delete globalThis.crypto;
 else Object.defineProperty(globalThis,"crypto",{value:previousCrypto,configurable:true});
}
