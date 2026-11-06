// Adapter boundary for staging-only synthetic fixtures. No production DB adapter is accepted.
const SCENARIOS = new Set(["retry-recovery", "lease-fencing"]);
const OPERATIONS = new Set(["retry-recovery-apply", "lease-fencing-apply"]);

export function createStagingSyntheticFixtureAdapter({ namespace, adapter } = {}) {
  if (typeof namespace !== "string" || !/^staging-fixture:[a-z0-9-]{8,64}$/.test(namespace)) throw Error("fixture-namespace-invalid");
  if (!adapter || adapter.isSyntheticFixture !== true) throw Error("fixture-adapter-not-isolated");
  const call = (name, input = {}) => adapter[name]({ ...input, namespace });
  return {
    isSyntheticFixture: true,
    namespace,
    acquire: input => call("acquire", input),
    release: input => call("release", input),
    verifyLease: input => call("verifyLease", input),
    fencedWrite: input => {
      if (!SCENARIOS.has(input?.scenario) || !OPERATIONS.has(input?.operationCode)) return Promise.resolve({ ok: false, reason: "invalid-fenced-operation" });
      return call("fencedWrite", input);
    },
    runSynthetic: input => call("runSynthetic", input),
    cleanup: input => call("cleanup", input),
    verifyCleanup: input => call("verifyCleanup", input),
  };
}
