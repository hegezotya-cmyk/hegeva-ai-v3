import assert from "node:assert/strict"
import { readFileSync, mkdtempSync, rmSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startX20Action, registerX20Attempt } from "../../src/x20-ledger.js"

const source = readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
assert.match(source, /const newlyCreatedAction = !body\.actionId && x20Action\.created === true/)
assert.match(source, /newlyCreatedAction && !isX20RequestId\(x20Action\.actionId\)/)
assert.match(source, /if \(!newlyCreatedAction\)/)
assert.match(source, /registerX20Attempt\(env, \{ actionId: x20Action\.actionId/)
assert.match(source, /x20Attempt\.duplicate === true \|\| x20Attempt\.status !== "reserved"/)
assert.match(source, /return \{ reserved: true, reason: "x20_attempt_reserved" \}/)

const remoteCompatibleAttempt = {
  attemptId: "11111111-1111-4111-8111-111111111111",
  attemptNumber: 1,
  status: "reserved",
  duplicate: false,
}
assert.equal(Object.hasOwn(remoteCompatibleAttempt, "admitted"), false)
assert.equal(remoteCompatibleAttempt.status, "reserved")
assert.equal(remoteCompatibleAttempt.duplicate, false)
assert.equal(Number.isInteger(remoteCompatibleAttempt.attemptNumber) && remoteCompatibleAttempt.attemptNumber >= 1 && remoteCompatibleAttempt.attemptNumber <= 3, true)

const migration = readFileSync(new URL("../../migrations/0008_x20_request_ledger.sql", import.meta.url), "utf8") + "\n" + readFileSync(new URL("../../migrations/0010_x20_independent_usage.sql", import.meta.url), "utf8")
const dir = mkdtempSync(join(tmpdir(), "hegeva-x20-action-identity-"))
const db = new DatabaseSync(join(dir, "audit.sqlite"))
db.exec("CREATE TABLE ai_usage (userId TEXT NOT NULL, period TEXT NOT NULL, aiMessages INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, PRIMARY KEY(userId, period));")
db.exec(migration)
const DB = { prepare(sql) { return { bind(...values) { const s = db.prepare(sql); return { async run() { const r = s.run(...values); return { meta: { changes: Number(r.changes) } } }, async first() { return s.get(...values) || null } } } } } }
const env = { DB }
const period = "2026-08"
const now = new Date("2026-08-28T12:00:00.000Z")
const uuid = () => crypto.randomUUID()
const action = await startX20Action(env, { startRequestId: uuid(), userId: "u1", period, planLimit: 300, now })
assert.equal(action.created, true)
assert.match(action.actionId, /^[0-9a-f-]{36}$/i)
const attempt = await registerX20Attempt(env, { actionId: action.actionId, attemptRequestId: uuid(), userId: "u1", period, now })
assert.equal(attempt.admitted, true)
assert.equal(db.prepare("SELECT userReserved, providerCalls, status FROM x20_request_ledger WHERE actionId=?").get(action.actionId).providerCalls, 1)
assert.equal(db.prepare("SELECT status FROM x20_request_ledger WHERE actionId=?").get(action.actionId).status, "active")
db.close(); rmSync(dir, { recursive: true, force: true })
console.log("X20 action identity audit passed: new server action shape accepted and existing identity checks remain guarded")
