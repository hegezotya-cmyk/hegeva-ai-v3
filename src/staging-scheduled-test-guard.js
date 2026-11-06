// Staging-test-only persistent guard contract. Not imported by Worker entrypoints.
// The supplied store must be backed by a Durable Object or equivalent durable store
// when this mechanism is eventually enabled; an in-memory store is not production proof.
const SCENARIOS = new Set(["retry-recovery", "lease-fencing"]);
const keyFor = scenario => `staging-test-control:${scenario}`;
export function createPersistentStagingTestGuard({ store, now = () => Date.now(), leaseMs = 30_000, replayWindowMs = 60_000, maxRunsPerWindow = 1, windowMs = 60_000 } = {}) {
  if (!store || typeof store.get !== "function" || typeof store.put !== "function" || typeof store.delete !== "function") throw Error("guard-store-unavailable");
  if (![leaseMs, replayWindowMs, maxRunsPerWindow, windowMs].every(Number.isFinite) || leaseMs < 1000 || replayWindowMs < 1000 || windowMs < 1000 || maxRunsPerWindow < 1) throw Error("guard-options-invalid");
  return {
    async acquire({ scenario, nonce, deadline } = {}) {
      if (!SCENARIOS.has(scenario) || typeof nonce !== "string" || !/^[0-9a-f-]{32,36}$/i.test(nonce) || !Number.isFinite(deadline)) return false;
      const key = keyFor(scenario), current = Number(now()), record = await store.get(key) || {};
      if (record.active && Number(record.leaseUntil) > current) return false;
      if (record.lastNonce === nonce || Number(record.lastCompletedAt) + replayWindowMs > current) return false;
      const windowStart = Number(record.windowStart) > 0 ? Number(record.windowStart) : current;
      const runs = windowStart + windowMs <= current ? 0 : Number(record.runs || 0);
      if (runs >= maxRunsPerWindow) return false;
      await store.put(key, { active: true, nonce, leaseUntil: Math.min(current + leaseMs, deadline), windowStart: runs === 0 ? current : windowStart, runs: runs + 1 });
      return true;
    },
    async release({ scenario, nonce } = {}) {
      if (!SCENARIOS.has(scenario)) return false;
      const key = keyFor(scenario), record = await store.get(key);
      if (!record || record.nonce !== nonce) return false;
      await store.put(key, { ...record, active: false, lastNonce: nonce, lastCompletedAt: Number(now()) });
      return true;
    },
    async clearExpired({ scenario } = {}) {
      if (!SCENARIOS.has(scenario)) return false;
      const key = keyFor(scenario), record = await store.get(key);
      if (record?.active && Number(record.leaseUntil) <= Number(now())) await store.put(key, { ...record, active: false });
      return true;
    },
  };
}
export { SCENARIOS as STAGING_TEST_SCENARIOS };
