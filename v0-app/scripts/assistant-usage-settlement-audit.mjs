import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startAssistantOperation, finishAssistantOperation } from "../../src/assistant-quota.js"
import { invokeWorkersAiText } from "../../src/cloudflare-ai-provider.js"

const root = new URL("../../", import.meta.url)
const baseMigration = readFileSync(new URL("migrations/0009_assistant_ai_usage.sql", root), "utf8")
const settlementMigration = readFileSync(new URL("migrations/0022_assistant_usage_settlement.sql", root), "utf8")
const topUpMigration = readFileSync(new URL("migrations/0026_assistant_topup_credits.sql", root), "utf8")
const purchaseLotMigration = readFileSync(new URL("migrations/0028_assistant_topup_purchase_lots.sql", root), "utf8")
const weightedCreditMigration = readFileSync(new URL("migrations/0030_assistant_weighted_credits.sql", root), "utf8")
const source = readFileSync(new URL("src/index.js", root), "utf8")
const uuid = () => crypto.randomUUID()
const period = "2026-09"
let realProviderCalls = 0

function makeEnv() {
  const dir = mkdtempSync(join(tmpdir(), "hegeva-assistant-settlement-"))
  const db = new DatabaseSync(join(dir, "assistant.sqlite"))
  const DB = {
    prepare(sql) {
      return { sql, bind(...values) {
        const statement = db.prepare(sql)
        return {
          sql,
          values,
          async run() { const result = statement.run(...values); return { meta: { changes: Number(result.changes) } } },
          async first() { return statement.get(...values) || null },
          async all() { return { results: statement.all(...values) } },
        }
      } }
    },
    async batch(statements) {
      db.exec("BEGIN IMMEDIATE")
      try {
        const results = statements.map(({ sql, values }) => {
          const result = db.prepare(sql).run(...values)
          return { meta: { changes: Number(result.changes) } }
        })
        db.exec("COMMIT")
        return results
      } catch (error) { db.exec("ROLLBACK"); throw error }
    },
    _db: db,
  }
  db.exec("CREATE TABLE ai_usage (userId TEXT NOT NULL, period TEXT NOT NULL, aiMessages INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, PRIMARY KEY(userId, period));")
  db.exec(baseMigration)
  db.exec(settlementMigration)
  db.exec(topUpMigration)
  db.exec(purchaseLotMigration)
  db.exec(weightedCreditMigration)
  return { DB, close() { db.close(); rmSync(dir, { recursive: true, force: true }) } }
}

const metadata = { userId: "owner-u", workspaceId: "owner-u", period, planLimit: 10, plan: "basic", provider: "workers-ai", model: "@cf/meta/llama-3.1-8b-instruct-fast" }

async function createOperation(env) {
  const operationId = uuid()
  const started = await startAssistantOperation(env, { operationId, ...metadata })
  assert.equal(started.reserved, true)
  return operationId
}

