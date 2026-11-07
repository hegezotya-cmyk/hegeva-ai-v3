import { prepareTerminalEffect } from "./stripe-terminal-effects-outbox.js";
import { processNextTerminalEffect } from "./stripe-terminal-effects-processor.js";
import { createStagingSyntheticFixtureAdapter } from "./staging-synthetic-fixture-adapter.js";

const SCENARIOS = new Set(["retry-recovery", "lease-fencing"]);
const RUN_TABLE = "staging_scheduled_test_runs";
const isoNow = value => new Date(value).toISOString();
const statement = (db, sql, ...args) => db.prepare(sql).bind(...args);

function fixtureIds(namespace) {
  const suffix = namespace.slice("staging-fixture:".length).replaceAll("-", "");
  return { eventId: `evt_${suffix}`, userId: `fixture_${suffix}`, subscriptionId: `sub_${suffix}`, customerId: `cus_${suffix}` };
}

async function recordRun(db, { scenario, namespace, status, attempts = 0, cleanupVerified = false, now }) {
  await statement(db, `INSERT INTO ${RUN_TABLE}(scenario,namespace,status,attempts,cleanup_verified,updated_at)
    VALUES(?,?,?,?,?,?) ON CONFLICT(scenario) DO UPDATE SET namespace=excluded.namespace,status=excluded.status,
    attempts=excluded.attempts,cleanup_verified=excluded.cleanup_verified,updated_at=excluded.updated_at`,
  scenario, namespace, status, attempts, cleanupVerified ? 1 : 0, now).run();
}

async function runRetryRecovery({ db, namespace, now }) {
  const { eventId, userId, subscriptionId, customerId } = fixtureIds(namespace);
  const exists = await statement(db, `SELECT state,attempts FROM stripe_terminal_effect_outbox WHERE eventId=?`, eventId).first();
  if (!exists) {
    const prepared = prepareTerminalEffect({ eventId, userId, subscriptionId, customerId, livemode: false,
      effectType: "billing-and-referral-downgrade", now });
    if (!prepared) return { status: "blocked", attempts: 0, effectCount: 0 };
    await statement(db, prepared.sql, ...prepared.values).run();
  }
  const row = await statement(db, `SELECT state,attempts FROM stripe_terminal_effect_outbox WHERE eventId=?`, eventId).first();
  if (!row) return { status: "blocked", attempts: 0, effectCount: 0 };
  if (row.state !== "completed" && row.state !== "blocked") {
    await processNextTerminalEffect({
      db, now,
      checkCurrentState: async effect => Number(effect.attempts) === 1
        ? { currentPlan: "", currentPlanVerified: false, newerEventExists: false, newerEventsVerified: false, stateCheckReason: "synthetic-first-attempt" }
        : { currentPlan: "basic", currentPlanVerified: true, newerEventExists: false, newerEventsVerified: true, stateCheckReason: "verified" },
      executeIdempotently: async effect => {
        await statement(db, `INSERT INTO staging_synthetic_fixture_effect(namespace,operation_key,fencing_token,created_at)
          VALUES(?,?,?,?) ON CONFLICT(namespace,operation_key) DO NOTHING`,
        namespace, `processor:${effect.idempotencyKey}`, "synthetic-idempotency", Date.parse(now)).run();
      },
    });
  }
  const after = await statement(db, `SELECT state,attempts FROM stripe_terminal_effect_outbox WHERE eventId=?`, eventId).first();
  const count = await statement(db, `SELECT COUNT(*) AS n FROM staging_synthetic_fixture_effect WHERE namespace=? AND operation_key LIKE 'processor:%'`, namespace).first();
  const outcome = { status: after?.state === "pending" ? "retry-scheduled" : after?.state || "blocked",
    attempts: Number(after?.attempts || 0), effectCount: Number(count?.n || 0), cleanupVerified: false };
  await recordRun(db, { scenario: "retry-recovery", namespace, ...outcome, now });
  return outcome;
}

