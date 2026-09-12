import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startAssistantOperation, finishAssistantOperation } from "../../src/assistant-quota.js"

const migration = readFileSync(new URL("../../migrations/0009_assistant_ai_usage.sql", import.meta.url), "utf8")
const productionSource = readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const uuid = () => crypto.randomUUID()
const period = "2026-08"

function envFor() {
  const dir = mkdtempSync(join(tmpdir(), "hegeva-assistant-quota-"))
  const db = new DatabaseSync(join(dir, "assistant.sqlite"))
  const DB = {
    prepare(sql) {
      return { bind(...values) {
        const statement = db.prepare(sql)
        return {
          async run() { const result = statement.run(...values); return { meta: { changes: Number(result.changes) } } },
          async first() { return statement.get(...values) || null },
        }
      } }
    },
    _db: db,
  }
  db.exec(`CREATE TABLE ai_usage (userId TEXT NOT NULL, period TEXT NOT NULL, aiMessages INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, PRIMARY KEY(userId, period));`)
  db.exec(migration)
  db.exec(migration)
  return { DB, close() { db.close(); rmSync(dir, { recursive: true, force: true }) } }
}

async function main() {
  assert.match(productionSource, /startAssistantOperation\(env, \{ operationId: assistantOperationId, userId, period: usagePeriod, planLimit: limit \}\)/)
  assert.doesNotMatch(productionSource, /body\.planLimit|body\.aiLimit|body\.userId/)
  const env = envFor()
  const firstId = uuid()
  const first = await startAssistantOperation(env, { operationId: firstId, userId: "u1", period, planLimit: 50 })
  assert.equal(first.reserved, true)
  assert.equal(env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId='u1' AND period='2026-08'").get().aiMessages, 1)
  assert.equal(env.DB._db.prepare("SELECT COUNT(*) AS count FROM ai_usage WHERE userId='u1' AND period='2026-08'").get().count, 0)
  const duplicate = await startAssistantOperation(env, { operationId: firstId, userId: "u1", period, planLimit: 50 })
  assert.equal(duplicate.duplicate, true)
  assert.equal(env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId='u1' AND period='2026-08'").get().aiMessages, 1)
  await assert.rejects(() => startAssistantOperation(env, { operationId: firstId, userId: "u2", period, planLimit: 50 }), /ownership mismatch/)
  const expiryBase = new Date()
  const expiredAt = new Date(expiryBase.getTime() + 31 * 60_000)
  const expiredPending = await startAssistantOperation(env, { operationId: uuid(), userId: "u-expired", period, planLimit: 50, now: expiryBase })
  const expiredPendingRetry = await startAssistantOperation(env, { operationId: expiredPending.operationId, userId: "u-expired", period, planLimit: 50, now: expiredAt })
  assert.equal(expiredPendingRetry.reason, "expired_assistant_operation")
  await finishAssistantOperation(env, { operationId: expiredPending.operationId, status: "succeeded", now: new Date() })
  const expiredSucceeded = await startAssistantOperation(env, { operationId: expiredPending.operationId, userId: "u-expired", period, planLimit: 50, now: expiredAt })
  assert.equal(expiredSucceeded.reason, "expired_assistant_operation")
  const expiredFailed = await startAssistantOperation(env, { operationId: uuid(), userId: "u-failed", period, planLimit: 50, now: expiryBase })
  await finishAssistantOperation(env, { operationId: expiredFailed.operationId, status: "failed", now: new Date() })
  const expiredFailedRetry = await startAssistantOperation(env, { operationId: expiredFailed.operationId, userId: "u-failed", period, planLimit: 50, now: expiredAt })
  assert.equal(expiredFailedRetry.reason, "expired_assistant_operation")
  await assert.rejects(() => startAssistantOperation(env, { operationId: expiredPending.operationId, userId: "other-user", period, planLimit: 50, now: expiredAt }), /ownership mismatch/)
  const invalid = await startAssistantOperation(env, { operationId: "not-a-uuid", userId: "u1", period, planLimit: 50 })
  assert.equal(invalid.reason, "invalid_assistant_operation")
  assert.equal((await startAssistantOperation(env, { operationId: uuid(), userId: "u1", period, planLimit: 0 })).reason, "invalid_assistant_plan_limit")
  assert.equal((await startAssistantOperation(env, { operationId: uuid(), userId: "u1", period, planLimit: 1_000_001 })).reason, "invalid_assistant_plan_limit")

  for (let i = 0; i < 48; i++) {
    const result = await startAssistantOperation(env, { operationId: uuid(), userId: "u1", period, planLimit: 50 })
    assert.equal(result.reserved, true)
  }
  const finalAllowed = await startAssistantOperation(env, { operationId: uuid(), userId: "u1", period, planLimit: 50 })
  assert.equal(finalAllowed.reserved, true)
  const limit = await startAssistantOperation(env, { operationId: uuid(), userId: "u1", period, planLimit: 50 })
  assert.equal(limit.reserved, false)
  assert.equal(limit.reason, "assistant_quota_unavailable")
  assert.equal(env.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId='u1' AND period='2026-08'").get().aiMessages, 50)

  for (const planLimit of [50, 300, 1000]) {
    const planEnv = envFor()
    planEnv.DB._db.prepare("INSERT INTO assistant_ai_usage(userId,period,aiMessages,createdAt,updatedAt) VALUES (?,?,?,?,?)").run("plan-user", period, planLimit - 1, new Date().toISOString(), new Date().toISOString())
    assert.equal((await startAssistantOperation(planEnv, { operationId: uuid(), userId: "plan-user", period, planLimit })).reserved, true)
    assert.equal((await startAssistantOperation(planEnv, { operationId: uuid(), userId: "plan-user", period, planLimit })).reason, "assistant_quota_unavailable")
    planEnv.close()
  }

  const parallel = envFor()
  const same = uuid()
  const results = await Promise.all(Array.from({ length: 100 }, () => startAssistantOperation(parallel, { operationId: same, userId: "parallel", period, planLimit: 50 })))
  assert.equal(results.filter((r) => r.reserved).length, 1)
  assert.equal(new Set(results.map((r) => r.operationId)).size, 1)
  assert.equal(parallel.DB._db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId='parallel' AND period='2026-08'").get().aiMessages, 1)

  await finishAssistantOperation(env, { operationId: firstId, status: "failed" })
  const status = env.DB._db.prepare("SELECT status FROM assistant_operations WHERE operationId=?").get(firstId).status
  assert.equal(status, "failed")
  env.close(); parallel.close()
  console.log("Assistant quota executable audit: PASS")
  console.log("cases: atomic reservation, duplicate operation, concurrent duplicate starts, exact limit, cross-user rejection, UUID validation, failure accounting, X20 counter independence")
}

await main()
