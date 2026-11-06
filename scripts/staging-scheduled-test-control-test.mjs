import test from "node:test";
import assert from "node:assert/strict";
import {createStagingScheduledTestController,isStagingScheduledTestControlEnabled} from "../src/staging-scheduled-test-control.js";
const secret="x".repeat(48),nonce="12345678-1234-1234-1234-123456789abc";
function fixture(guard={},opts={}){
 const calls=[];
 const adapter={
  acquire:async()=>{calls.push("acquire");return opts.acquire??true},
  verifyLease:async()=>{calls.push("verifyLease");return opts.leaseValid??true},
  fencedWrite:async({operationCode})=>{calls.push("fencedWrite");return opts.fenced?{ok:false,reason:"lease-invalid"}:{ok:true,operationCode,fencingToken:nonce}},
  runSynthetic:async({assertLease,fencedWrite})=>{calls.push("run");if(opts.throwRun)throw Error("secret must not leak");const grant=await fencedWrite("retry-recovery-apply");if(!grant.ok)return {status:"lease-lost"};if(opts.lateLease)return {status:await assertLease()?"completed":"lease-lost"};return opts.output??{status:"completed"}},
  cleanup:async()=>{calls.push("cleanup");if(opts.throwCleanup)throw Error("private")},
  verifyCleanup:async()=>{calls.push("verify");return opts.verify??true},
  release:async()=>{calls.push("release")}
 };
 return {calls,control:createStagingScheduledTestController({adapter,isStagingBuild:true,enabled:true,paymentMode:"test",authorizationSecret:secret,generateNonce:()=>nonce,...guard})};
}
const valid={authorization:secret,scenario:"retry-recovery"};
test("default-deny, wrong mode and production excluded",async()=>{
 for(const guard of [{enabled:false},{paymentMode:"live"},{isStagingBuild:false}]){
  const {control,calls}=fixture(guard);assert.equal((await control(valid)).status,"denied");assert.equal(calls.length,0);
 }
 assert.equal((await createStagingScheduledTestController()()).status,"denied");
});
test("one canonical environment flag is default-deny",async()=>{
 assert.equal(isStagingScheduledTestControlEnabled({}),false);
 assert.equal(isStagingScheduledTestControlEnabled({OUTBOX_TEST_CONTROL_ENABLED:"true"}),false);
 assert.equal(isStagingScheduledTestControlEnabled({STAGING_SCHEDULED_TEST_CONTROL_ENABLED:"false"}),false);
 assert.equal(isStagingScheduledTestControlEnabled({STAGING_SCHEDULED_TEST_CONTROL_ENABLED:"true"}),true);
 const {control}=fixture({enabled:true},{});
 const envControl=createStagingScheduledTestController({adapter:null,isStagingBuild:true,env:{STAGING_SCHEDULED_TEST_CONTROL_ENABLED:"false"},paymentMode:"test",authorizationSecret:secret});
 assert.equal((await envControl(valid)).code,"disabled");
});
test("authorization and payload allowlist rejects arbitrary IDs and SQL",async()=>{
 const {control,calls}=fixture();
 for(const input of [{...valid,authorization:"wrong"},{...valid,scenario:"select * from users"},{...valid,userId:"a"},{...valid,eventId:"evt_a"},{...valid,nonce}]){
  assert.equal((await control(input)).status,"denied");
 }
 assert.equal(calls.length,0);
});
test("success requires synthetic scenario and verified cleanup",async()=>{
 const {control,calls}=fixture();assert.deepEqual(await control(valid),{status:"completed",code:"scenario-executed",cleanupVerified:true});
 assert.deepEqual(calls,["acquire","verifyLease","run","verifyLease","fencedWrite","verifyLease","cleanup","verify","release"]);
});
test("durable lock/rate-limit denial delegated to adapter",async()=>{
 const {control,calls}=fixture({}, {acquire:false});assert.equal((await control(valid)).code,"single-flight-or-rate-limited");
 assert.deepEqual(calls,["acquire"]);
});
test("exception and cleanup failures fail closed without leaking errors",async()=>{
 for(const opts of [{throwRun:true},{throwCleanup:true},{verify:false}]){
  const {control,calls}=fixture({},opts);const out=await control(valid);
  assert.equal(out.status,"blocked");assert(!JSON.stringify(out).includes("secret"));assert(calls.includes("release"));
 }
 let tick=0;const late=fixture({now:()=>tick++===0?0:20000}, {lateLease:true});assert.equal((await late.control(valid)).status,"blocked");
});
test("untrusted result and invalid nonce cannot complete",async()=>{
 const a=fixture({}, {output:{status:"unsafe-success"}});assert.equal((await a.control(valid)).status,"blocked");
 const b=fixture({generateNonce:()=>"user-id"});assert.equal((await b.control(valid)).status,"blocked");
 const c=fixture({adapter:null});assert.equal((await c.control(valid)).status,"blocked");
});
test("deadline violation fails closed",async()=>{
 let n=0;const {control}=fixture({now:()=>++n===1?0:20000});
 const out=await control(valid);assert.equal(out.code,"deadline-exceeded");assert.equal(out.status,"blocked");
});
