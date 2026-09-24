import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { grantAssistantTopUpPurchase, readAssistantTopUpBalance, reserveAssistantTopUpCredit, finishAssistantTopUpCredit, reconcileAssistantTopUpFinancialEvent } from "../../src/assistant-topup.js";

const root = path.resolve(import.meta.dirname, "../..");
const migrations = ["0026_assistant_topup_credits.sql", "0027_assistant_cost_guard.sql", "0028_assistant_topup_purchase_lots.sql"]
  .map(name => fs.readFileSync(path.join(root, "migrations", name), "utf8")).join("\n");
function adapter(database) {
  return {
    DB: {
      prepare(sql) {
        return { bind(...values) {
          return {
            async first() { return database.prepare(sql).get(...values) },
            async all() { return { results: database.prepare(sql).all(...values) } },
            async run() { const result = database.prepare(sql).run(...values); return { meta: { changes: Number(result.changes) } } },
          }
        } }
      },
      async batch(statements) {
        database.exec("BEGIN IMMEDIATE")
        try { const out=[]; for (const statement of statements) out.push(await statement.run()); database.exec("COMMIT"); return out }
        catch (error) { database.exec("ROLLBACK"); throw error }
      },
    },
  }
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hegeva-topup-lots-"));
const db = new DatabaseSync(path.join(tmp, "lots.sqlite"));
try {
  db.exec(migrations); const env=adapter(db), userId="user-lots";
  assert.equal((await grantAssistantTopUpPurchase(env,{purchaseId:"purchase-a",userId,stripeCheckoutSessionId:"cs-a",stripePaymentIntentId:"pi-a",stripeEventId:"evt-a",packCode:"small",credits:2,amountTotal:500,currency:"gbp"})).granted,true);
  assert.equal((await grantAssistantTopUpPurchase(env,{purchaseId:"purchase-b",userId,stripeCheckoutSessionId:"cs-b",stripePaymentIntentId:"pi-b",stripeEventId:"evt-b",packCode:"small",credits:1,amountTotal:500,currency:"gbp"})).granted,true);
  assert.equal(await readAssistantTopUpBalance(env,userId),3);
  const op1="11111111-1111-4111-8111-111111111111", op2="22222222-2222-4222-8222-222222222222";
  assert.equal((await reserveAssistantTopUpCredit(env,{operationId:op1,userId})).lotId,"topup-lot-purchase-a");
  assert.equal((await reserveAssistantTopUpCredit(env,{operationId:op2,userId})).lotId,"topup-lot-purchase-a");
  assert.equal(await readAssistantTopUpBalance(env,userId),1);
  const op3="33333333-3333-4333-8333-333333333333";
  assert.equal((await reserveAssistantTopUpCredit(env,{operationId:op3,userId})).lotId,"topup-lot-purchase-b");
  assert.equal(await readAssistantTopUpBalance(env,userId),0);
  await grantAssistantTopUpPurchase(env,{purchaseId:"purchase-c",userId,stripeCheckoutSessionId:"cs-c",stripePaymentIntentId:"pi-c",stripeEventId:"evt-c",packCode:"small",credits:1,amountTotal:500,currency:"gbp"});
  assert.equal((await reconcileAssistantTopUpFinancialEvent(env,{eventId:"dispute-c",eventType:"dispute_created",eventState:"needs_response",identifiers:{paymentIntentId:"pi-c"}})).reconciled,true);
  assert.equal((await reconcileAssistantTopUpFinancialEvent(env,{eventId:"dispute-c",eventType:"dispute_created",eventState:"needs_response",identifiers:{paymentIntentId:"pi-c"}})).duplicate,true);
  assert.equal((await reconcileAssistantTopUpFinancialEvent(env,{eventId:"dispute-c-close",eventType:"dispute_closed",eventState:"won",identifiers:{paymentIntentId:"pi-c"}})).reconciled,true);
  const partialUser="user-partial";
  await grantAssistantTopUpPurchase(env,{purchaseId:"purchase-e",userId:partialUser,stripeCheckoutSessionId:"cs-e",stripePaymentIntentId:"pi-e",stripeEventId:"evt-e",packCode:"small",credits:2,amountTotal:500,currency:"gbp"});
  assert.equal((await reconcileAssistantTopUpFinancialEvent(env,{eventId:"refund-e",eventType:"refund",eventState:"succeeded",identifiers:{paymentIntentId:"pi-e"},amount:100,currency:"gbp"})).reconciled,true);
  const partial=db.prepare("SELECT remainingCredits,revokedCredits,paymentState,reconciliationRequired FROM assistant_topup_credit_lots WHERE lotId='topup-lot-purchase-e'").get();
  assert.deepEqual({...partial},{remainingCredits:2,revokedCredits:0,paymentState:"reconciliation-required",reconciliationRequired:1});
  assert.match(migrations,/uq_assistant_topup_lots_payment_intent/);
  assert.match(migrations,/uq_assistant_topup_lots_charge/);
  const concurrentUser="user-concurrent";
  await grantAssistantTopUpPurchase(env,{purchaseId:"purchase-d",userId:concurrentUser,stripeCheckoutSessionId:"cs-d",stripePaymentIntentId:"pi-d",stripeEventId:"evt-d",packCode:"small",credits:1,amountTotal:500,currency:"gbp"});
  const concurrent=await Promise.all(["55555555-5555-4555-8555-555555555555","66666666-6666-4666-8666-666666666666"].map(operationId=>reserveAssistantTopUpCredit(env,{operationId,userId:concurrentUser})));
  assert.equal(concurrent.filter(result=>result.reserved).length,1);
  assert.equal(concurrent.filter(result=>result.reason==="topup_credit_unavailable").length,1);
  const pendingRefund=await reconcileAssistantTopUpFinancialEvent(env,{eventId:"refund-b",eventType:"refund",eventState:"succeeded",identifiers:{paymentIntentId:"pi-b"},amount:500,currency:"gbp"});
  assert.equal(pendingRefund.reconciled,true);
  assert.equal((await finishAssistantTopUpCredit(env,{operationId:op3,status:"failed"})).settled,true);
  assert.equal(await readAssistantTopUpBalance(env,userId),0);
  assert.equal((await finishAssistantTopUpCredit(env,{operationId:op1,status:"succeeded"})).settled,true);
  assert.equal((await finishAssistantTopUpCredit(env,{operationId:op2,status:"failed"})).settled,true);
  assert.equal((await finishAssistantTopUpCredit(env,{operationId:op2,status:"failed"})).duplicate,true);
  const lotA=db.prepare("SELECT originalCredits,remainingCredits,reservedCredits,consumedCredits,revokedCredits FROM assistant_topup_credit_lots WHERE lotId='topup-lot-purchase-a'").get();
  assert.deepEqual({...lotA},{originalCredits:2,remainingCredits:1,reservedCredits:0,consumedCredits:1,revokedCredits:0});
  const refund=await reconcileAssistantTopUpFinancialEvent(env,{eventId:"refund-1",eventType:"refund",eventState:"succeeded",identifiers:{paymentIntentId:"pi-a"},amount:500,currency:"gbp"});
  assert.equal(refund.reconciled,true); assert.equal((await reconcileAssistantTopUpFinancialEvent(env,{eventId:"refund-1",eventType:"refund",eventState:"succeeded",identifiers:{paymentIntentId:"pi-a"}})).duplicate,true);
  const refunded=db.prepare("SELECT remainingCredits,consumedCredits,revokedCredits,paymentState,reconciliationRequired FROM assistant_topup_credit_lots WHERE lotId='topup-lot-purchase-a'").get();
  assert.deepEqual({...refunded},{remainingCredits:0,consumedCredits:1,revokedCredits:1,paymentState:"refunded",reconciliationRequired:1});
  assert.equal(await readAssistantTopUpBalance(env,userId),0);
  const indexSource=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
  assert.match(indexSource,/payment_method_types\[0\].*card/);
  assert.match(indexSource,/payment_status.*paid/);
  assert.match(indexSource,/amount_total.*pack\.amount/);
  assert.match(indexSource,/currency.*pack\.currency/);
  assert.match(indexSource,/charge\.refunded|refund\.created/);
  assert.match(indexSource,/reconcileAssistantTopUpFinancialEvent/);
  assert.match(indexSource,/dispute_created/);
  assert.match(indexSource,/dispute_updated/);
  assert.match(indexSource,/dispute_closed/);
  console.log("assistant top-up purchase-lot audit: PASS (grant, FIFO, settlement, refund/dispute ledger, idempotency, wallet projection)");
} finally { db.close(); fs.rmSync(tmp,{recursive:true,force:true}) }
