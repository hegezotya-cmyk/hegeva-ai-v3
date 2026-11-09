import { runStagingScheduledRuntimeTest } from "./staging-scheduled-runtime-runner.js";

const SCENARIOS = [
  { scenario: "retry-recovery", namespace: "staging-fixture:retry-run-0001" },
  { scenario: "lease-fencing", namespace: "staging-fixture:fence-run-0001" },
];

export async function runStagingScheduledTestCron(event, env = {}, { runScenario = runStagingScheduledRuntimeTest } = {}) {
  if (env.STAGING_SCHEDULED_TEST_ENABLED !== "true" || env.PAYMENT_MODE !== "test" ||
      !env.SYNTHETIC_TEST_DB || !env.GUARD || typeof runScenario !== "function") {
    return { status: "disabled", scenarios: [] };
  }
  const guardBinding = env.GUARD;
  let guard = guardBinding;
  if (typeof guardBinding.idFromName === "function" && typeof guardBinding.get === "function") {
    guard = guardBinding.get(guardBinding.idFromName("staging-synthetic-cron-guard"));
  } else if (typeof guardBinding.getByName === "function") {
    guard = guardBinding.getByName("staging-synthetic-cron-guard");
  }
  const scheduledTime = Number(event?.scheduledTime);
  const now = Number.isFinite(scheduledTime) && scheduledTime > 0
    ? new Date(scheduledTime).toISOString()
    : new Date().toISOString();
  const scenarios = [];
  for (const definition of SCENARIOS) {
    const result = await runScenario({ ...definition, scenario: definition.scenario,
      db: env.SYNTHETIC_TEST_DB, guard, now });
    scenarios.push({ scenario: definition.scenario,
      status: typeof result?.status === "string" ? result.status : "blocked",
      attempts: Number.isSafeInteger(result?.attempts) ? result.attempts : undefined,
      effectCount: Number.isSafeInteger(result?.effectCount) ? result.effectCount : undefined,
      acquireWinners: Number.isSafeInteger(result?.acquireWinners) ? result.acquireWinners : undefined,
      duplicateRejected: typeof result?.duplicateRejected === "boolean" ? result.duplicateRejected : undefined,
      staleRejected: typeof result?.staleRejected === "boolean" ? result.staleRejected : undefined,
      cleanupVerified: typeof result?.cleanupVerified === "boolean" ? result.cleanupVerified : undefined,
    });
  }
  const failed = scenarios.some(result => result.status === "blocked" || result.status === "failed");
  const pending = scenarios.some(result => result.status === "retry-scheduled" || result.status === "pending");
  return { status: failed ? "blocked" : pending ? "running" : "completed", scenarios };
}

