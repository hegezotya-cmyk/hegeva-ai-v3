import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA,prepareTerminalEffect} from "../src/stripe-terminal-effects-outbox.js";
import {processNextTerminalEffect} from "../src/stripe-terminal-effects-processor.js";

const db = new DatabaseSync(":memory:");
db.exec(TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA);
const adapter = {
  prepare(sql) {
    return { bind(...args) {
      const p = db.prepare(sql);
      return {
        first: async () => p.get(...args) ?? null,
        run: async () => ({meta:{changes:p.run(...args).changes}}),
      };
    }};
  },
};
const t="2026-11-06T00:00:00.000Z";
const p=prepareTerminalEffect({eventId:"evt_fixture",userId:"fixture_user",effectType:"billing-and-referral-downgrade",subscriptionId:"sub_fixture",customerId:"cus_fixture",livemode:false,now:t});
db.prepare(p.sql).run(...p.values);
let verified=false, executions=0;
const check=async()=>verified?{currentPlan:"basic",currentPlanVerified:true,newerEventExists:false,newerEventsVerified:true,stateCheckReason:"verified"}:{currentPlan:"",currentPlanVerified:false,newerEventExists:false,newerEventsVerified:false,stateCheckReason:"plan-unverified"};
let r=await processNextTerminalEffect({db:adapter,now:t,checkCurrentState:check,executeIdempotently:async()=>{executions++;}});
assert.equal(r.status,"retry-scheduled");
verified=true;
r=await processNextTerminalEffect({db:adapter,now:new Date(Date.parse(t)+35_000).toISOString(),checkCurrentState:check,executeIdempotently:async()=>{executions++;}});
assert.equal(r.status,"completed");
assert.equal(executions,1);
assert.equal(db.prepare("SELECT state,attempts FROM stripe_terminal_effect_outbox WHERE eventId='evt_fixture'").get().state,"completed");
db.exec("DELETE FROM stripe_terminal_effect_outbox WHERE eventId='evt_fixture'");
assert.equal(db.prepare("SELECT COUNT(*) AS count FROM stripe_terminal_effect_outbox").get().count,0);
db.close();
console.log("Synthetic fixture adapter PASS: retry -> recovery -> completed, one idempotent execution, zero cleanup residue");
