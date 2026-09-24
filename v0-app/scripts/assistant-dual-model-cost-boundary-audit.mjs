import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"
import {
  ASSISTANT_MODEL_TIERS,
  resolveAssistantModelTier,
  boundAssistantProviderPayload,
} from "../../src/cloudflare-ai-provider.js"
import { readAssistantDailyAdmissionConfig, reserveAssistantDailyAdmission, settleAssistantDailyAdmission, releaseAssistantDailyAdmission } from "../../src/assistant-daily-admission.js"

const indexSource = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const uiSource = fs.readFileSync(new URL("../components/assistant/assistant-chat.tsx", import.meta.url), "utf8")

assert.equal(ASSISTANT_MODEL_TIERS.standard.model, "@cf/qwen/qwen3-30b-a3b-fp8")
assert.equal(ASSISTANT_MODEL_TIERS.advanced.model, "@cf/openai/gpt-oss-120b")

assert.equal(resolveAssistantModelTier({ tier: undefined, plan: "basic", env: {} }).ok, true)
assert.equal(resolveAssistantModelTier({ tier: "advanced", plan: "basic", env: { AI_ADVANCED_ASSISTANT_CREDIT_COST: "2" } }).reason, "advanced-plan-required")
assert.equal(resolveAssistantModelTier({ tier: "advanced", plan: "premium", env: {} }).reason, "advanced-credit-cost-unconfigured")
assert.equal(resolveAssistantModelTier({ tier: "advanced", plan: "pro", env: {} }).reason, "advanced-credit-cost-unconfigured")
assert.equal(resolveAssistantModelTier({ tier: "advanced", plan: "premium", env: { AI_ADVANCED_ASSISTANT_CREDIT_COST: "2" } }).ok, true)
assert.equal(resolveAssistantModelTier({ tier: "advanced", plan: "pro", env: { AI_ADVANCED_ASSISTANT_CREDIT_COST: "2" } }).ok, true)
assert.equal(resolveAssistantModelTier({ tier: "@cf/openai/gpt-oss-120b", plan: "pro", env: { AI_ADVANCED_ASSISTANT_CREDIT_COST: "2" } }).reason, "invalid-tier")

const standard = resolveAssistantModelTier({ tier: "standard", plan: "basic", env: {} })
const payload = boundAssistantProviderPayload(standard.tier, {
  operation: "assistant",
  locale: "en",
  prompt: "hello",
})
assert.equal(payload.ok, true)
assert.equal(payload.request.model, ASSISTANT_MODEL_TIERS.standard.model)
assert.equal(payload.request.max_tokens, ASSISTANT_MODEL_TIERS.standard.maxOutputTokens)
assert.equal(payload.reservation.neurons, ASSISTANT_MODEL_TIERS.standard.maxRequestNeurons)
assert.equal(payload.reservation.usd.toFixed(8), "0.00027648")
const advanced = resolveAssistantModelTier({ tier: "advanced", plan: "premium", env: { AI_ADVANCED_ASSISTANT_CREDIT_COST: "2" } })
assert.equal(advanced.tier.reservation.neurons, ASSISTANT_MODEL_TIERS.advanced.maxRequestNeurons)
assert.equal(advanced.tier.reservation.usd.toFixed(8), "0.00220160")

const oversized = boundAssistantProviderPayload(standard.tier, {
  operation: "assistant",
  locale: "en",
  prompt: "a".repeat(ASSISTANT_MODEL_TIERS.standard.maxInputTokens * 8),
})
assert.equal(oversized.reason, "provider-input-too-large")

function adapter(db) {
  return { DB: {
    prepare(sql) { return { bind(...values) { return {
      async first() { return db.prepare(sql).get(...values) },
      async run() { const result = db.prepare(sql).run(...values); return { meta: { changes: Number(result.changes) } } },
    } } } },
    async batch(statements) {
      db.exec("BEGIN IMMEDIATE")
      try { const result = []; for (const statement of statements) result.push(await statement.run()); db.exec("COMMIT"); return result }
      catch (error) { db.exec("ROLLBACK"); throw error }
    },
  } }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hegeva-dual-model-"))
const db = new DatabaseSync(path.join(tmp, "daily.sqlite"))
try {
  db.exec(fs.readFileSync(path.resolve(import.meta.dirname, "../../migrations/0029_assistant_daily_model_admission.sql"), "utf8"))
  const env = adapter(db)
  const config = readAssistantDailyAdmissionConfig({ AI_DAILY_REQUEST_CEILING: "1", AI_DAILY_NEURON_CEILING: "26" })
  const one = await reserveAssistantDailyAdmission(env, { operationId: "11111111-1111-4111-8111-111111111111", day: "2026-09-24", tier: "standard", reservationNeurons: 26, config })
  assert.equal(one.reserved, true)
  const blocked = await reserveAssistantDailyAdmission(env, { operationId: "22222222-2222-4222-8222-222222222222", day: "2026-09-24", tier: "standard", reservationNeurons: 26, config })
  assert.equal(blocked.reason, "daily_capacity_exhausted")
  assert.equal((await settleAssistantDailyAdmission(env, { operationId: one.operationId, actualNeurons: null })).settled, true)
  assert.equal((await settleAssistantDailyAdmission(env, { operationId: one.operationId, actualNeurons: null })).duplicate, true)
  const next = await reserveAssistantDailyAdmission(env, { operationId: "33333333-3333-4333-8333-333333333333", day: "2026-09-25", tier: "standard", reservationNeurons: 26, config })
  assert.equal(next.reserved, true)
  assert.equal((await releaseAssistantDailyAdmission(env, { operationId: next.operationId })).settled, true)

  const concurrentConfig = readAssistantDailyAdmissionConfig({ AI_DAILY_REQUEST_CEILING: "2", AI_DAILY_NEURON_CEILING: "201" })
  const concurrent = await Promise.all([
    reserveAssistantDailyAdmission(env, { operationId: "44444444-4444-4444-8444-444444444444", day: "2026-09-26", tier: "advanced", reservationNeurons: 201, config: concurrentConfig }),
    reserveAssistantDailyAdmission(env, { operationId: "55555555-5555-4555-8555-555555555555", day: "2026-09-26", tier: "standard", reservationNeurons: 26, config: concurrentConfig }),
  ])
  assert.equal(concurrent.filter((result) => result.reserved).length, 1, "neuron ceiling must atomically block concurrent tier reservations")
} finally { db.close(); fs.rmSync(tmp, { recursive: true, force: true }) }

assert.match(indexSource, /requestUnits: tier\.reservation\.neurons/, "global guard must reserve the selected tier's bounded neuron exposure")
assert.match(indexSource, /validateProviderInput:[\s\S]*?boundAssistantProviderPayload/, "payload bounds must be checked before customer funding")
assert.match(uiSource, /tier,/, "browser request may submit only the selected tier")
assert.doesNotMatch(uiSource, /@cf\//, "provider model identifiers must not be presented to normal users")
for (const locale of ["en", "hu", "de", "fr", "es"]) assert.match(uiSource, new RegExp(`${locale}:`), `missing ${locale} tier copy`)

console.log("ASSISTANT DUAL-MODEL COST BOUNDARY AUDIT: PASS")
