import { DatabaseSync } from "node:sqlite"
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, "..")
const repo = resolve(appRoot, "..")
const temp = mkdtempSync(join(tmpdir(), "hegeva-ai-bot-migration-"))
const db = new DatabaseSync(join(temp, "audit.sqlite"))
db.exec("PRAGMA foreign_keys=ON")
const migrations = readdirSync(join(repo, "migrations"))
  .filter((name) => /^\d+_.*\.sql$/.test(name)).sort()
db.exec("CREATE TABLE _audit_migrations(name TEXT PRIMARY KEY)")
for (const name of migrations) {
  db.exec(readFileSync(join(repo, "migrations", name), "utf8"))
  db.prepare("INSERT INTO _audit_migrations VALUES (?)").run(name)
}
const secondPass = migrations.filter((name) => !db.prepare("SELECT 1 FROM _audit_migrations WHERE name=?").get(name))
const assert = (value, message) => { if (!value) throw new Error(message) }
assert(migrations.at(-1) === "0014_ai_canary_financial_guard.sql" && migrations.at(-2) === "0013_ai_bot_execution.sql", "0014 ordering missing")
assert(secondPass.length === 0, "second migration pass has pending work")
const now = "2026-09-01T12:00:00.000Z"; const expiry = "2026-09-30T12:00:00.000Z"
db.prepare("INSERT INTO ai_canary_authorizations(authorizationHash,actorHash,workspaceHash,operationType,createdAt,expiresAt,status) VALUES(?,?,?,?,?,?,?)").run("a".repeat(64), "b".repeat(32), "b".repeat(32), "ai-bot", now, expiry, "active")
const insert = db.prepare("INSERT INTO ai_bot_operations(operationId,userId,workspaceScope,profileId,period,status,attemptNumber,approvedAt,approvalExpiresAt,approvalVersion,approvedByActorHash,usageLimit,createdAt,updatedAt,authorizationHash) VALUES(?1,?2,?2,?3,?4,'reserved',0,?5,?6,1,?7,?8,?5,?5,?9)")
const op = "4f7f9c3d-8b31-4a62-9e10-123456789abc"
db.prepare("UPDATE ai_canary_authorizations SET consumedCount=1,status='consumed',consumedAt=? WHERE authorizationHash=?").run(now, "a".repeat(64))
insert.run(op, "u1", "bot-1", "2026-09", now, expiry, "actorhash-1234567890", 1, "a".repeat(64))
assert(db.prepare("SELECT executions FROM ai_bot_usage WHERE userId='u1'").get().executions === 1, "reservation missing")
try { insert.run(op, "u1", "bot-1", "2026-09", now, expiry, "actorhash-1234567890", 1, "a".repeat(64)); throw new Error("duplicate admitted") } catch (error) { assert(String(error).includes("UNIQUE"), "duplicate was not rejected") }
assert(db.prepare("SELECT executions FROM ai_bot_usage WHERE userId='u1'").get().executions === 1, "duplicate charged")
try { insert.run("5f7f9c3d-8b31-4a62-9e10-123456789abc", "u1", "bot-1", "2026-09", now, expiry, "actorhash-1234567890", 1, "a".repeat(64)); throw new Error("quota admitted") } catch {}
assert(!db.prepare("SELECT 1 FROM ai_bot_operations WHERE operationId LIKE '5f7%'").get(), "quota rejection left operation")
db.prepare("UPDATE ai_bot_operations SET status='failed',attemptNumber=1,updatedAt=? WHERE operationId=?").run(now, op)
const history = db.prepare("INSERT INTO ai_bot_execution_history(id,operationId,userId,workspaceScope,profileId,status,failureCode,attemptNumber,createdAt,retentionUntil) VALUES(?,?,?,?,?,?,?,?,?,?)")
history.run("h1", op, "u1", "u1", "bot-1", "failed", "timeout", 1, now, expiry)
for (const sql of ["UPDATE ai_bot_execution_history SET failureCode='x' WHERE id='h1'", "DELETE FROM ai_bot_execution_history WHERE id='h1'"]) { try { db.exec(sql); throw new Error("history mutation admitted") } catch (error) { assert(String(error).includes("append-only"), "history mutation was not blocked") } }
try { history.run("h2", "4f7f9c3d-8b31-4a62-9e10-123456789abd", "u1", "u1", "bot-1", "failed", "timeout", 1, now, expiry); throw new Error("orphan admitted") } catch (error) { assert(/FOREIGN KEY|terminal AI Bot history/.test(String(error)), "orphan history was not blocked") }
assert(db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_ai_bot_history_retention'").get(), "retention index missing")
for (const token of ["ai_canary_authorizations", "financial_guard_reservations", "financial_guard_events", "ai_canary_authorization_consume_guard", "financial_guard_events_no_update"]) assert(readFileSync(join(repo, "migrations", "0014_ai_canary_financial_guard.sql"), "utf8").includes(token), `0014 contract missing: ${token}`)
db.close(); rmSync(temp, { recursive: true, force: true })
console.log("AI Bot migration audit passed: sequential apply, idempotent rerun, atomic quota trigger, duplicate/foreign-key rejection, append-only history, bounds and retention index")
