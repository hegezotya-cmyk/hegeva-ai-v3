import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"
import { ASSISTANT_TOPUP_PACKS, grantAssistantTopUpPurchase, readAssistantTopUpBalance, reserveAssistantTopUpCredit, finishAssistantTopUpCredit } from "../../src/assistant-topup.js"
import { startAssistantOperation, finishAssistantOperation } from "../../src/assistant-quota.js"

const root = path.resolve(import.meta.dirname, "../..")
const migrations = ["0009_assistant_ai_usage.sql", "0022_assistant_usage_settlement.sql", "0026_assistant_topup_credits.sql", "0028_assistant_topup_purchase_lots.sql", "0030_assistant_weighted_credits.sql"]
  .map((name) => fs.readFileSync(path.join(root, "migrations", name), "utf8")).join("\n")

function adapter(db) {
  return { DB: {
    prepare(sql) { return { bind(...values) { return {
      async first() { return db.prepare(sql).get(...values) },
      async all() { return { results: db.prepare(sql).all(...values) } },
      async run() { const result = db.prepare(sql).run(...values); return { meta: { changes: Number(result.changes) } } },
    } } } },
    async batch(statements) {
      db.exec("BEGIN IMMEDIATE")
      try { const results = []; for (const statement of statements) results.push(await statement.run()); db.exec("COMMIT"); return results }
      catch (error) { db.exec("ROLLBACK"); throw error }
    },
  } }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hegeva-assistant-economics-"))
const db = new DatabaseSync(path.join(tmp, "economics.sqlite"))
try {
  db.exec(migrations)
  const env = adapter(db)
  const userId = "economics-user"
  const workspaceId = "economics-workspace"
  const period = "2026-09"
  const base = { userId, workspaceId, period, planLimit: 8, plan: "premium", provider: "workers-ai", model: "@cf/openai/gpt-oss-120b" }
  const advanced = await startAssistantOperation(env, { ...base, operationId: "11111111-1111-4111-8111-111111111111", creditCost: 8 })
  assert.equal(advanced.reserved, true, "Advanced must atomically reserve eight monthly credits")
  assert.equal(Number(db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId=? AND period=?").get(userId, period).aiMessages), 8)
  const insufficient = await startAssistantOperation(env, { ...base, operationId: "22222222-2222-4222-8222-222222222222", creditCost: 1 })
  assert.equal(insufficient.reason, "assistant_quota_unavailable")
  assert.equal((await finishAssistantOperation(env, { operationId: advanced.operationId, status: "failed" })).settled, true)
  assert.equal(Number(db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId=? AND period=?").get(userId, period).aiMessages), 0, "Advanced failure refunds all eight monthly credits")
  assert.equal((await finishAssistantOperation(env, { operationId: advanced.operationId, status: "timed_out" })).duplicate, true, "monthly refund is exact-once")

  const pack = ASSISTANT_TOPUP_PACKS.small
  assert.deepEqual(pack, { code: "small", credits: 100, amount: 199, currency: "gbp" })
  assert.deepEqual(ASSISTANT_TOPUP_PACKS.medium, { code: "medium", credits: 300, amount: 399, currency: "gbp" })
  assert.deepEqual(ASSISTANT_TOPUP_PACKS.large, { code: "large", credits: 1000, amount: 799, currency: "gbp" })
  await grantAssistantTopUpPurchase(env, { purchaseId: "purchase-a", userId, stripeCheckoutSessionId: "cs-a", stripePaymentIntentId: "pi-a", stripeEventId: "evt-a", packCode: pack.code, credits: pack.credits, amountTotal: pack.amount, currency: pack.currency })
  const topup = await reserveAssistantTopUpCredit(env, { operationId: "33333333-3333-4333-8333-333333333333", userId, credits: 8 })
  assert.equal(topup.reserved, true)
  assert.equal(await readAssistantTopUpBalance(env, userId), 92)
  assert.equal((await finishAssistantTopUpCredit(env, { operationId: topup.operationId, status: "failed" })).settled, true)
  assert.equal(await readAssistantTopUpBalance(env, userId), 100, "Advanced Top-Up failure refunds all eight credits")
  assert.equal((await finishAssistantTopUpCredit(env, { operationId: topup.operationId, status: "failed" })).duplicate, true)
  const sevenCreditUser = "economics-seven-credit-user"
  await grantAssistantTopUpPurchase(env, { purchaseId: "purchase-seven", userId: sevenCreditUser, stripeCheckoutSessionId: "cs-seven", stripePaymentIntentId: "pi-seven", stripeEventId: "evt-seven", packCode: pack.code, credits: 7, amountTotal: pack.amount, currency: pack.currency })
  const sevenCreditTopup = await reserveAssistantTopUpCredit(env, { operationId: "55555555-5555-4555-8555-555555555555", userId: sevenCreditUser, credits: 8 })
  assert.equal(sevenCreditTopup.reason, "topup_credit_unavailable", "Advanced must not partially reserve seven Top-Up credits")
  assert.equal(await readAssistantTopUpBalance(env, sevenCreditUser), 7)
  const insufficientTopup = await reserveAssistantTopUpCredit(env, { operationId: "44444444-4444-4444-8444-444444444444", userId, credits: 101 })
  assert.equal(insufficientTopup.reason, "topup_credit_unavailable")
  assert.equal(await readAssistantTopUpBalance(env, userId), 100)
  console.log("Assistant Economics V1 audit: PASS (weighted monthly/top-up credits, exact refunds, immutable packs, no mixed funding)")
} finally { db.close(); fs.rmSync(tmp, { recursive: true, force: true }) }
