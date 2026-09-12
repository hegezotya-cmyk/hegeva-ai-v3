import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startX20Action } from "../../src/x20-ledger.js"
const indexSource = readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
assert.match(indexSource, /SELECT x20Actions FROM x20_ai_usage/)
assert.match(indexSource, /x20Limit: planInfo\.limit/)
assert.match(indexSource, /x20Remaining: Math\.max/)

const migration = readFileSync(new URL("../../migrations/0008_x20_request_ledger.sql", import.meta.url), "utf8") + "\n" + readFileSync(new URL("../../migrations/0010_x20_independent_usage.sql", import.meta.url), "utf8")
const period = "2026-08"
const now = new Date("2026-08-28T12:00:00.000Z")
const uuid = () => crypto.randomUUID()
function envFor() {
  const dir = mkdtempSync(join(tmpdir(), "hegeva-x20-independent-"))
  const db = new DatabaseSync(join(dir, "usage.sqlite"))
  db.exec("CREATE TABLE ai_usage (userId TEXT NOT NULL, period TEXT NOT NULL, aiMessages INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, PRIMARY KEY(userId, period));")
  db.exec(migration)
  const DB = { prepare(sql) { return { bind(...values) { const s = db.prepare(sql); return { async run() { const r = s.run(...values); return { meta: { changes: Number(r.changes) } } }, async first() { return s.get(...values) || null } } } } } }
  return { DB, db, close() { db.close(); rmSync(dir, { recursive: true, force: true }) } }
}
const env = envFor()
env.db.prepare("INSERT INTO ai_usage VALUES (?,?,?,?,?)").run("u1", period, 300, now.toISOString(), now.toISOString())
const first = await startX20Action(env, { startRequestId: uuid(), userId: "u1", period, planLimit: 300, now })
assert.equal(first.created, true)
assert.equal(env.db.prepare("SELECT x20Actions FROM x20_ai_usage WHERE userId='u1' AND period=?").get(period).x20Actions, 1)
assert.equal(env.db.prepare("SELECT aiMessages FROM ai_usage WHERE userId='u1' AND period=?").get(period).aiMessages, 300)
const backfill = envFor()
backfill.db.exec("DROP TRIGGER x20_reserve_user_quota; DROP TABLE x20_provider_attempts; DROP TABLE x20_request_ledger;")
backfill.db.exec("CREATE TABLE x20_request_ledger (actionId TEXT PRIMARY KEY, startRequestId TEXT NOT NULL, userId TEXT NOT NULL, period TEXT NOT NULL, kind TEXT NOT NULL, planLimit INTEGER NOT NULL, userReserved INTEGER NOT NULL, providerCalls INTEGER NOT NULL, status TEXT NOT NULL, actionExpiresAt TEXT NOT NULL, purgeAfter TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);")
backfill.db.prepare("INSERT INTO x20_request_ledger VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(uuid(), uuid(), "legacy", period, "x20", 50, 1, 0, "succeeded", new Date(now.getTime() + 1).toISOString(), now.toISOString(), now.toISOString(), now.toISOString())
backfill.db.prepare("INSERT INTO ai_usage VALUES (?,?,?,?,?)").run("legacy", period, 300, now.toISOString(), now.toISOString())
backfill.db.exec(readFileSync(new URL("../../migrations/0010_x20_independent_usage.sql", import.meta.url), "utf8"))
assert.equal(backfill.db.prepare("SELECT x20Actions FROM x20_ai_usage WHERE userId='legacy' AND period=?").get(period).x20Actions, 1)
assert.equal(backfill.db.prepare("SELECT aiMessages FROM ai_usage WHERE userId='legacy' AND period=?").get(period).aiMessages, 300)
const concurrent = envFor()
const starts = await Promise.allSettled(Array.from({ length: 60 }, () => startX20Action(concurrent, { startRequestId: uuid(), userId: "concurrent", period, planLimit: 50, now })))
assert.equal(starts.filter((result) => result.status === "fulfilled").length, 50)
assert.equal(concurrent.db.prepare("SELECT x20Actions FROM x20_ai_usage WHERE userId='concurrent' AND period=?").get(period).x20Actions, 50)
concurrent.close()
env.close(); backfill.close()
console.log("X20 independent usage audit passed: dedicated counter, legacy isolation and retained-action backfill")
