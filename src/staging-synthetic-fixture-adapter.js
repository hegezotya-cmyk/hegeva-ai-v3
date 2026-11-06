// Staging-only adapter. The caller must pass the separate SYNTHETIC_TEST_DB binding.
// It never accepts the production DB binding, arbitrary SQL, or customer identifiers.
const SCENARIOS = new Set(["retry-recovery", "lease-fencing"]);
const OPERATIONS = new Set(["retry-recovery-apply", "lease-fencing-apply"]);
const table = "staging_synthetic_fixture";
const run = async (db, sql, ...args) => { const out = await db.prepare(sql).bind(...args).run(); return Number(out?.meta?.changes || 0); };
const first = async (db, sql, ...args) => db.prepare(sql).bind(...args).first();
export async function ensureSyntheticFixtureSchema(db) {
  if (!db || typeof db.exec !== "function") throw Error("synthetic-db-binding-required");
  await db.exec(`CREATE TABLE IF NOT EXISTS ${table}_lease (namespace TEXT PRIMARY KEY, nonce TEXT NOT NULL, lease_until INTEGER NOT NULL, active INTEGER NOT NULL CHECK(active=1)); CREATE TABLE IF NOT EXISTS ${table}_effect (namespace TEXT NOT NULL, operation_key TEXT NOT NULL, fencing_token TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(namespace, operation_key));`);
}
export function createStagingSyntheticFixtureAdapter({ namespace, db, guard } = {}) {
  if (typeof namespace !== "string" || !/^staging-fixture:[a-z0-9-]{8,64}$/.test(namespace)) throw Error("fixture-namespace-invalid");
  if (!db || typeof db.prepare !== "function") throw Error("synthetic-db-binding-required");
  if (!guard || !["acquire", "release", "verifyLease", "fencedWrite"].every(k => typeof guard[k] === "function")) throw Error("guard-rpc-unavailable");
  const lease = `${table}_lease`, effect = `${table}_effect`;
  return {
    isSyntheticFixture: true, namespace,
    async acquire({ scenario, nonce, deadline }) { if (!SCENARIOS.has(scenario) || typeof nonce !== "string") return false; const ok = await guard.acquire({ scenario, nonce, deadline }); if (!ok) return false; try { await run(db, `INSERT OR REPLACE INTO ${lease}(namespace,nonce,lease_until,active) VALUES(?,?,?,1)`, namespace, nonce, deadline); return true; } catch { await guard.release({ scenario, nonce }); return false; } },
    async release({ scenario, nonce }) { const out = await guard.release({ scenario, nonce }); if (out) await run(db, `DELETE FROM ${lease} WHERE namespace=? AND nonce=?`, namespace, nonce); return out; },
    async verifyLease({ scenario, nonce }) { if (await guard.verifyLease({ scenario, nonce }) !== true) return false; const row = await first(db, `SELECT 1 AS ok FROM ${lease} WHERE namespace=? AND nonce=? AND active=1 AND lease_until>?`, namespace, nonce, Date.now()); return row?.ok === 1; },
    async fencedWrite({ scenario, nonce, operationCode }) { if (!SCENARIOS.has(scenario) || !OPERATIONS.has(operationCode)) return { ok: false, reason: "invalid-fenced-operation" }; const grant = await guard.fencedWrite({ scenario, nonce, operationCode }); if (grant?.ok !== true) return grant || { ok: false, reason: "lease-invalid" }; const operationKey = `${scenario}:${operationCode}`; const changes = await run(db, `INSERT INTO ${effect}(namespace,operation_key,fencing_token,created_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM ${lease} WHERE namespace=? AND nonce=? AND active=1 AND lease_until>?) ON CONFLICT(namespace,operation_key) DO NOTHING`, namespace, operationKey, nonce, Date.now(), namespace, nonce, Date.now()); return changes === 1 ? { ok: true, operationCode, fencingToken: nonce } : { ok: false, reason: "stale-or-duplicate" }; },
    async runSynthetic({ scenario, fencedWrite }) { const out = await fencedWrite(scenario === "lease-fencing" ? "lease-fencing-apply" : "retry-recovery-apply"); return out.ok ? { status: "completed" } : { status: "blocked", reason: out.reason }; },
    async cleanup() { await run(db, `DELETE FROM ${effect} WHERE namespace=?`, namespace); await run(db, `DELETE FROM ${lease} WHERE namespace=?`, namespace); },
    async verifyCleanup() { const a = await first(db, `SELECT COUNT(*) AS n FROM ${effect} WHERE namespace=?`, namespace); const b = await first(db, `SELECT COUNT(*) AS n FROM ${lease} WHERE namespace=?`, namespace); return Number(a?.n || 0) === 0 && Number(b?.n || 0) === 0; },
  };
}
