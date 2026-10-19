import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"
import {
  readAssistantCostGuardConfig,
  reserveAssistantCostGuard,
  settleAssistantCostGuard,
} from "../../src/assistant-cost-guard.js"
import { handleAiChatAdmission } from "../../src/ai-chat-admission.js"

const root = path.resolve(import.meta.dirname, "../..")
const migration = fs.readFileSync(path.join(root, "migrations/0027_assistant_cost_guard.sql"), "utf8")

function adapter(db) {
  return { DB: {
    prepare(sql) { return { bind(...values) { return {
      async first() { return db.prepare(sql).get(...values) },
      async run() { const r = db.prepare(sql).run(...values); return { meta: { changes: Number(r.changes) } } },
    } } } },
    async batch(statements) {
      db.exec("BEGIN IMMEDIATE")
      try {
        const out = []
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hegeva-cost-guard-"))
const db = new DatabaseSync(path.join(tmp, "guard.sqlite"))
const env = adapter(db)
const baseConfig = {
  AI_GLOBAL_INCLUDED_BUDGET_UNITS: "2",
  AI_GLOBAL_PREPAID_BUDGET_UNITS: "2",
  AI_GLOBAL_EMERGENCY_CAP_UNITS: "3",
  AI_GLOBAL_REQUEST_RESERVATION_UNITS: "1",
}
const configured = readAssistantCostGuardConfig(baseConfig)

try {
  db.exec(migration)
  assert.equal(readAssistantCostGuardConfig(baseConfig).configured, true)
  assert.equal(readAssistantCostGuardConfig({}).configured, false)

  let result = await reserveAssistantCostGuard(env, { operationId: "11111111-1111-4111-8111-111111111111", period: "2026-09", fundingClass: "included", config: configured })
  assert.equal(result.reserved, true)
  result = await settleAssistantCostGuard(env, { operationId: "11111111-1111-4111-8111-111111111111", status: "settled" })
  assert.equal(result.settled, true)
  assert.equal((await settleAssistantCostGuard(env, { operationId: "11111111-1111-4111-8111-111111111111", status: "released" })).duplicate, true)

  result = await reserveAssistantCostGuard(env, { operationId: "22222222-2222-4222-8222-222222222222", period: "2026-09", fundingClass: "prepaid", config: configured })
  assert.equal(result.reserved, true)
  assert.equal((await reserveAssistantCostGuard(env, { operationId: "22222222-2222-4222-8222-222222222222", period: "2026-09", fundingClass: "prepaid", config: configured })).duplicate, true)
  assert.equal((await settleAssistantCostGuard(env, { operationId: "22222222-2222-4222-8222-222222222222", status: "released" })).settled, true)

  const emergencyConfig = readAssistantCostGuardConfig({ ...baseConfig, AI_GLOBAL_EMERGENCY_CAP_UNITS: "1" })
  result = await reserveAssistantCostGuard(env, { operationId: "33333333-3333-4333-8333-333333333333", period: "2026-10", fundingClass: "included", config: emergencyConfig })
  assert.equal(result.reserved, true)
  await settleAssistantCostGuard(env, { operationId: "33333333-3333-4333-8333-333333333333", status: "settled" })
  result = await reserveAssistantCostGuard(env, { operationId: "77777777-7777-4777-8777-777777777777", period: "2026-10", fundingClass: "included", config: emergencyConfig })
  assert.equal(result.reserved, false)
  assert.equal(result.reason, "emergency_budget_exhausted")

  result = await reserveAssistantCostGuard(env, { operationId: "44444444-4444-4444-8444-444444444444", period: "2026-11", fundingClass: "included", config: configured })
  assert.equal(result.reserved, true)
  await settleAssistantCostGuard(env, { operationId: "44444444-4444-4444-8444-444444444444", status: "settled" })
  result = await reserveAssistantCostGuard(env, { operationId: "55555555-5555-4555-8555-555555555555", period: "2026-11", fundingClass: "included", config: configured })
  assert.equal(result.reserved, true)
  await settleAssistantCostGuard(env, { operationId: "55555555-5555-4555-8555-555555555555", status: "settled" })
  result = await reserveAssistantCostGuard(env, { operationId: "66666666-6666-4666-8666-666666666666", period: "2026-11", fundingClass: "included", config: configured })
  assert.equal(result.reserved, false)
  assert.equal(result.reason, "included_budget_exhausted")

  async function admission({ monthlyReserved, topupReserved = false, guardReserved = true }) {
    let executed = 0
    let released = 0
    const response = await handleAiChatAdmission({
      request: new Request("https://local/api/chat", { method: "POST", body: JSON.stringify({ message: "safe test", assistantOperationId: "88888888-8888-4888-8888-888888888888" }) }),
      user: { id: "user-1" }, planInfo: { plan: "premium", limit: 300 }, period: "2026-09",
      body: { message: "safe test", assistantOperationId: "88888888-8888-4888-8888-888888888888" },
      runtime: { inFlight: new Set(), lastRequest: new Map() },
      distributed: { async admit() { return { allowed: true, token: "token" } }, async release() {} },
      reserve: async () => ({ reserved: monthlyReserved, reason: monthlyReserved ? undefined : "assistant_quota_unavailable", operationId: "88888888-8888-4888-8888-888888888888" }),
      reserveTopUp: async () => ({ reserved: topupReserved, reason: topupReserved ? undefined : "topup_credit_unavailable", operationId: "88888888-8888-4888-8888-888888888888" }),
      reserveGlobal: async () => ({ reserved: guardReserved, reason: guardReserved ? undefined : "included_budget_exhausted", operationId: "88888888-8888-4888-8888-888888888888" }),
      releaseReservation: async () => { released += 1; return { settled: true } },
      readUsage: async () => 300,
      readTopUpBalance: async () => topupReserved ? 1 : 0,
      execute: async () => { executed += 1; return Response.json({ ok: true }) },
    })
    return { response, executed, released }
  }

  assert.equal((await admission({ monthlyReserved: true })).executed, 1)
  assert.equal((await admission({ monthlyReserved: false, topupReserved: true })).executed, 1)
  assert.equal((await admission({ monthlyReserved: false })).executed, 0)
  assert.equal((await admission({ monthlyReserved: true, guardReserved: false })).released, 1)
  assert.equal((await admission({ monthlyReserved: false, topupReserved: true, guardReserved: false })).released, 1)

  const concurrentConfig = readAssistantCostGuardConfig({ ...baseConfig, AI_GLOBAL_INCLUDED_BUDGET_UNITS: "1", AI_GLOBAL_EMERGENCY_CAP_UNITS: "1" })
  const concurrent = await Promise.all([
    reserveAssistantCostGuard(env, { operationId: "99999999-9999-4999-8999-999999999991", period: "2026-12", fundingClass: "included", config: concurrentConfig }),
    reserveAssistantCostGuard(env, { operationId: "99999999-9999-4999-8999-999999999992", period: "2026-12", fundingClass: "included", config: concurrentConfig }),
  ])
  assert.equal(concurrent.filter((entry) => entry.reserved).length, 1)

  const indexSource = fs.readFileSync(path.join(root, "src/index.js"), "utf8")
  const wranglerSource = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8")
  assert.equal(indexSource.includes('/api/core/decide'), true)
  assert.equal(indexSource.includes("reserveAssistantCostGuard"), true)
  assert.equal(indexSource.includes("ownerCanaryEnabled"), true)
  assert.equal(/AI_GLOBAL_(INCLUDED|PREPAID|EMERGENCY|REQUEST)/.test(wranglerSource), false)

  console.log("Assistant global cost-guard audit passed: funding separation, emergency cap, idempotent settlement, missing-config fail-closed")
} finally {
  db.close()
  fs.rmSync(tmp, { recursive: true, force: true })
}