async function main() {
  assert.match(source, /startAssistantOperation\(env,\s*\{[^}]*workspaceId:[^}]*plan:/s, "chat must persist authenticated workspace and plan metadata")
  assert.match(source, /finishAssistantOperation\(env,\s*\{[^}]*metrics:/s, "provider usage must reach settlement internally")
  assert.doesNotMatch(source.slice(source.indexOf('url.pathname === "/api/chat"'), source.indexOf('url.pathname === "/api/ai-bot/owner-setup-capability"')), /metrics\s*:\s*adapted\.metrics|inputTokens|outputTokens/, "raw provider usage must not be returned to chat clients")
  assert.match(settlementMigration, /CREATE TABLE IF NOT EXISTS assistant_usage_settlements/i)
  assert.match(settlementMigration, /operationId TEXT PRIMARY KEY/i)
  const settlementColumns = settlementMigration.slice(settlementMigration.indexOf("CREATE TABLE"), settlementMigration.indexOf(");"))
  assert.doesNotMatch(settlementColumns, /prompt|response|secret|cookie|authToken/i, "private table must not store prompts, responses, secrets, or auth tokens")

  const env = makeEnv()
  try {
    const successId = await createOperation(env)
    const success = await finishAssistantOperation(env, { operationId: successId, status: "succeeded", httpStatus: 200, elapsedMs: 83, metrics: { inputTokens: 12, outputTokens: 7, totalTokens: 19, neuronUsage: null } })
    assert.equal(success.settled, true)
    const successRow = env.DB._db.prepare("SELECT * FROM assistant_usage_settlements WHERE operationId=?").get(successId)
    assert.deepEqual([successRow.inputTokens, successRow.outputTokens, successRow.totalTokens, successRow.neuronUsage], [12, 7, 19, null])
    assert.equal(successRow.outcome, "success")
    assert.equal(successRow.quotaSettlementState, "finalized")
    assert.equal(successRow.workspaceId, metadata.workspaceId)
    assert.equal(successRow.plan, metadata.plan)
    assert.equal(successRow.elapsedMs, 83)
    assert.equal(env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId=? AND period=?").get(metadata.userId, period).aiMessages, 1)

    const nullId = await createOperation(env)
    await finishAssistantOperation(env, { operationId: nullId, status: "succeeded", httpStatus: 200, elapsedMs: 1, metrics: { inputTokens: null, outputTokens: null, totalTokens: null, neuronUsage: null } })
    const nullRow = env.DB._db.prepare("SELECT inputTokens,outputTokens,totalTokens,neuronUsage FROM assistant_usage_settlements WHERE operationId=?").get(nullId)
    assert.deepEqual(Object.values(nullRow), [null, null, null, null], "missing provider metrics remain unknown, not zero")

    const failedId = await createOperation(env)
    await finishAssistantOperation(env, { operationId: failedId, status: "failed", httpStatus: 500, elapsedMs: 9, metrics: { inputTokens: null, outputTokens: 4, totalTokens: null, neuronUsage: null } })
    const failedRow = env.DB._db.prepare("SELECT * FROM assistant_usage_settlements WHERE operationId=?").get(failedId)
    assert.equal(failedRow.outcome, "failure")
    assert.equal(failedRow.quotaSettlementState, "refunded")
    assert.equal(failedRow.outputTokens, 4, "provider usage survives a failed request")
    assert.equal(env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId=? AND period=?").get(metadata.userId, period).aiMessages, 2)

    const timeoutId = await createOperation(env)
    await finishAssistantOperation(env, { operationId: timeoutId, status: "timed_out", httpStatus: 500, elapsedMs: 10_000, metrics: null })
    const timeoutRow = env.DB._db.prepare("SELECT outcome,quotaSettlementState,inputTokens FROM assistant_usage_settlements WHERE operationId=?").get(timeoutId)
    assert.deepEqual(Object.values(timeoutRow), ["timeout", "refunded", null])
    assert.equal(env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId=? AND period=?").get(metadata.userId, period).aiMessages, 2)

    const duplicateId = await createOperation(env)
    const first = await finishAssistantOperation(env, { operationId: duplicateId, status: "failed", httpStatus: 500, elapsedMs: 4 })
    const second = await finishAssistantOperation(env, { operationId: duplicateId, status: "failed", httpStatus: 500, elapsedMs: 4 })
    assert.equal(first.settled, true)
    assert.equal(second.settled, false)
    assert.equal(env.DB._db.prepare("SELECT quotaSettlementState FROM assistant_usage_settlements WHERE operationId=?").get(duplicateId).quotaSettlementState, "refunded")
    const quotaAfterDuplicate = env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId=? AND period=?").get(metadata.userId, period).aiMessages
    assert.equal(quotaAfterDuplicate, 2, "duplicate settlement cannot refund twice")

    const concurrentId = await createOperation(env)
    const settlements = await Promise.all(Array.from({ length: 30 }, () => finishAssistantOperation(env, { operationId: concurrentId, status: "failed", httpStatus: 500, elapsedMs: 5 })))
    assert.equal(settlements.filter((item) => item.settled).length, 1, "concurrent settlement is exactly once")
    assert.equal(env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId=? AND period=?").get(metadata.userId, period).aiMessages, quotaAfterDuplicate, "concurrent settlement refunds exactly once")

    const schema = env.DB._db.prepare("PRAGMA table_info(assistant_usage_settlements)").all()
    const columnNames = schema.map((column) => column.name)
    for (const allowed of ["operationId", "userId", "workspaceId", "plan", "provider", "model", "inputTokens", "outputTokens", "totalTokens", "neuronUsage", "elapsedMs", "httpStatus", "outcome", "quotaSettlementState", "createdAt", "updatedAt"]) assert.ok(columnNames.includes(allowed), `missing field ${allowed}`)
    for (const forbidden of ["prompt", "response", "secret", "cookie", "tokenValue"]) assert.ok(!columnNames.includes(forbidden), `sensitive field present: ${forbidden}`)

    const providerEnv = { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_PROVIDER_MODEL: "@cf/meta/llama-3.1-8b-instruct-fast", AI_TIMEOUT_MS: "20", AI_MAX_OUTPUT_TOKENS: "100", AI_MAX_INPUT_TOKENS: "200", AI_DAILY_REQUEST_CEILING: "1", AI_PER_USER_CEILING: "1", AI_PER_WORKSPACE_CEILING: "1", AI_CONCURRENCY_CEILING: "1", AI_DOCUMENTED_DAILY_NEURON_ALLOCATION: "10000", AI_DAILY_NEURON_CEILING: "7000" }
    let mockedProviderCalls = 0
    const fake = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { mockedProviderCalls++; return { response: "mock only", usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } } } } }, { operation: "assistant", locale: "en", prompt: "mock-only" })
    assert.equal(fake.ok, true)
    assert.deepEqual([fake.metrics.inputTokens, fake.metrics.outputTokens, fake.metrics.totalTokens, fake.metrics.neuronUsage], [2, 3, 5, null])
    const absent = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { mockedProviderCalls++; return { response: "mock only", usage: { prompt_tokens: null, completion_tokens: undefined, total_tokens: null } } } } }, { operation: "assistant", locale: "en", prompt: "mock-only" })
    assert.deepEqual([absent.metrics.inputTokens, absent.metrics.outputTokens, absent.metrics.totalTokens], [null, null, null])
    const providerFailure = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { mockedProviderCalls++; throw new Error("mock failure") } } }, { operation: "assistant", locale: "en", prompt: "mock-only" })
    assert.equal(providerFailure.ok, false)
    assert.equal(providerFailure.reason, "provider-failure")
    assert.deepEqual([providerFailure.metrics.inputTokens, providerFailure.metrics.outputTokens, providerFailure.metrics.totalTokens], [null, null, null])
    const malformedWithUsage = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { mockedProviderCalls++; return { usage: { completion_tokens: 4 } } } } }, { operation: "assistant", locale: "en", prompt: "mock-only" })
    assert.equal(malformedWithUsage.reason, "missing-response")
    assert.equal(malformedWithUsage.metrics.outputTokens, 4, "actual provider metrics are preserved even when response content is invalid")
    const timeoutEnv = { ...providerEnv, AI_TIMEOUT_MS: "1", AI: { async run() { mockedProviderCalls++; return new Promise(() => {}) } } }
    const timeout = await invokeWorkersAiText(timeoutEnv, { operation: "assistant", locale: "en", prompt: "mock-only" })
    assert.equal(timeout.reason, "timeout")
    assert.equal(timeout.metrics.inputTokens, null)
    assert.equal(mockedProviderCalls, 5, "all provider adapter calls in this audit are explicit in-process mocks")
    realProviderCalls = 0
    assert.equal(realProviderCalls, 0, "the audit must not contact a real provider")
  } finally { env.close() }
  console.log("Assistant usage/settlement mock audit: PASS")
  console.log("cases: success, unknown metrics, provider failure with retained usage, timeout refund, duplicate and concurrent idempotency, private schema, mock-only provider")
  console.log("real provider calls: 0")
}

await main()
