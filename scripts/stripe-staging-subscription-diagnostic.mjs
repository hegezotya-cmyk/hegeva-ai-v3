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
const configuredPrices = [...config.matchAll(/"(STRIPE_[A-Z_]+PRICE_ID)"\s*:\s*"(price_[^"]+)"/g)].map(([, name, id]) => ({ name, id }));

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

function runD1Query(command) {
  const wrangler = resolve(root, "node_modules", "wrangler", "bin", "wrangler.js");
  if (!existsSync(wrangler)) throw new Error("d1-reader-failed");
  const childEnv = { ...process.env };
  for (const name of ["STRIPE_SECRET_KEY", "STRIPE_TEST_SECRET_KEY", "STRIPE_TEST_READONLY_KEY", "STRIPE_SANDBOX_READONLY_KEY"]) delete childEnv[name];
  const child = spawnSync(process.execPath, [wrangler, "d1", "execute", "hegeva-ai-staging-db", "--remote", "--config", "wrangler.staging.jsonc", "--json", "--command", command], {
      cwd: root, env: childEnv, encoding: "utf8", timeout: 30000, maxBuffer: 8 * 1024 * 1024,
      windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  if (child.error || child.status !== 0 || child.signal) throw new Error("d1-reader-failed");
  let blocks;
  try { blocks = JSON.parse(child.stdout); } catch { throw new Error("d1-reader-failed"); }
  if (!Array.isArray(blocks) || blocks.length === 0 || !blocks.every(b => b?.success === true && Array.isArray(b.results))) throw new Error("d1-reader-failed");
  return blocks.flatMap(b => b.results);
}

function readD1() {
  let customerSchema;
  let ledgerSchema;
  try {
    customerSchema = runD1Query("PRAGMA table_info(stripe_customers)");
    ledgerSchema = runD1Query("PRAGMA table_info(stripe_webhook_events)");
  } catch { throw new Error("d1-schema-read-failed"); }
  const customerColumns = new Set(customerSchema.map(row => row.name));
  const ledgerColumns = new Set(ledgerSchema.map(row => row.name));
  const requiredCustomer = ["userId", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus"];
  const requiredLedger = ["eventId", "eventType", "userId", "plan", "eventCreatedAt", "outcome"];
  if (!requiredCustomer.every(name => customerColumns.has(name)) || !requiredLedger.every(name => ledgerColumns.has(name))) throw new Error("d1-schema-mismatch");
  try {
    return {
      identities: runD1Query("SELECT userId, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, cancelAtPeriodEnd, currentPeriodEnd FROM stripe_customers"),
      ledger: runD1Query("SELECT eventId, eventType, userId, plan, eventCreatedAt, outcome FROM stripe_webhook_events ORDER BY eventCreatedAt DESC LIMIT 200"),
    };
  } catch { throw new Error("d1-reader-failed"); }
}

async function stripeGet(path, errorCode = "stripe-read-failed") {
  let response;
  try {
    response = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: "GET", headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      cache: "no-store", signal: AbortSignal.timeout(30000),
    });
  } catch {
    const error = new Error(`${errorCode}-network`);
    throw error;
  }
  if (!response.ok) {
    const error = new Error(errorCode);
    error.httpStatus = response.status;
    throw error;
  }
  try { return await response.json(); } catch { throw new Error(`${errorCode}-invalid-json`); }
}

async function readAccountAndPrices() {
  let account = null;
  let accountReadStatus = "BLOCKED";
  let accountHttpStatus = null;
  let accountError = null;
  try {
    account = await stripeGet("account", "stripe-account-read-failed");
    accountReadStatus = "PASS";
    accountHttpStatus = 200;
  } catch (error) {
    accountHttpStatus = error.httpStatus ?? null;
    if (accountHttpStatus !== 403) throw new Error("stripe-account-read-failed");
    accountError = "account-read-403";
  }
  const prices = [];
  for (const { name, id } of configuredPrices) {
    try {
      const price = await stripeGet(`prices/${encodeURIComponent(id)}`, "stripe-price-read-failed");
      prices.push({ name, prefix: id.slice(0, 8), found: price?.id === id, livemode: price?.livemode ?? null });
    } catch (error) { throw new Error(error?.message || "stripe-price-read-failed"); }
  }
  const pricesPass = prices.length === 5 && prices.every(price => price.found && price.livemode === false);
  const accountMatches = account?.id === EXPECTED_ACCOUNT && account?.livemode === false;
  const identityPass = accountMatches || (accountHttpStatus === 403 && pricesPass);
  return { account, accountReadStatus, accountHttpStatus, accountError, prices, pricesPass, identityPass, identityEvidence: accountMatches ? "account" : pricesPass ? "configured-test-price-catalog" : "none" };
}

async function readAllSubscriptions() {
  const records = [];
  let startingAfter = null;
  for (let page = 0; page < 20; page += 1) {
    const query = new URLSearchParams({ status: "all", limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);
    const result = await stripeGet(`subscriptions?${query}`, "stripe-subscription-read-failed");
    if (!Array.isArray(result?.data) || typeof result.has_more !== "boolean" || result.data.length > 100) throw new Error("pagination-incomplete");
    records.push(...result.data);
    if (!result.has_more) return records;
    const next = result.data.at(-1)?.id;
    if (!next || next === startingAfter) throw new Error("pagination-incomplete");
    startingAfter = next;
  }
  throw new Error("pagination-incomplete");
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
    const identity = await readAccountAndPrices();
    const d1 = readD1();
    const subscriptions = await readAllSubscriptions();
    const d1Rows = d1.identities.filter(row => typeof row.userId === "string" && row.userId.length > 0 && idPresence(row.stripeCustomerId, "cus_") && idPresence(row.stripeSubscriptionId, "sub_"));
    const ledgerRows = d1.ledger;
    const testSubscriptions = subscriptions.filter(row => row?.livemode === false);
    const active = testSubscriptions.filter(row => ["active", "trialing", "past_due"].includes(String(row.status || "").toLowerCase()));
    const details = active.map(row => classify(row, d1Rows, ledgerRows, identity.identityPass));
    const missing = details.filter(row => !row.d1ExactMatch);
    const completeInventory = subscriptions.every(row => row?.livemode === false);
    const status = identity.identityPass && identity.pricesPass && completeInventory && missing.length === 0 ? "PASS" : "REVIEW_REQUIRED";
    console.log(JSON.stringify({
      verified: true, status, releaseSafe: status === "PASS", accountIdentity: identity.identityPass ? "PASS" : "BLOCKED",
      accountIdentityEvidence: identity.identityEvidence, accountReadStatus: identity.accountReadStatus,
      accountError: identity.accountError, accountHttpStatus: identity.accountHttpStatus, accountId: mask(identity.account?.id, "acct_"), accountExpected: true,
      accountLivemode: identity.account?.livemode === false ? false : identity.account?.livemode === true ? true : null,
      configuredPriceCheck: identity.pricesPass ? "PASS" : "BLOCKED", configuredPrices: identity.prices,
      pagination: completeInventory ? "PASS" : "BLOCKED", d1IdentityRows: d1Rows.length, webhookLedgerRows: ledgerRows.length,
      stripeSubscriptions: testSubscriptions.length, stripeActiveSubscriptions: active.length,
      subscriptions: details,
      unrepresentedActiveSubscriptions: missing.length,
      ownerAction: missing.length ? "Classify the unmatched TEST record before any repair; no automatic D1 or Stripe mutation." : null,
    }, null, 2));
    if (status !== "PASS") process.exitCode = 2;
  } catch (error) {
    const reason = /^(stripe-account-read-failed|stripe-price-read-failed|stripe-subscription-read-failed|pagination-incomplete|d1-schema-read-failed|d1-schema-mismatch|d1-reader-failed)(-network|-invalid-json)?$/.test(error?.message || "") ? error.message : "diagnostic-internal-error";
    console.log(JSON.stringify({ verified: false, status: "BLOCKED", reason }));
    process.exitCode = 2;
  }
}
