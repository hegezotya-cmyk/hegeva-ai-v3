// Windows-safe, read-only Stripe TEST ↔ staging D1 diagnostic.
// Raw identifiers stay in process memory and are never printed.
// Remote operations: Stripe GET only; staging D1 SELECT only.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const EXPECTED_ACCOUNT = "acct_1U4YkEHECF9iDE3l";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = readFileSync(resolve(root, "wrangler.staging.jsonc"), "utf8");
const key = process.env.STRIPE_TEST_READONLY_KEY?.trim() || process.env.STRIPE_TEST_SECRET_KEY?.trim() || "";

const mask = (value, prefix) => {
  if (typeof value !== "string" || !value.startsWith(prefix)) return null;
  const tail = value.slice(prefix.length);
  return `${prefix}${tail.slice(0, 4)}…${tail.slice(-4)}`;
};
const maskOpaque = value => {
  if (typeof value !== "string" || value.length < 8) return null;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
};
const idPresence = (value, prefix) => Boolean(mask(value, prefix));
const isoCreated = value => Number.isFinite(Number(value)) && Number(value) > 0
  ? new Date(Number(value) * 1000).toISOString()
  : null;

function readD1() {
  const wrangler = resolve(root, "node_modules", "wrangler", "bin", "wrangler.js");
  if (!existsSync(wrangler)) throw new Error("wrangler-not-installed-locally");
  const queries = [
    "SELECT userId, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, cancelAtPeriodEnd, currentPeriodEnd FROM stripe_customers",
    "SELECT eventId, eventType, userId, plan, eventCreatedAt, outcome FROM stripe_webhook_events ORDER BY eventCreatedAt DESC LIMIT 200",
  ];
  const childEnv = { ...process.env };
  for (const name of ["STRIPE_SECRET_KEY", "STRIPE_TEST_SECRET_KEY", "STRIPE_TEST_READONLY_KEY", "STRIPE_SANDBOX_READONLY_KEY"]) delete childEnv[name];
  return queries.flatMap(command => {
    const child = spawnSync(process.execPath, [wrangler, "d1", "execute", "hegeva-ai-staging-db", "--remote", "--config", "wrangler.staging.jsonc", "--json", "--command", command], {
      cwd: root, env: childEnv, encoding: "utf8", timeout: 30000, maxBuffer: 8 * 1024 * 1024,
      windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
    if (child.error || child.status !== 0 || child.signal) throw new Error("d1-reader-process-failed");
    const blocks = JSON.parse(child.stdout);
    if (!Array.isArray(blocks) || blocks.length === 0 || !blocks.every(b => b?.success === true && Array.isArray(b.results))) throw new Error("untrusted-d1-response");
    return blocks.flatMap(b => b.results);
  });
}

async function stripeGet(path) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "GET", headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store", signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`stripe-get-${response.status}`);
  return response.json();
}

async function readAllSubscriptions() {
  const records = [];
  let startingAfter = null;
  for (let page = 0; page < 20; page += 1) {
    const query = new URLSearchParams({ status: "all", limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);
    const result = await stripeGet(`subscriptions?${query}`);
    if (!Array.isArray(result?.data) || typeof result.has_more !== "boolean" || result.data.length > 100) throw new Error("stripe-pagination-invalid");
    records.push(...result.data);
    if (!result.has_more) return records;
    const next = result.data.at(-1)?.id;
    if (!next || next === startingAfter) throw new Error("stripe-pagination-stalled");
    startingAfter = next;
  }
  throw new Error("stripe-pagination-limit");
}

function classify(subscription, d1Rows, ledgerRows, accountMatches) {
  const userId = subscription?.metadata?.userId || null;
  const customerId = subscription?.customer || null;
  const subscriptionId = subscription?.id || null;
  const exact = d1Rows.find(row => row.userId === userId && row.stripeCustomerId === customerId && row.stripeSubscriptionId === subscriptionId);
  const sameUser = d1Rows.find(row => row.userId === userId);
  const appliedLedger = ledgerRows.filter(row => row.userId === userId && ["applied", "reconciled"].includes(row.outcome));
  let classification = "UNKNOWN";
  if (!accountMatches) classification = "wrong-account";
  else if (!userId) classification = "UNKNOWN";
  else if (!exact && !sameUser && appliedLedger.length > 0) classification = "missing-identity-mapping";
  else if (!exact && !sameUser && appliedLedger.length === 0) classification = "UNKNOWN";
  else if (!exact && sameUser) classification = "missing-identity-mapping";
  return {
    subscription: mask(subscriptionId, "sub_"), customer: mask(customerId, "cus_"),
    user: maskOpaque(userId), createdAt: isoCreated(subscription?.created),
    status: typeof subscription?.status === "string" ? subscription.status : null,
    livemode: subscription?.livemode === false ? false : subscription?.livemode === true ? true : null,
    metadataUserIdPresent: Boolean(userId), d1ExactMatch: Boolean(exact),
    d1SameUserDifferentIdentity: Boolean(sameUser && !exact),
    ledger: { appliedOrReconciledCount: appliedLedger.length, eventTypes: [...new Set(appliedLedger.map(row => row.eventType).filter(Boolean))].slice(0, 8) },
    classification,
  };
}

if (!/"PAYMENT_MODE"\s*:\s*"test"/.test(config)) {
  console.log(JSON.stringify({ verified: false, status: "FAIL", reason: "staging-not-test-mode" }));
  process.exitCode = 2;
} else if (!/^(rk|sk)_test_/.test(key)) {
  console.log(JSON.stringify({ verified: false, status: "BLOCKED", reason: "stripe-test-readonly-key-unavailable" }));
  process.exitCode = 2;
} else {
  try {
    const account = await stripeGet("account");
    const d1 = readD1();
    const subscriptions = await readAllSubscriptions();
    const d1Rows = d1.filter(row => typeof row.userId === "string" && row.userId.length > 0 && idPresence(row.stripeCustomerId, "cus_") && idPresence(row.stripeSubscriptionId, "sub_"));
    const ledgerRows = d1.filter(row => typeof row.eventType === "string" && typeof row.outcome === "string");
    const accountMatches = account?.id === EXPECTED_ACCOUNT && account?.livemode === false;
    const testSubscriptions = subscriptions.filter(row => row?.livemode === false);
    const active = testSubscriptions.filter(row => ["active", "trialing", "past_due"].includes(String(row.status || "").toLowerCase()));
    const details = active.map(row => classify(row, d1Rows, ledgerRows, accountMatches));
    const missing = details.filter(row => row.classification !== "UNKNOWN" && !row.d1ExactMatch);
    const status = accountMatches && details.length === 2 && missing.length === 0 ? "PASS" : "REVIEW_REQUIRED";
    console.log(JSON.stringify({
      verified: true, status, releaseSafe: status === "PASS", accountIdentity: accountMatches ? "PASS" : "BLOCKED",
      accountId: mask(account?.id, "acct_"), accountExpected: true, accountLivemode: account?.livemode === false ? false : account?.livemode === true ? true : null,
      pagination: "PASS", d1IdentityRows: d1Rows.length, webhookLedgerRows: ledgerRows.length,
      stripeSubscriptions: testSubscriptions.length, stripeActiveSubscriptions: active.length,
      subscriptions: details,
      ownerAction: missing.length ? "Classify the unmatched TEST record before any repair; no automatic D1 or Stripe mutation." : null,
    }, null, 2));
    if (status !== "PASS") process.exitCode = 2;
  } catch {
    console.log(JSON.stringify({ verified: false, status: "BLOCKED", reason: "read-only-diagnostic-failed" }));
    process.exitCode = 2;
  }
}
