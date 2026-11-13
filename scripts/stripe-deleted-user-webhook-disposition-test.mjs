import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { deletedUserWebhookGuardEnabled, dispositionForDeletedTestUser } from "../src/stripe-deleted-user-webhook-disposition.js";

const sql = readFileSync(new URL("../docs/release/2026-11-11-staging-orphan-plan-guards.sql", import.meta.url), "utf8");
const STAGING = "https://staging.hegevaai.co.uk";
function makeDb(t, { installGuards = true } = {}) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE "user" (id TEXT PRIMARY KEY);
    CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE stripe_customers (userId TEXT PRIMARY KEY, stripeCustomerId TEXT NOT NULL, stripeSubscriptionId TEXT, subscriptionStatus TEXT);
    CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY, eventType TEXT NOT NULL, userId TEXT, plan TEXT, eventCreatedAt TEXT NOT NULL, processedAt TEXT NOT NULL, outcome TEXT NOT NULL CHECK (outcome IN ('applied','ignored')));
  `);
  if (installGuards) db.exec(sql);
  db.exec("INSERT INTO \"user\" VALUES ('qa-user'),('another-user')");
  db.exec("INSERT INTO user_plans VALUES ('qa-user','premium','now','now')");
  return {
    raw:db,
    prepare(text) {
      const stmt = db.prepare(text);
      return {
        bind(...args) {
          return {
            async first() { return stmt.get(...args) || null; },
            async run() { const r=stmt.run(...args); return { meta:{ changes:r.changes } }; }
          };
        }
      };
    }
  };
}
const count = (db,table) => db.raw.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
function event(id="evt_testA",userId="qa-user",type="invoice.paid") {
  return {id,object:"event",type,livemode:false,created:1794502000,data:{object:{
    metadata:{userId,hegevaPlan:"premium"},
    parent:{subscription_details:{metadata:{userId,hegevaPlan:"premium"}}},
  }}};
}
const run = (db,input=event(),opts={}) => dispositionForDeletedTestUser({
  db,event:input,paymentMode:"test",publicAppUrl:STAGING,now:"2026-11-12T18:45:00.000Z",...opts,
});
const remove = db=>db.raw.prepare('DELETE FROM "user" WHERE id=?').run("qa-user");

test("guard is OFF by default and requires explicit staging TEST scope",()=>{
  assert.equal(deletedUserWebhookGuardEnabled({}),false);
  assert.equal(deletedUserWebhookGuardEnabled({HEGEVA_DELETED_USER_WEBHOOK_GUARD_ENABLED:"enabled"}),false);
  const staging = {
    HEGEVA_DELETED_USER_WEBHOOK_GUARD_ENABLED:"TRUE",
    PAYMENT_MODE:"test",
    PUBLIC_APP_URL:STAGING,
  };
  assert.equal(deletedUserWebhookGuardEnabled(staging),true);
  assert.equal(deletedUserWebhookGuardEnabled({...staging,HEGEVA_DELETED_USER_WEBHOOK_GUARD_ENABLED:"false"}),false);
  assert.equal(deletedUserWebhookGuardEnabled({...staging,PUBLIC_APP_URL:"https://hegevaai.co.uk"}),false);
  assert.equal(deletedUserWebhookGuardEnabled({...staging,PAYMENT_MODE:"live"}),false);
  assert.equal(deletedUserWebhookGuardEnabled({...staging,PAYMENT_MODE:""}),false);
  assert.equal(deletedUserWebhookGuardEnabled({...staging,PUBLIC_APP_URL:""}),false);
});
test("accidentally enabling the guard in LIVE never intercepts billing webhooks",()=>{
  const enabled = deletedUserWebhookGuardEnabled({
    HEGEVA_DELETED_USER_WEBHOOK_GUARD_ENABLED:"true",
    PAYMENT_MODE:"live",
    PUBLIC_APP_URL:"https://hegevaai.co.uk",
  });
  assert.equal(enabled,false);
});
test("live mode or production origin fails closed",async t=>{
  const db=makeDb(t);remove(db);
  await assert.rejects(run(db,event(),{paymentMode:"live"}),/context-invalid/);
  await assert.rejects(run(db,event(),{publicAppUrl:"https://hegevaai.co.uk"}),/context-invalid/);
  assert.equal(count(db,"stripe_webhook_events"),0);
});
test("valid user without tombstone continues normal path with no ledger mutation",async t=>{
  const db=makeDb(t);
  assert.deepEqual(await run(db),{handled:false});
  assert.equal(count(db,"stripe_webhook_events"),0);
});
test("actual auth deletion writes one tombstone and clears plan, preserving historical billing audit",t=>{
  const db=makeDb(t);
  db.raw.exec("INSERT INTO stripe_customers VALUES('qa-user','cus_pre','sub_pre','canceled')");
  db.raw.exec("INSERT INTO stripe_webhook_events VALUES('evt_pre','invoice.paid','qa-user','premium','2026-10-01','2026-10-01','applied')");
  remove(db);
  assert.equal(count(db,"hegeva_deleted_user_tombstones"),1);
  assert.equal(count(db,"user_plans"),0);
  assert.equal(count(db,"stripe_customers"),1);
  assert.equal(count(db,"stripe_webhook_events"),1);
});
test("deleted-user signed event is recorded ignored once, replay is idempotent",async t=>{
  const db=makeDb(t);remove(db);
  assert.deepEqual(await run(db),{handled:true,duplicate:false,ignored:true});
  assert.deepEqual(await run(db),{handled:true,duplicate:true,ignored:true});
  assert.equal(count(db,"stripe_webhook_events"),1);
  assert.equal(count(db,"stripe_customers"),0);
  assert.equal(count(db,"user_plans"),0);
  assert.equal(db.raw.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_testA'").get().outcome,"ignored");
});
test("duplicate concurrent deliveries yield exactly one ignored event",async t=>{
  const db=makeDb(t);remove(db);
  const res=await Promise.all(Array.from({length:12},()=>run(db)));
  assert.equal(res.filter(v=>v.handled&&!v.duplicate).length,1);
  assert.equal(count(db,"stripe_webhook_events"),1);
});
test("event ID collision with another user fails closed rather than acknowledging",async t=>{
  const db=makeDb(t);remove(db);
  db.raw.exec("INSERT INTO stripe_webhook_events VALUES('evt_testA','invoice.paid','another-user','premium','2026-10-01','2026-10-01','applied')");
  await assert.rejects(run(db),/ledger-conflict/);
  assert.equal(count(db,"stripe_webhook_events"),1);
});
test("previously applied event remains applied after account deletion",async t=>{
  const db=makeDb(t);
  db.raw.exec("INSERT INTO stripe_webhook_events VALUES('evt_testA','invoice.paid','qa-user','premium','2026-10-01','2026-10-01','applied')");
  remove(db);
  assert.deepEqual(await run(db),{handled:true,duplicate:true,ignored:false});
  assert.equal(db.raw.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_testA'").get().outcome,"applied");
});
test("missing tombstone table while opted in does not silently bypass",async t=>{
  const db=makeDb(t,{installGuards:false});
  await assert.rejects(run(db),/no such table/);
  assert.equal(count(db,"stripe_webhook_events"),0);
});
test("unknown user metadata is not mistaken for a verified deletion",async t=>{
  const db=makeDb(t);remove(db);
  assert.deepEqual(await run(db,event("evt_unknown","someone-else")),{handled:false});
  assert.deepEqual(await run(db,event("evt_noid","")),{handled:false});
});
test("late customer identity INSERT and UPDATE are rejected after auth deletion",t=>{
  const db=makeDb(t);
  db.raw.exec("INSERT INTO stripe_customers VALUES('qa-user','cus_pre','sub_pre','active')");
  remove(db);
  assert.throws(()=>db.raw.exec("INSERT INTO stripe_customers VALUES('qa-user','cus_new','sub_new','active')"),/hegeva-billing-auth-user-missing/);
  assert.throws(()=>db.raw.exec("UPDATE stripe_customers SET stripeCustomerId='cus_new' WHERE userId='qa-user'"),/hegeva-billing-auth-user-missing/);
  assert.equal(count(db,"stripe_customers"),1);
});
test("recreated old ID with retained tombstone blocks instead of ignoring valid user",async t=>{
  const db=makeDb(t);remove(db);
  db.raw.exec("INSERT INTO \"user\" VALUES ('qa-user')");
  await assert.rejects(run(db),/identity-conflict/);
});
test("only explicitly supported event families enter tombstone disposition",async t=>{
  const db=makeDb(t);remove(db);
  assert.deepEqual(await run(db,event("evt_unrelated","qa-user","charge.refunded")),{handled:false});
  assert.equal(count(db,"stripe_webhook_events"),0);
});
test("invalid event identity cannot be marked ignored",async t=>{
  const db=makeDb(t);remove(db);
  await assert.rejects(run(db,event("invalid-id")) , /event-invalid/);
  await assert.rejects(run(db,{...event(),created:0}),/event-invalid/);
  assert.equal(count(db,"stripe_webhook_events"),0);
});
test("the live webhook wrapper invokes guard after signed mode and before ledger claim",()=>{
  const source=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
  const signature=source.indexOf("const signatureValid = await verifyStripeWebhookSignature");
  const mode=source.indexOf("if (!eventMatchesMode)");
  const guard=source.indexOf("dispositionForDeletedTestUser({");
  const claim=source.indexOf("claim = await claimStripeEvent(env, event)");
  assert.ok(signature>=0&&mode>signature&&guard>mode&&claim>guard);
  assert.ok(source.includes("if (deletedUserWebhookGuardEnabled(env))"));
});
