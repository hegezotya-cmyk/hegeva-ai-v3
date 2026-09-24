import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"
import { readAssistantTopUpBalance, reserveAssistantTopUpCredit, finishAssistantTopUpCredit, grantAssistantTopUpPurchase } from "../../src/assistant-topup.js"

const root = path.resolve(import.meta.dirname, "../..")
const migration = fs.readFileSync(path.join(root, "migrations/0026_assistant_topup_credits.sql"), "utf8") + "\n" + fs.readFileSync(path.join(root, "migrations/0028_assistant_topup_purchase_lots.sql"), "utf8")

function adapter(db) {
  return { DB: {
    prepare(sql) { return { bind(...values) { return {
      async first() { return db.prepare(sql).get(...values) },
      async run() { const r=db.prepare(sql).run(...values); return { meta:{ changes:Number(r.changes) } } },
    } } } },
    async batch(statements) {
      db.exec("BEGIN IMMEDIATE")
      try {
        const out=[]
        for (const statement of statements) out.push(await statement.run())
        db.exec("COMMIT")
        return out
      } catch (error) {
        db.exec("ROLLBACK")
        throw error
      }
    },
  } }
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"hegeva-topup-"))
const db=new DatabaseSync(path.join(tmp,"topup.sqlite"))
try {
  db.exec(migration)
  const env=adapter(db)
  const userId="user-1"
  const op1="11111111-1111-4111-8111-111111111111"
  const op2="22222222-2222-4222-8222-222222222222"
  const op3="33333333-3333-4333-8333-333333333333"

  let grant=await grantAssistantTopUpPurchase(env,{purchaseId:"topup-cs_1",userId,stripeCheckoutSessionId:"cs_1",stripePaymentIntentId:"pi_1",stripeEventId:"evt_1",packCode:"small",credits:2,amountTotal:500,currency:"gbp"})
  assert.equal(grant.granted,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),2)

  grant=await grantAssistantTopUpPurchase(env,{purchaseId:"topup-cs_1",userId,stripeCheckoutSessionId:"cs_1",stripePaymentIntentId:"pi_1",stripeEventId:"evt_1",packCode:"small",credits:2,amountTotal:500,currency:"gbp"})
  assert.equal(grant.duplicate,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),2)

  let reserve=await reserveAssistantTopUpCredit(env,{operationId:op1,userId})
  assert.equal(reserve.reserved,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),1)
  let settle=await finishAssistantTopUpCredit(env,{operationId:op1,status:"succeeded"})
  assert.equal(settle.settled,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),1)

  reserve=await reserveAssistantTopUpCredit(env,{operationId:op2,userId})
  assert.equal(reserve.reserved,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),0)
  settle=await finishAssistantTopUpCredit(env,{operationId:op2,status:"timed_out"})
  assert.equal(settle.settled,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),1)
  settle=await finishAssistantTopUpCredit(env,{operationId:op2,status:"failed"})
  assert.equal(settle.duplicate,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),1)

  reserve=await reserveAssistantTopUpCredit(env,{operationId:op3,userId})
  assert.equal(reserve.reserved,true)
  assert.equal(await readAssistantTopUpBalance(env,userId),0)
  const op4="44444444-4444-4444-8444-444444444444"
  reserve=await reserveAssistantTopUpCredit(env,{operationId:op4,userId})
  assert.equal(reserve.reserved,false)
  assert.equal(reserve.reason,"topup_credit_unavailable")
  assert.equal(await readAssistantTopUpBalance(env,userId),0)

  console.log("Assistant Top-Up D1 audit passed: webhook idempotency, reserve, settle, refund-once, hard-stop")
} finally {
  db.close()
  fs.rmSync(tmp,{recursive:true,force:true})
}
