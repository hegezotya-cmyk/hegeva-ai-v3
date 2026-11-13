import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { handleIsolatedStripeWebhook } from "../src/isolated-deleted-user-webhook-test-worker.js";

const ACCOUNT = "ab362645fc03b7e63a26fd8e46e631b6";
const DB_ID = "84f4c3b0-c175-4458-bad1-e3f826d6ea96";
const SANDBOX = "acct_1U4YkdHH1vUED8ZN";
const SECRET = "whsec_only_offline_synthetic_secret_never_real";
const WEBHOOK_URL = "https://isolated.example/__hegeva/isolated/stripe-test-webhook";
const TEST_SCHEMA = readFileSync(new URL("./isolated-deleted-user-webhook-test-schema.sql", import.meta.url), "utf8");

function fixture(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec(TEST_SCHEMA);
  sqlite.exec('INSERT INTO "user"(id) VALUES (\'synthetic-removed\'),(\'synthetic-active\')');
  sqlite.exec("INSERT INTO user_plans VALUES ('synthetic-removed','premium','now','now')");
  sqlite.exec('DELETE FROM "user" WHERE id=\'synthetic-removed\'');
  const db = {
    raw: sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return {
        async first() { return statement.get() || null; },
        bind(...args) {
          return {
            async first() { return statement.get(...args) || null; },
            async run() {
              const row = statement.run(...args);
              return { meta: { changes: row.changes } };
            },
          };
        },
      };
    },
  };
  const env = {
    HEGEVA_ISOLATED_STRIPE_TEST_ENABLED: "true",
    PAYMENT_MODE: "test",
    ISOLATED_TEST_ACCOUNT_ID: ACCOUNT,
    ISOLATED_TEST_D1_ID: DB_ID,
    STRIPE_TEST_ACCOUNT_ID: SANDBOX,
    STRIPE_TEST_WEBHOOK_SIGNING_SECRET: SECRET,
    DB: db,
  };
  return { sqlite, env };
}
function count(sqlite, table) {
  return sqlite.prepare("SELECT COUNT(*) AS n FROM " + table).get().n;
}
function syntheticEvent(userId = "synthetic-removed", id = "evt_SyntheticTestA") {
  return {
    id, object: "event", type: "invoice.paid", livemode: false,
    created: Math.floor(Date.now() / 1000),
    account: SANDBOX,
    data: {
      object: {
        parent: {
          subscription_details: {
            metadata: { userId, hegevaPlan: "premium" },
          },
        },
      },
    },
  };
}
async function sign(body, secret = SECRET, stamp = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(stamp + "." + body));
  return "t=" + stamp + ",v1=" + [...new Uint8Array(bytes)].map(
    byte => byte.toString(16).padStart(2, "0")).join("");
}
async function request(body, { secret = SECRET, stamp, signature, url = WEBHOOK_URL, method = "POST" } = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const headers = { "Content-Type": "application/json" };
  headers["Stripe-Signature"] = signature ??
    await sign(raw, secret, stamp ?? Math.floor(Date.now() / 1000));
  return new Request(url, { method, headers, ...(method === "POST" ? { body: raw } : {}) });
}
const send = async (env, e = syntheticEvent(), options = {}) =>
  handleIsolatedStripeWebhook(await request(e, options), env);

