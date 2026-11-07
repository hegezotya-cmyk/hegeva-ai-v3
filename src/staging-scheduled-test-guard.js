// Staging-test-only persistent guard contract. Not imported by Worker entrypoints.
// The store MUST expose one atomic transaction(callback) operation backed by a
// Durable Object or equivalent CAS store. Separate get()/put() is rejected.
const SCENARIOS = new Set(["retry-recovery", "lease-fencing"]);
const OPERATIONS = new Set(["retry-recovery-apply", "lease-fencing-apply"]);
const keyFor = scenario => `staging-test-control:${scenario}`;
export function createPersistentStagingTestGuard({ store, now = () => Date.now(), leaseMs = 30_000, replayWindowMs = 60_000, maxRunsPerWindow = 1, windowMs = 60_000 } = {}) {
  if (!store || typeof store.transaction !== "function") throw Error("guard-atomic-store-unavailable");
  if (![leaseMs, replayWindowMs, maxRunsPerWindow, windowMs].every(Number.isFinite) || leaseMs < 1000 || replayWindowMs < 1000 || windowMs < 1000 || maxRunsPerWindow < 1) throw Error("guard-options-invalid");
  return {
    async acquire({ scenario, nonce, deadline } = {}) {
      if (!SCENARIOS.has(scenario) || typeof nonce !== "string" || !/^[0-9a-f-]{32,36}$/i.test(nonce) || !Number.isFinite(deadline)) return false;
      const key = keyFor(scenario), current = Number(now());
      return store.transaction(async tx => {
        const record = await tx.get(key) || {};
        if (record.active && Number(record.leaseUntil) > current) return false;
        if (record.lastNonce === nonce || Number(record.lastCompletedAt) + replayWindowMs > current) return false;
        const windowStart = Number(record.windowStart) > 0 ? Number(record.windowStart) : current;
        const runs = windowStart + windowMs <= current ? 0 : Number(record.runs || 0);
        if (runs >= maxRunsPerWindow) return false;
        await tx.put(key, { active: true, nonce, leaseUntil: Math.min(current + leaseMs, deadline), windowStart: runs === 0 ? current : windowStart, runs: runs + 1 });
        return true;
      });
    },
    async release({ scenario, nonce } = {}) {
      if (!SCENARIOS.has(scenario)) return false;
      const key = keyFor(scenario);
      return store.transaction(async tx => {
        const record = await tx.get(key);
        if (!record || record.nonce !== nonce || Number(record.leaseUntil) <= Number(now())) return false;
        await tx.put(key, { ...record, active: false, lastNonce: nonce, lastCompletedAt: Number(now()) });
        return true;
      });
    },
    async clearExpired({ scenario } = {}) {
      if (!SCENARIOS.has(scenario)) return false;
      const key = keyFor(scenario);
      return store.transaction(async tx => {
        const record = await tx.get(key);
        if (record?.active && Number(record.leaseUntil) <= Number(now())) await tx.put(key, { ...record, active: false });
        return true;
      });
    },
    async verifyLease({ scenario, nonce } = {}) {
      if (!SCENARIOS.has(scenario) || typeof nonce !== "string") return false;
      return store.transaction(async tx => {
        const record = await tx.get(keyFor(scenario));
        return record?.active === true && record.nonce === nonce && Number(record.leaseUntil) > Number(now());
      });
    },
    async fencedWrite({ scenario, nonce, operationCode } = {}) {
      if (!SCENARIOS.has(scenario) || !OPERATIONS.has(operationCode)) return {ok:false, reason:"invalid-fenced-operation"};
      const key = keyFor(scenario);
      return store.transaction(async tx => {
        const record = await tx.get(key), current = Number(now());
        if (!record || record.nonce !== nonce || record.active !== true || Number(record.leaseUntil) <= current) return {ok:false, reason:"lease-invalid"};
        return {ok:true, operationCode, fencingToken:nonce};
      });
    },
  };
}
export { SCENARIOS as STAGING_TEST_SCENARIOS };
