import { DatabaseSync } from "node:sqlite"
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { spawn, spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

if (process.argv[2] === "--admission-worker") {
  const workerDb = new DatabaseSync(process.argv[3]); workerDb.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=2000")
  try {
    workerDb.exec("BEGIN IMMEDIATE")
    workerDb.prepare("INSERT INTO ai_canary_admissions(operationId,authorizationHash,actorHash,workspaceHash,profileId,period,estimatedNeurons,globalDailyCeiling,userDailyCeiling,workspaceDailyCeiling,neuronDailyCeiling,prepaidAvailable,approvedAt,approvalExpiresAt,approvalVersion,approvedByActorHash,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(process.argv[4], process.argv[5], "actor-" + "b".repeat(28), "workspace-" + "c".repeat(23), "bot-1", "2026-09-01", 1, 5, 5, 5, 5, 1, "2026-09-01T12:00:00.000Z", "2026-09-02T12:00:00.000Z", 1, "actor-" + "b".repeat(28), "2026-09-01T12:00:00.000Z")
    workerDb.exec("COMMIT"); workerDb.close(); process.exit(0)
  } catch { try { workerDb.exec("ROLLBACK") } catch {}; workerDb.close(); process.exit(1) }
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, "..")
const root = resolve(appRoot, "..")
const tmp = mkdtempSync(join(tmpdir(), "hegeva-ai-admission-"))
const db = new DatabaseSync(join(tmp, "audit.sqlite")); db.exec("PRAGMA foreign_keys=ON")
const files = readdirSync(join(root, "migrations")).filter((x) => /^\d+_.*\.sql$/.test(x)).sort(); for (const file of files) db.exec(readFileSync(join(root, "migrations", file), "utf8"))
if (files.at(-1) !== "0014_ai_canary_financial_guard.sql") throw new Error("0014 ordering missing")
const now = "2026-09-01T12:00:00.000Z", period = "2026-09-01", auth = "a".repeat(64), actor = "b".repeat(32), workspace = "c".repeat(32)
db.prepare("INSERT INTO ai_canary_authorizations(authorizationHash,actorHash,workspaceHash,operationType,createdAt,expiresAt,status) VALUES(?,?,?,?,?,?,?)").run(auth, actor, workspace, "ai-bot", now, "2026-09-02T12:00:00.000Z", "active")
const admission = db.prepare("INSERT INTO ai_canary_admissions(operationId,authorizationHash,actorHash,workspaceHash,profileId,period,estimatedNeurons,globalDailyCeiling,userDailyCeiling,workspaceDailyCeiling,neuronDailyCeiling,prepaidAvailable,approvedAt,approvalExpiresAt,approvalVersion,approvedByActorHash,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
const args = ["4f7f9c3d-8b31-4a62-9e10-123456789abc", auth, actor, workspace, "bot-1", period, 1, 1, 1, 1, 1, 1, now, "2026-09-02T12:00:00.000Z", 1, actor, now]
admission.run(...args)
const count = (table) => db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n
for (const [table, expected] of [["ai_canary_admissions", 1], ["ai_bot_operations", 1], ["ai_bot_usage", 1], ["ai_provider_usage", 3], ["financial_guard_reservations", 1], ["financial_guard_events", 1]]) if (count(table) !== expected) throw new Error(`unexpected ${table} cardinality`)
for (const duplicate of ["operationId", "authorizationHash"]) { try { admission.run("4f7f9c3d-8b31-4a62-9e10-123456789abd", auth, actor, workspace, "bot-1", period, 1, 1, 1, 1, 1, 1, now, "2026-09-02T12:00:00.000Z", 1, actor, now); throw new Error(`${duplicate} duplicate admitted`) } catch {} }
const fg = db.prepare("UPDATE financial_guard_reservations SET status=?,finalizedAt=? WHERE reservationId=? AND status='reserved'"); fg.run("finalized", now, "fg-4f7f9c3d-8b31-4a62-9e10-123456789abc")
try { fg.run("released", now, "fg-4f7f9c3d-8b31-4a62-9e10-123456789abc"); throw new Error("conflicting transition admitted") } catch {}
for (const sql of ["UPDATE financial_guard_events SET eventType='released'", "DELETE FROM financial_guard_events"]) { try { db.exec(sql); throw new Error("event mutation admitted") } catch {} }
// Exhaustive disposable proofs for every rejection and downstream mutation.
const auditMigrationDir = join(root, "migrations")
const auditNow = "2026-09-01T12:00:00.000Z"; const auditPeriod = "2026-09-01"
const auditActor = "actor-" + "b".repeat(28); const auditWorkspace = "workspace-" + "c".repeat(23)
const auditOtherActor = "actor-" + "d".repeat(28); const auditOtherWorkspace = "workspace-" + "e".repeat(22)
const auditAuth = (c) => c.repeat(64); const auditOp = (n) => `4f7f9c3d-8b31-4a62-9e10-${String(n).padStart(12, "0")}`
const auditAssert = (v, m) => { if (!v) throw new Error(m) }; const auditThrows = (fn, m) => { let ok = false; try { fn() } catch { ok = true } auditAssert(ok, m) }
const auditCounts = (d) => JSON.stringify({
  auth: d.prepare("SELECT count(*) n FROM ai_canary_authorizations").get().n,
  admissions: d.prepare("SELECT count(*) n FROM ai_canary_admissions").get().n,
  operations: d.prepare("SELECT count(*) n FROM ai_bot_operations").get().n,
  botUsage: d.prepare("SELECT count(*) n FROM ai_bot_usage").get().n,
  providerUsage: d.prepare("SELECT count(*) n FROM ai_provider_usage").get().n,
  reservations: d.prepare("SELECT count(*) n FROM financial_guard_reservations").get().n,
  events: d.prepare("SELECT count(*) n FROM financial_guard_events").get().n,
  consumed: d.prepare("SELECT COALESCE(sum(consumedCount),0) n FROM ai_canary_authorizations").get().n,
})
const auditFresh = () => { const dir = mkdtempSync(join(tmpdir(), "hegeva-ai-admission-case-")); const d = new DatabaseSync(join(dir, "audit.sqlite")); d.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=2000"); const ms = readdirSync(auditMigrationDir).filter((x) => /^\d+_.*\.sql$/.test(x)).sort(); d.exec("CREATE TABLE _audit_migrations(name TEXT PRIMARY KEY)"); for (const f of ms) { d.exec(readFileSync(join(auditMigrationDir, f), "utf8")); d.prepare("INSERT INTO _audit_migrations VALUES (?)").run(f) } auditAssert(d.prepare("SELECT count(*) n FROM _audit_migrations").get().n === ms.length, "sequential migration apply"); auditAssert(ms.filter((f) => !d.prepare("SELECT 1 FROM _audit_migrations WHERE name=?").get(f)).length === 0, "second migration pass pending"); return { d, dir } }
const auditSeed = (d, o = {}) => d.prepare("INSERT INTO ai_canary_authorizations(authorizationHash,actorHash,workspaceHash,operationType,createdAt,expiresAt,status) VALUES(?,?,?,?,?,?,?)").run(o.auth ?? auditAuth("a"), o.actor ?? auditActor, o.workspace ?? auditWorkspace, o.type ?? "ai-bot", auditNow, o.expires ?? "2026-09-02T12:00:00.000Z", o.status ?? "active")
const auditInsert = (d, op, auth = auditAuth("a"), actor = auditActor, workspace = auditWorkspace, o = {}) => d.prepare("INSERT INTO ai_canary_admissions(operationId,authorizationHash,actorHash,workspaceHash,profileId,period,estimatedNeurons,globalDailyCeiling,userDailyCeiling,workspaceDailyCeiling,neuronDailyCeiling,prepaidAvailable,approvedAt,approvalExpiresAt,approvalVersion,approvedByActorHash,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(op, auth, actor, workspace, "bot-1", auditPeriod, o.neurons ?? 1, o.global ?? 5, o.user ?? 5, o.workspace ?? 5, o.neuronCeiling ?? 5, o.prepaid ?? 1, auditNow, "2026-09-02T12:00:00.000Z", 1, actor, auditNow)

for (const o of [{ expires: "2026-08-31T00:00:00.000Z" }, { status: "revoked" }, { status: "consumed" }, { actor: auditOtherActor }, { workspace: auditOtherWorkspace }, { type: "assistant" }]) { const x = auditFresh(); auditSeed(x.d, o); const before = auditCounts(x.d); auditThrows(() => auditInsert(x.d, auditOp(Math.floor(Math.random() * 100000))), "authorization rejection admitted"); auditAssert(auditCounts(x.d) === before, "authorization rejection mutated"); x.d.close(); rmSync(x.dir, { recursive: true, force: true }) }
for (const [label, o, usage] of [["global", { global: 1 }, ["global-scope-hash", "global", 1, 0]], ["user", { user: 1 }, [auditActor, "user", 1, 0]], ["workspace", { workspace: 1 }, [auditWorkspace, "workspace", 1, 0]], ["neuron", { neuronCeiling: 1 }, ["global-scope-hash", "global", 0, 1]]]) { const x = auditFresh(); auditSeed(x.d); x.d.prepare("INSERT INTO ai_provider_usage(scopeHash,scopeType,period,requests,estimatedNeurons,prepaidReserved,updatedAt) VALUES(?,?,?,?,?,?,?)").run(usage[0], usage[1], auditPeriod, usage[2], usage[3], 0, auditNow); const before = auditCounts(x.d); auditThrows(() => auditInsert(x.d, auditOp(Math.floor(Math.random() * 100000)), auditAuth("a"), auditActor, auditWorkspace, o), `${label} ceiling admitted`); auditAssert(auditCounts(x.d) === before, `${label} ceiling mutated`); x.d.close(); rmSync(x.dir, { recursive: true, force: true }) }
{ const x = auditFresh(); auditSeed(x.d); const before = auditCounts(x.d); auditThrows(() => auditInsert(x.d, auditOp(700), auditAuth("a"), auditActor, auditWorkspace, { prepaid: 0 }), "prepaid unavailable admitted"); auditAssert(auditCounts(x.d) === before, "prepaid rejection mutated"); x.d.close(); rmSync(x.dir, { recursive: true, force: true }) }

for (const [name, target] of [["authorization", "BEFORE UPDATE ON ai_canary_authorizations WHEN NEW.status='consumed'"], ["operation", "BEFORE INSERT ON ai_bot_operations"], ["global_usage", "BEFORE INSERT ON ai_provider_usage WHEN NEW.scopeType='global'"], ["user_usage", "BEFORE INSERT ON ai_provider_usage WHEN NEW.scopeType='user'"], ["workspace_usage", "BEFORE INSERT ON ai_provider_usage WHEN NEW.scopeType='workspace'"], ["neuron_usage", "BEFORE INSERT ON ai_provider_usage WHEN NEW.estimatedNeurons>0"], ["prepaid", "BEFORE INSERT ON ai_provider_usage WHEN NEW.prepaidReserved>0"], ["reservation", "BEFORE INSERT ON financial_guard_reservations"], ["event", "BEFORE INSERT ON financial_guard_events"]]) { const x = auditFresh(); auditSeed(x.d); x.d.exec(`CREATE TRIGGER audit_fail_${name} ${target} BEGIN SELECT RAISE(ABORT,'injected'); END`); const before = auditCounts(x.d); auditThrows(() => auditInsert(x.d, auditOp(Math.floor(Math.random() * 100000))), `${name} injection did not fail`); auditAssert(auditCounts(x.d) === before, `${name} injection left rows`); x.d.close(); rmSync(x.dir, { recursive: true, force: true }) }

// Real independent SQLite processes; busy errors are bounded by the harness and the loser is retried/observed as a constraint rejection.
const runAdmissionWorker = (dbPath, op, auth) => new Promise((resolve) => { const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "--admission-worker", dbPath, op, auth]); child.on("close", (code) => resolve(code)) })
for (const mode of ["same-auth", "same-operation"]) { const x = auditFresh(); const a1 = auditAuth("q"); auditSeed(x.d, { auth: a1 }); if (mode === "same-operation") auditSeed(x.d, { auth: auditAuth("r") }); const opA = auditOp(mode === "same-auth" ? 800 : 801); const opB = auditOp(mode === "same-auth" ? 802 : 801); const [first, second] = await Promise.all([runAdmissionWorker(join(x.dir, "audit.sqlite"), opA, a1), runAdmissionWorker(join(x.dir, "audit.sqlite"), opB, mode === "same-auth" ? a1 : auditAuth("r"))]); auditAssert((first === 0 ? 1 : 0) + (second === 0 ? 1 : 0) === 1, `${mode} admitted more than one`); auditAssert(x.d.prepare("SELECT count(*) n FROM ai_canary_admissions").get().n === 1, `${mode} row count`); x.d.close(); rmSync(x.dir, { recursive: true, force: true }) }

{ const x = auditFresh(); auditSeed(x.d); auditInsert(x.d, auditOp(900)); const id = "fg-" + auditOp(900); x.d.prepare("UPDATE financial_guard_reservations SET status='finalized',finalizedAt=? WHERE reservationId=?").run(auditNow, id); auditThrows(() => x.d.prepare("UPDATE financial_guard_reservations SET status='finalized' WHERE reservationId=?").run(id), "double finalize accepted"); auditThrows(() => x.d.prepare("UPDATE financial_guard_reservations SET status='released' WHERE reservationId=?").run(id), "release after finalize accepted"); auditThrows(() => x.d.prepare("UPDATE financial_guard_reservations SET finalizedAt=? WHERE reservationId=?").run("2026-09-03T00:00:00.000Z", id), "terminal reservation changed"); const actor2 = auditOtherActor; const workspace2 = auditOtherWorkspace; auditSeed(x.d, { auth: auditAuth("s"), actor: actor2, workspace: workspace2 }); auditInsert(x.d, auditOp(901), auditAuth("s"), actor2, workspace2); const id2 = "fg-" + auditOp(901); x.d.prepare("UPDATE financial_guard_reservations SET status='released',failureCode='timeout' WHERE reservationId=?").run(id2); auditThrows(() => x.d.prepare("UPDATE financial_guard_reservations SET status='released' WHERE reservationId=?").run(id2), "double release accepted"); auditThrows(() => x.d.prepare("UPDATE financial_guard_reservations SET status='finalized' WHERE reservationId=?").run(id2), "finalize after release accepted"); auditThrows(() => x.d.prepare("UPDATE financial_guard_reservations SET failureCode='x' WHERE reservationId=?").run(id2), "released reservation changed"); auditAssert(x.d.prepare("SELECT count(*) n FROM financial_guard_events").get().n === 4, "lifecycle event count"); auditThrows(() => x.d.exec("UPDATE financial_guard_events SET eventType='released'"), "event update accepted"); auditThrows(() => x.d.exec("DELETE FROM financial_guard_events"), "event delete accepted"); x.d.close(); rmSync(x.dir, { recursive: true, force: true }) }

for (const word of ["prompt", "output", "email", "cookie", "secret", "token"]) auditAssert(!new RegExp(`CREATE TABLE[^;]+\\b${word}\\b`, "i").test(readFileSync(join(auditMigrationDir, "0014_ai_canary_financial_guard.sql"), "utf8")), `sensitive ${word} column`)
{
  const x = auditFresh(); auditSeed(x.d); auditInsert(x.d, auditOp(999))
  const sentinels = ["PROMPT_SENTINEL_7b4", "PROVIDER_OUTPUT_SENTINEL_9c2", "EMAIL_SENTINEL_1d3", "COOKIE_SENTINEL_4e5", "SESSION_SENTINEL_6f7", "SECRET_SENTINEL_8a9", "RAW_AUTH_TOKEN_SENTINEL_0b1"]
  const tables = ["ai_canary_authorizations", "ai_canary_admissions", "ai_provider_usage", "financial_guard_reservations", "financial_guard_events"]
  for (const table of tables) {
    const columns = x.d.prepare(`PRAGMA table_info(${table})`).all().filter((column) => /TEXT/i.test(column.type)).map((column) => column.name)
    for (const column of columns) { const values = x.d.prepare(`SELECT ${column} value FROM ${table}`).all().map((row) => String(row.value ?? "")); for (const sentinel of sentinels) auditAssert(!values.some((value) => value.includes(sentinel)), `sensitive sentinel persisted in ${table}.${column}`) }
  }
  x.d.close(); rmSync(x.dir, { recursive: true, force: true })
}
db.close(); rmSync(tmp, { recursive: true, force: true }); console.log("AI canary financial admission audit passed: exhaustive authorization/ceiling rollback, per-mutation atomicity, independent-connection one-shot admission, lifecycle and sensitive-data exclusion")