test("scoped config has no route/cron, production D1 or automatic public URL", () => {
  const cfg = JSON.parse(readFileSync(
    new URL("../wrangler.isolated-deleted-user-webhook-test.jsonc", import.meta.url), "utf8"));
  assert.equal(cfg.account_id, ACCOUNT);
  assert.equal(cfg.d1_databases[0].database_id, DB_ID);
  assert.equal(cfg.vars.HEGEVA_ISOLATED_STRIPE_TEST_ENABLED, "false");
  assert.equal(cfg.workers_dev, false);
  assert.equal(cfg.preview_urls, false, "preview URLs must not become public after Wrangler deploy");
  assert.equal(cfg.vars.PAYMENT_MODE, "test");
  assert.equal(cfg.vars.STRIPE_TEST_ACCOUNT_ID, SANDBOX);
  assert.equal(cfg.routes, undefined);
  assert.equal(cfg.triggers, undefined);
  assert.equal(cfg.services, undefined);
});
test("isolated Worker account and D1 cannot target any existing HEGEVA database", () => {
  const cfg = JSON.parse(readFileSync(
    new URL("../wrangler.isolated-deleted-user-webhook-test.jsonc", import.meta.url), "utf8"));
  const configs = [
    "../wrangler.jsonc",
    "../wrangler.staging.jsonc",
    "../wrangler.staging-scheduled-test.jsonc",
  ].map(file => JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8")));
  const prohibitedD1 = configs.flatMap(c => c.d1_databases || []).map(d => d.database_id);
  prohibitedD1.push("f7a4ea56-fdad-423b-91a1-690ea2aa3423");
  assert.ok(!prohibitedD1.includes(cfg.d1_databases[0].database_id));
  assert.notEqual(cfg.account_id, "11475a766aa7648d8542e0fc1aea571f");
  assert.equal(cfg.d1_databases.length, 1);
  assert.equal(cfg.d1_databases[0].binding, "DB");
  for (const prohibited of [
    "routes", "route", "triggers", "services", "assets", "durable_objects",
    "ai", "kv_namespaces", "r2_buckets", "queues", "send_email",
  ]) {
    assert.equal(cfg[prohibited], undefined, "unexpected isolated Worker binding: " + prohibited);
  }
  assert.equal(cfg.observability?.enabled, false);
  assert.equal(cfg.vars.HEGEVA_ISOLATED_STRIPE_TEST_ENABLED, "false");
  assert.equal(cfg.vars.STRIPE_TEST_WEBHOOK_SIGNING_SECRET, undefined);
});
test("Stripe TEST event.account may be absent, but the pinned sandbox env must still match", async t => {
  const { sqlite, env } = fixture(t);
  const withoutAccount = syntheticEvent();
  delete withoutAccount.account;
  assert.equal((await send({ ...env, STRIPE_TEST_ACCOUNT_ID: "acct_wrong" }, withoutAccount)).status, 503);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
  const actual = await send(env, withoutAccount);
  assert.equal(actual.status, 200);
  assert.equal((await actual.json()).entitlementChanged, false);
  assert.equal(count(sqlite, "stripe_webhook_events"), 1);
});
test("schema identity is unique and delete trigger removes deleted user's plan", t => {
  const { sqlite } = fixture(t);
  assert.equal(count(sqlite, "hegeva_isolated_webhook_test_identity"), 1);
  assert.equal(count(sqlite, "hegeva_deleted_user_tombstones"), 1);
  assert.equal(count(sqlite, "user_plans"), 0);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
  assert.throws(() => sqlite.exec(
    "INSERT INTO user_plans VALUES('synthetic-removed','premium','now','now')"),
    /hegeva-plan-auth-user-missing/);
});
test("valid signed TEST event is acknowledged ignored and logged only once", async t => {
  const { sqlite, env } = fixture(t);
  const response = await send(env);
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ignored, true);
  assert.equal(json.duplicate, false);
  assert.equal(json.entitlementChanged, false);
  assert.equal(json.syntheticTestOnly, true);
  assert.equal(count(sqlite, "stripe_webhook_events"), 1);
  assert.equal(count(sqlite, "user_plans"), 0);
  assert.equal(count(sqlite, "stripe_customers"), 0);
});
test("replay is idempotent and yields one ignored event ledger record", async t => {
  const { sqlite, env } = fixture(t);
  assert.equal((await send(env)).status, 200);
  const second = await send(env);
  assert.equal(second.status, 200);
  assert.equal((await second.json()).duplicate, true);
  assert.equal(count(sqlite, "stripe_webhook_events"), 1);
});
test("concurrent replays acknowledge one new disposition", async t => {
  const { sqlite, env } = fixture(t);
  const responses = await Promise.all(Array.from({ length: 10 }, () => send(env)));
  assert.ok(responses.every(v => v.status === 200));
  const data = await Promise.all(responses.map(v => v.json()));
  assert.equal(data.filter(v => !v.duplicate).length, 1);
  assert.equal(count(sqlite, "stripe_webhook_events"), 1);
});
test("bad signature is rejected before D1 writes", async t => {
  const { sqlite, env } = fixture(t);
  const response = await send(env, syntheticEvent(), { secret: "whsec_bad_secret" });
  assert.equal(response.status, 400);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("old and future Stripe signatures are rejected", async t => {
  const { sqlite, env } = fixture(t);
  const now = Math.floor(Date.now() / 1000);
  assert.equal((await send(env, syntheticEvent(), { stamp: now - 3600 })).status, 400);
  assert.equal((await send(env, syntheticEvent(), { stamp: now + 3600 })).status, 400);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("LIVE event is never handled in TEST harness", async t => {
  const { sqlite, env } = fixture(t);
  assert.equal((await send(env, { ...syntheticEvent(), livemode: true })).status, 400);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("mismatched Stripe account context is blocked", async t => {
  const { sqlite, env } = fixture(t);
  assert.equal((await send(env, { ...syntheticEvent(), account: "acct_wrong" })).status, 400);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("disabled or mis-scoped test flag is fail closed", async t => {
  const { sqlite, env } = fixture(t);
  for (const patch of [
    { HEGEVA_ISOLATED_STRIPE_TEST_ENABLED: "false" },
    { PAYMENT_MODE: "live" },
    { ISOLATED_TEST_D1_ID: "a-different-database" },
    { ISOLATED_TEST_ACCOUNT_ID: "a-different-account" },
    { STRIPE_TEST_ACCOUNT_ID: "acct_unrelated" },
    { STRIPE_TEST_ACCOUNT_ID: "" },
  ]) {
    assert.equal((await send({ ...env, ...patch })).status, 503);
  }
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("misbound D1 identity cannot write a webhook record", async t => {
  const { sqlite, env } = fixture(t);
  sqlite.exec("UPDATE hegeva_isolated_webhook_test_identity SET databaseId='other'");
  assert.equal((await send(env)).status, 503);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("synthetic active auth user is not billed through test-only Worker", async t => {
  const { sqlite, env } = fixture(t);
  assert.equal((await send(env, syntheticEvent("synthetic-active"))).status, 409);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
  assert.equal(count(sqlite, "user_plans"), 0);
});
test("unknown user without deletion tombstone fails closed", async t => {
  const { sqlite, env } = fixture(t);
  assert.equal((await send(env, syntheticEvent("not-in-auth"))).status, 503);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("unrelated valid Stripe event does not enter legacy grant path", async t => {
  const { sqlite, env } = fixture(t);
  assert.equal((await send(env, { ...syntheticEvent(), type: "charge.refunded" })).status, 409);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("syntactically valid signed non-JSON payload is rejected", async t => {
  const { sqlite, env } = fixture(t);
  const r = await handleIsolatedStripeWebhook(await request("not-json"), env);
  assert.equal(r.status, 400);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
test("a valid signature with incorrect ledger ownership is blocked", async t => {
  const { sqlite, env } = fixture(t);
  sqlite.exec("INSERT INTO stripe_webhook_events VALUES ('evt_SyntheticTestA','invoice.paid','synthetic-active',NULL,'now','now','applied')");
  assert.equal((await send(env)).status, 503);
  assert.equal(count(sqlite, "stripe_webhook_events"), 1);
});
test("non-webhook path, GET and excess content are rejected", async t => {
  const { sqlite, env } = fixture(t);
  const wrong = await handleIsolatedStripeWebhook(
    await request(syntheticEvent(), { url: "https://isolated.example/api/billing/webhook" }), env);
  assert.equal(wrong.status, 404);
  assert.equal((await handleIsolatedStripeWebhook(
    await request(syntheticEvent(), { method: "GET" }), env)).status, 405);
  assert.equal((await handleIsolatedStripeWebhook(
    await request("x".repeat(65537)), env)).status, 413);
  assert.equal(count(sqlite, "stripe_webhook_events"), 0);
});