async function runLeaseFencing({ db, guard, namespace, now, clock, generateNonce, sleep, leaseDurationMs }) {
  const previous = await statement(db, `SELECT status FROM ${RUN_TABLE} WHERE scenario='lease-fencing'`).first();
  if (previous?.status === "completed") return { status: "completed", acquireWinners: 1, duplicateRejected: true, staleRejected: true, cleanupVerified: true };
  if (!guard || !["acquire", "release", "verifyLease", "fencedWrite", "clearExpired"].every(key => typeof guard[key] === "function")) {
    return { status: "blocked", acquireWinners: 0, duplicateRejected: false, staleRejected: false, cleanupVerified: false };
  }
  const adapter = createStagingSyntheticFixtureAdapter({ namespace, db, guard, now: clock });
  const nonceA = generateNonce(), nonceB = generateNonce();
  const deadline = clock() + leaseDurationMs;
  let cleanupVerified = false;
  try {
    const claims = await Promise.all([
      adapter.acquire({ scenario: "lease-fencing", nonce: nonceA, deadline }),
      adapter.acquire({ scenario: "lease-fencing", nonce: nonceB, deadline }),
    ]);
    const winners = claims.filter(Boolean).length;
    const winner = claims[0] ? nonceA : claims[1] ? nonceB : "";
    const first = winner ? await adapter.fencedWrite({ scenario: "lease-fencing", nonce: winner, operationCode: "lease-fencing-apply" }) : { ok: false };
    const duplicate = winner ? await adapter.fencedWrite({ scenario: "lease-fencing", nonce: winner, operationCode: "lease-fencing-apply" }) : { ok: false };
    await sleep(leaseDurationMs + 25);
    const stale = winner ? await adapter.fencedWrite({ scenario: "lease-fencing", nonce: winner, operationCode: "lease-fencing-apply" }) : { ok: false };
    await adapter.cleanup({ scenario: "lease-fencing", nonce: winner });
    cleanupVerified = await adapter.verifyCleanup({ scenario: "lease-fencing", nonce: winner }) === true;
    await guard.clearExpired({ scenario: "lease-fencing" });
    const outcome = { status: winners === 1 && first.ok === true && duplicate.ok === false && stale.ok === false && cleanupVerified ? "completed" : "blocked",
      acquireWinners: winners, duplicateRejected: duplicate.ok === false, staleRejected: stale.ok === false, cleanupVerified };
    await recordRun(db, { scenario: "lease-fencing", namespace, status: outcome.status, cleanupVerified, now: isoNow(clock()) });
    return outcome;
  } catch {
    try { await adapter.cleanup({ scenario: "lease-fencing", nonce: nonceA }); } catch {}
    try { await adapter.cleanup({ scenario: "lease-fencing", nonce: nonceB }); } catch {}
    try { await guard.clearExpired({ scenario: "lease-fencing" }); } catch {}
    cleanupVerified = await adapter.verifyCleanup({ scenario: "lease-fencing", nonce: nonceA }) === true;
    await recordRun(db, { scenario: "lease-fencing", namespace, status: "blocked", cleanupVerified, now: isoNow(clock()) });
    return { status: "blocked", acquireWinners: 0, duplicateRejected: false, staleRejected: false, cleanupVerified };
  }
}

export async function runStagingScheduledRuntimeTest({
  scenario, namespace, db, guard, now = new Date().toISOString(),
  generateNonce = () => crypto.randomUUID(), sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  leaseDurationMs = 1_000, clock = () => Date.now(),
} = {}) {
  if (!SCENARIOS.has(scenario) || typeof namespace !== "string" || !/^staging-fixture:[a-z0-9-]{8,64}$/.test(namespace) ||
      !db || typeof db.prepare !== "function" || typeof now !== "string" || !Number.isFinite(Date.parse(now)) ||
      typeof generateNonce !== "function" || typeof sleep !== "function" || typeof clock !== "function" || !Number.isInteger(leaseDurationMs) || leaseDurationMs < 1000 || leaseDurationMs > 5000) {
    return { status: "blocked", code: "invalid-input" };
  }
  try {
    if (scenario === "retry-recovery") return await runRetryRecovery({ db, namespace, now: isoNow(now) });
    return await runLeaseFencing({ db, guard, namespace, now, clock, generateNonce, sleep, leaseDurationMs });
  } catch {
    return { status: "blocked", code: "scenario-error" };
  }
}
