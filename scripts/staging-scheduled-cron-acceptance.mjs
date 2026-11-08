import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const EXPECTED_DATABASE = "hegeva-ai-v3-staging-scheduled-test-db";
const CONFIG_PATH = process.env.SYNTHETIC_TEST_WRANGLER_CONFIG || "wrangler.staging-scheduled-test.jsonc";
// Cron trigger changes can take up to 15 minutes to propagate; allow two more minute-level invocations for retry recovery.
const ACCEPTANCE_TIMEOUT_MS = 1_080_000;
const POLL_INTERVAL_MS = 15_000;

const SQL = `SELECT
  (SELECT status FROM staging_scheduled_test_runs WHERE scenario='retry-recovery') AS retry_status,
  (SELECT attempts FROM staging_scheduled_test_runs WHERE scenario='retry-recovery') AS retry_attempts,
  (SELECT status FROM staging_scheduled_test_runs WHERE scenario='lease-fencing') AS fencing_status,
  (SELECT cleanup_verified FROM staging_scheduled_test_runs WHERE scenario='lease-fencing') AS fencing_cleanup_verified,
  (SELECT COUNT(*) FROM stripe_terminal_effect_outbox WHERE substr(userId,1,8)='fixture_') AS fixture_outbox_rows,
  (SELECT COUNT(*) FROM stripe_terminal_effect_outbox WHERE substr(userId,1,8)='fixture_' AND state='completed' AND attempts=2 AND livemode=0) AS completed_test_outbox_rows,
  (SELECT COUNT(*) FROM staging_synthetic_fixture_effect WHERE namespace='staging-fixture:retry-run-0001' AND operation_key LIKE 'processor:%') AS processor_effect_rows,
  (SELECT COUNT(*) FROM staging_synthetic_fixture_lease WHERE namespace IN ('staging-fixture:retry-run-0001','staging-fixture:fence-run-0001')) AS active_fixture_leases`;

const asNumber = value => Number(value ?? 0);

export function evaluateCronAcceptanceSnapshot(row) {
  if (!row || !row.retry_status || !row.fencing_status) return { status: "PENDING" };
  if (row.retry_status === "blocked" || row.retry_status === "failed" ||
      row.fencing_status === "blocked" || row.fencing_status === "failed") {
    throw new Error("remote-synthetic-cron-scenario-failed");
  }
  if (row.retry_status !== "completed" || row.fencing_status !== "completed") {
    return { status: "PENDING" };
  }

  const evidence = {
    retryAttempts: asNumber(row.retry_attempts),
    completedOutboxRows: asNumber(row.completed_test_outbox_rows),
    processorEffects: asNumber(row.processor_effect_rows),
    activeLeases: asNumber(row.active_fixture_leases),
  };
  if (evidence.retryAttempts !== 2 ||
      asNumber(row.fencing_cleanup_verified) !== 1 ||
      asNumber(row.fixture_outbox_rows) !== 1 ||
      evidence.completedOutboxRows !== 1 ||
      evidence.processorEffects !== 1 ||
      evidence.activeLeases !== 0) {
    throw new Error("remote-synthetic-cron-evidence-mismatch");
  }
  return { status: "PASS", ...evidence };
}

function readSnapshot() {
  const result = spawnSync("npx", [
    "wrangler", "d1", "execute", EXPECTED_DATABASE, "--remote",
    "--config", CONFIG_PATH, "--command", SQL, "--json",
  ], { encoding: "utf8", env: process.env, timeout: 45_000 });
  if (result.error || result.status !== 0) {
    throw new Error("remote-synthetic-cron-read-failed");
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    throw new Error("remote-synthetic-cron-read-invalid-json");
  }
  const rows = parsed?.[0]?.results;
  if (!Array.isArray(rows)) throw new Error("remote-synthetic-cron-read-missing-results");
  return rows[0] ?? null;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function waitForRemoteCronAcceptance({
  read = readSnapshot,
  wait = sleep,
  timeoutMs = ACCEPTANCE_TIMEOUT_MS,
  pollIntervalMs = POLL_INTERVAL_MS,
  now = () => Date.now(),
} = {}) {
  const deadline = now() + timeoutMs;
  while (true) {
    const acceptance = evaluateCronAcceptanceSnapshot(await read());
    if (acceptance.status === "PASS") return acceptance;
    if (now() >= deadline) throw new Error("remote-synthetic-cron-acceptance-timeout");
    await wait(pollIntervalMs);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const acceptance = await waitForRemoteCronAcceptance();
  console.log(`PASS: remote scheduled Cron retry recovery and fencing verified; attempts=${acceptance.retryAttempts}, completed synthetic effects=${acceptance.processorEffects}, active fixture leases=${acceptance.activeLeases}.`);
}
