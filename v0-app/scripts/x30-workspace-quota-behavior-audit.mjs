import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const root = new URL("../", import.meta.url)
const migration0011 = readFileSync(new URL("../migrations/0011_x30_generation_accounting.sql", root), "utf8")
const migration0012 = readFileSync(new URL("../migrations/0012_x30_workspace_usage.sql", root), "utf8")
const tempDir = mkdtempSync(join(tmpdir(), "hegeva-x30-workspace-quota-"))
const dbPath = join(tempDir, "isolated.sqlite")
const db = new DatabaseSync(dbPath)
const now = "2026-08-30T12:00:00.000Z"
let sequence = 0

function uuid() {
  sequence += 1
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`
}

function applyMigrations(database) {
  database.exec(migration0011)
  database.exec(migration0012)
}

function insert(database, {
  operationId = uuid(), userId = "user-a", workspaceScope = userId, period = "2026-08",
  createdAt = now, planLimit = 20, dailyLimit = 3, workspaceLimit = 50,
} = {}) {
  return database.prepare(`
    INSERT INTO x30_generation_operations
      (operationId, userId, workspaceScope, period, planLimit, dailyLimit, workspaceLimit,
       reserved, status, operationExpiresAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'reserved', ?, ?, ?)
  `).run(operationId, userId, workspaceScope, period, planLimit, dailyLimit, workspaceLimit, "2026-09-30T12:00:00.000Z", createdAt, createdAt)
}

function one(database, sql, ...values) {
  return database.prepare(sql).get(...values) || null
}

function assertNoPartialReservation(database, operationId, userId, workspaceScope, period, day, expected = {}) {
  assert.equal(one(database, "SELECT 1 AS present FROM x30_generation_operations WHERE operationId = ?", operationId), null)
  assert.equal(Number(one(database, "SELECT x30Generations FROM x30_ai_daily_usage WHERE userId = ? AND workspaceScope = ? AND day = ?", userId, workspaceScope, day)?.x30Generations || 0), expected.daily || 0)
  assert.equal(Number(one(database, "SELECT x30Generations FROM x30_ai_usage WHERE userId = ? AND workspaceScope = ? AND period = ?", userId, workspaceScope, period)?.x30Generations || 0), expected.monthly || 0)
  assert.equal(Number(one(database, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", workspaceScope, period)?.x30Generations || 0), expected.workspace || 0)
}

try {
  applyMigrations(db)
  assert.ok(one(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'x30_workspace_usage'"))
  assert.ok(one(db, "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'x30_reserve_generation'"))

  const unique = uuid()
  insert(db, { operationId: unique, userId: "unique-user" })
  assert.equal(one(db, "SELECT reserved FROM x30_generation_operations WHERE operationId = ?", unique).reserved, 1)
  assert.equal(one(db, "SELECT x30Generations FROM x30_ai_usage WHERE userId = 'unique-user' AND period = '2026-08'").x30Generations, 1)

  const beforeDuplicate = one(db, "SELECT x30Generations FROM x30_ai_usage WHERE userId = 'unique-user' AND period = '2026-08'").x30Generations
  assert.throws(() => insert(db, { operationId: unique, userId: "unique-user" }))
  assert.equal(one(db, "SELECT x30Generations FROM x30_ai_usage WHERE userId = 'unique-user' AND period = '2026-08'").x30Generations, beforeDuplicate)

  const dailyUser = "daily-user"
  for (let i = 0; i < 3; i += 1) insert(db, { userId: dailyUser, operationId: uuid(), planLimit: 100, dailyLimit: 3 })
  const dailyFourth = uuid()
  assert.throws(() => insert(db, { userId: dailyUser, operationId: dailyFourth, planLimit: 100, dailyLimit: 3 }))
  assertNoPartialReservation(db, dailyFourth, dailyUser, dailyUser, "2026-08", "2026-08-30", { daily: 3, monthly: 3, workspace: 3 })
  assert.equal(one(db, "SELECT x30Generations FROM x30_ai_daily_usage WHERE userId = ? AND workspaceScope = ? AND day = ?", dailyUser, dailyUser, "2026-08-30").x30Generations, 3)

  const monthlyUser = "monthly-user"
  for (let i = 0; i < 20; i += 1) insert(db, { userId: monthlyUser, operationId: uuid(), planLimit: 20, dailyLimit: 100 })
  const monthly21 = uuid()
  assert.throws(() => insert(db, { userId: monthlyUser, operationId: monthly21, planLimit: 20, dailyLimit: 100 }))
  assertNoPartialReservation(db, monthly21, monthlyUser, monthlyUser, "2026-08", "2026-08-30", { daily: 20, monthly: 20, workspace: 20 })
  assert.equal(one(db, "SELECT x30Generations FROM x30_ai_usage WHERE userId = ? AND workspaceScope = ? AND period = ?", monthlyUser, monthlyUser, "2026-08").x30Generations, 20)

  const workspace = "controlled-shared-workspace"
  for (let i = 0; i < 50; i += 1) insert(db, { userId: `workspace-user-${i}`, workspaceScope: workspace, operationId: uuid(), planLimit: 100, dailyLimit: 100, workspaceLimit: 50 })
  const workspace51 = uuid()
  assert.throws(() => insert(db, { userId: "workspace-user-51", workspaceScope: workspace, operationId: workspace51, planLimit: 100, dailyLimit: 100, workspaceLimit: 50 }))
  assert.equal(one(db, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", workspace, "2026-08").x30Generations, 50)
  assertNoPartialReservation(db, workspace51, "workspace-user-51", workspace, "2026-08", "2026-08-30", { workspace: 50 })

  const sharedPeriod = "2026-11"
  insert(db, { userId: "shared-a", workspaceScope: "shared-test", period: sharedPeriod, operationId: uuid(), planLimit: 100, dailyLimit: 100 })
  insert(db, { userId: "shared-b", workspaceScope: "shared-test", period: sharedPeriod, operationId: uuid(), planLimit: 100, dailyLimit: 100 })
  assert.equal(one(db, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", "shared-test", sharedPeriod).x30Generations, 2)
  assert.equal(one(db, "SELECT x30Generations FROM x30_ai_usage WHERE userId = ? AND workspaceScope = ? AND period = ?", "shared-a", "shared-test", sharedPeriod).x30Generations, 1)
  assert.equal(one(db, "SELECT x30Generations FROM x30_ai_usage WHERE userId = ? AND workspaceScope = ? AND period = ?", "shared-b", "shared-test", sharedPeriod).x30Generations, 1)

  const isolatedPeriod = "2026-12"
  insert(db, { userId: "isolated", workspaceScope: "scope-a", period: isolatedPeriod, operationId: uuid(), planLimit: 100, dailyLimit: 100 })
  insert(db, { userId: "isolated", workspaceScope: "scope-b", period: isolatedPeriod, operationId: uuid(), planLimit: 100, dailyLimit: 100 })
  assert.equal(one(db, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", "scope-a", isolatedPeriod).x30Generations, 1)
  assert.equal(one(db, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", "scope-b", isolatedPeriod).x30Generations, 1)

  const interleaved = "interleaved"
  for (let i = 0; i < 50; i += 1) insert(db, { userId: `interleaved-${i}`, workspaceScope: interleaved, period: "2027-01", operationId: uuid(), planLimit: 100, dailyLimit: 100 })
  assert.throws(() => insert(db, { userId: "interleaved-over", workspaceScope: interleaved, period: "2027-01", operationId: uuid(), planLimit: 100, dailyLimit: 100 }))
  assert.equal(one(db, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", interleaved, "2027-01").x30Generations, 50)

  const rollbackScope = "rollback-scope"
  db.prepare("INSERT INTO x30_workspace_usage VALUES (?, ?, 50, ?, ?)").run(rollbackScope, "2027-02", now, now)
  const rollbackOp = uuid()
  assert.throws(() => insert(db, { userId: "rollback-user", workspaceScope: rollbackScope, period: "2027-02", operationId: rollbackOp, planLimit: 100, dailyLimit: 100 }))
  assertNoPartialReservation(db, rollbackOp, "rollback-user", rollbackScope, "2027-02", "2026-08-30", { workspace: 50 })
  assert.equal(one(db, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", rollbackScope, "2027-02").x30Generations, 50)

  assert.equal(one(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('ai_usage', 'assistant_ai_usage', 'x20_ai_usage')"), null)

  const backfillDir = mkdtempSync(join(tmpdir(), "hegeva-x30-backfill-"))
  const backfillDb = new DatabaseSync(join(backfillDir, "backfill.sqlite"))
  backfillDb.exec(migration0011)
  const insertLegacy = backfillDb.prepare(`INSERT INTO x30_generation_operations
    (operationId, userId, workspaceScope, period, planLimit, dailyLimit, reserved, status, operationExpiresAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 20, 3, ?, ?, ?, ?, ?)`)
  for (let i = 0; i < 55; i += 1) insertLegacy.run(uuid(), `legacy-${i}`, "backfill-scope", "2027-03", 1, "succeeded", "2027-04-01T00:00:00.000Z", now, now)
  insertLegacy.run(uuid(), "unreserved", "backfill-scope", "2027-03", 0, "draft", "2027-04-01T00:00:00.000Z", now, now)
  backfillDb.exec(migration0012)
  assert.equal(one(backfillDb, "SELECT x30Generations FROM x30_workspace_usage WHERE workspaceScope = ? AND period = ?", "backfill-scope", "2027-03").x30Generations, 50)
  backfillDb.close(); rmSync(backfillDir, { recursive: true, force: true })

  console.log("X30 workspace quota behavior audit passed: isolated migrations, atomic 3/20/50 limits, rollback, shared-scope simulation, duplicate protection and reserved-only capped backfill")
} finally {
  db.close()
  rmSync(tempDir, { recursive: true, force: true })
}
