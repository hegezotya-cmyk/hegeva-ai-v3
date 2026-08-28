import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { registerX20Attempt, startX20Action, finishX20Attempt } from "../../src/x20-ledger.js"

const migration = readFileSync(new URL("../../migrations/0008_x20_request_ledger.sql", import.meta.url), "utf8")
const usageSchema = `CREATE TABLE ai_usage (userId TEXT NOT NULL, period TEXT NOT NULL, aiMessages INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, PRIMARY KEY(userId, period));`
const period = "2026-08"
const now = new Date("2026-08-28T12:00:00.000Z")
const uuid = () => crypto.randomUUID()

function dbEnv() {
  const directory = mkdtempSync(join(tmpdir(), "hegeva-x20-") )
  const db = new DatabaseSync(join(directory, "ledger.sqlite"))
  db.exec(usageSchema)
  db.exec(migration)
  const DB = {
    prepare(sql) {
      return { bind(...values) {
        const stmt = db.prepare(sql)
        return {
          async run() { const result = stmt.run(...values); return { meta: { changes: Number(result.changes) } } },
          async first() { return stmt.get(...values) || null },
        }
      } }
    },
    async batch(statements) { return Promise.all(statements.map((s) => s.run())) },
    _db: db,
  }
  return { DB, close() { db.close(); rmSync(directory, { recursive: true, force: true }) } }
}

async function run() {
  const env = dbEnv()
  const startRequestId = uuid()
  const action = await startX20Action(env, { startRequestId, userId: "u1", period, planLimit: 50, now })
  assert.equal(action.created, true)
  assert.match(action.actionId, /^[0-9a-f-]{36}$/i)
  assert.equal(env.DB._db.prepare("SELECT aiMessages FROM ai_usage WHERE userId='u1' AND period='2026-08'").get().aiMessages, 1)
  const duplicate = await startX20Action(env, { startRequestId, userId: "u1", period, planLimit: 50, now })
  assert.equal(duplicate.created, false)
  assert.equal(duplicate.actionId, action.actionId)
  assert.equal(env.DB._db.prepare("SELECT aiMessages FROM ai_usage WHERE userId='u1' AND period='2026-08'").get().aiMessages, 1)

  const attempts = []
  for (let i = 0; i < 3; i++) {
    const result = await registerX20Attempt(env, { actionId: action.actionId, attemptRequestId: uuid(), userId: "u1", period, now })
    assert.equal(result.admitted, true); attempts.push(result)
  }
  const duplicateAttempt = await registerX20Attempt(env, { actionId: action.actionId, attemptRequestId: (await env.DB.prepare("SELECT attemptRequestId FROM x20_provider_attempts LIMIT 1").bind().first()).attemptRequestId, userId: "u1", period, now })
  assert.equal(duplicateAttempt.duplicate, true)
  const fourth = await registerX20Attempt(env, { actionId: action.actionId, attemptRequestId: uuid(), userId: "u1", period, now })
  assert.equal(fourth.admitted, false)
  const count = env.DB._db.prepare("SELECT providerCalls FROM x20_request_ledger WHERE actionId=?").get(action.actionId).providerCalls
  assert.equal(count, 3)

  assert.equal((await registerX20Attempt(env, { actionId: action.actionId, attemptRequestId: uuid(), userId: "u2", period, now })).admitted, false)
  assert.equal((await registerX20Attempt(env, { actionId: action.actionId, attemptRequestId: uuid(), userId: "u1", period: "2026-09", now })).admitted, false)
  const expired = await startX20Action(env, { startRequestId: uuid(), userId: "u3", period, planLimit: 50, now })
  const expiredAt = new Date(now.getTime() + 31 * 60_000)
  assert.equal((await registerX20Attempt(env, { actionId: expired.actionId, attemptRequestId: uuid(), userId: "u3", period, now: expiredAt })).admitted, false)

  const fresh = dbEnv()
  const ids = await Promise.all(Array.from({ length: 100 }, () => startX20Action(fresh, { startRequestId: "11111111-1111-4111-8111-111111111111", userId: "parallel", period, planLimit: 50, now })))
  assert.equal(new Set(ids.map((x) => x.actionId)).size, 1)
  assert.equal(fresh.DB._db.prepare("SELECT aiMessages FROM ai_usage WHERE userId='parallel' AND period='2026-08'").get().aiMessages, 1)
  await finishX20Attempt(env, { attemptId: attempts[0].attemptId, actionId: action.actionId, status: "failed", now })
  env.close(); fresh.close()
  console.log("X20 accounting executable audit: PASS")
  console.log("cases: start, duplicate start, three-attempt cap, duplicate attempt, foreign user, wrong period, expiry, concurrent duplicate starts, failure accounting")
}

await run()
