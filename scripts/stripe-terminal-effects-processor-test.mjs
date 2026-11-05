import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA,prepareTerminalEffect } from "../src/stripe-terminal-effects-outbox.js";
import { processNextTerminalEffect } from "../src/stripe-terminal-effects-processor.js";

const db=new DatabaseSync(":memory:");
const adapter={prepare(sql){return {bind(...args){const prepared=db.prepare(sql);
 return {run:async()=>({meta:{changes:prepared.run(...args).changes}}),
  first:async()=>prepared.get(...args)??null};
}}}};
db.exec(TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA);
const t="2026-11-05T02:00:00.000Z";
const insert=(id,effectType="billing-and-referral-downgrade")=>{
 const p=prepareTerminalEffect({eventId:id,userId:"test_user",effectType,
   subscriptionId:"sub_old",customerId:"cus_old",livemode:false,now:t});
 db.prepare(p.sql).run(...p.values);
};
const state=plan=>async()=>({currentPlan:plan,currentPlanVerified:true,
 newerEventExists:false,newerEventsVerified:true});
let executions=[];
const execute=async job=>{executions.push(job.idempotencyKey);};
try {
 insert("evt_a");
 let r=await processNextTerminalEffect({db:adapter,now:t,checkCurrentState:state("basic"),executeIdempotently:execute});
 assert.equal(r.status,"completed");
 assert.deepEqual(executions,["evt_a"]);
 assert.equal(db.prepare("SELECT state FROM stripe_terminal_effect_outbox WHERE eventId='evt_a'").get().state,"completed");
 r=await processNextTerminalEffect({db:adapter,now:t,checkCurrentState:state("basic"),executeIdempotently:execute});
 assert.equal(r.status,"empty");
 insert("evt_b");
 r=await processNextTerminalEffect({db:adapter,now:t,checkCurrentState:state("premium"),executeIdempotently:execute});
 assert.equal(r.status,"skipped-stale");
 assert.deepEqual(executions,["evt_a"],"old downgrade side effect must never run after Premium restore");
 insert("evt_c");
 r=await processNextTerminalEffect({db:adapter,now:t,checkCurrentState:async()=>{throw Error("offline");},executeIdempotently:execute});
 assert.equal(r.status,"retry-scheduled");
 assert.equal(db.prepare("SELECT state FROM stripe_terminal_effect_outbox WHERE eventId='evt_c'").get().state,"pending");
 const beforeDue=new Date(Date.parse(t)+5000).toISOString();
 r=await processNextTerminalEffect({db:adapter,now:beforeDue,checkCurrentState:state("basic"),executeIdempotently:execute});
 assert.equal(r.status,"empty");
 const afterDue=new Date(Date.parse(t)+35000).toISOString();
 r=await processNextTerminalEffect({db:adapter,now:afterDue,checkCurrentState:state("basic"),executeIdempotently:execute});
 assert.equal(r.status,"completed");
 assert.deepEqual(executions,["evt_a","evt_c"]);
 insert("evt_d");
 r=await processNextTerminalEffect({db:adapter,now:t,checkCurrentState:state("basic"),executeIdempotently:async()=>{throw Error("injected");}});
 assert.equal(r.status,"retry-scheduled");
 assert.equal(db.prepare("SELECT state FROM stripe_terminal_effect_outbox WHERE eventId='evt_d'").get().state,"pending");
 insert("evt_e","referral-retain");
 r=await processNextTerminalEffect({db:adapter,now:t,checkCurrentState:state("basic"),executeIdempotently:execute});
 assert.equal(r.status,"skipped-stale");
 insert("evt_f");
 r=await processNextTerminalEffect({db:adapter,now:t,
   checkCurrentState:async()=>({currentPlan:"basic",currentPlanVerified:true,newerEventExists:true,newerEventsVerified:true}),
   executeIdempotently:execute});
 assert.equal(r.status,"retry-scheduled");
 assert(!executions.includes("evt_f"));
 console.log("Isolated SQLite outbox processor PASS: lease, idempotent key, stale skip, backoff, retries, fail-closed state");
} finally {db.close();}
