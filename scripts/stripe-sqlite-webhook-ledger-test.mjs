import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { prepareTerminalEffect, TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA } from "../src/stripe-terminal-effects-outbox.js";

const src = readFileSync(new URL("../src/index-ledger.js", import.meta.url), "utf8");
const identitySrc = readFileSync(new URL("../src/stripe-terminal-billing-identity.js", import.meta.url), "utf8");
const marker = src.indexOf("const statements = [");
assert(marker >= 0, "terminal commits must build a statements array");
assert.match(src.slice(marker), /env\.DB\.batch\(statements\)/, "terminal statements must use D1 batch");
assert.match(src.slice(marker), /statements\.push\(prepareTerminalBillingIdentityStatus/);
assert.ok(src.slice(marker).includes('changes.length !== (decision.decision === "downgrade" ? 4 : 3)'), "batch result cardinality must be checked");
assert.match(identitySrc, /UPDATE stripe_customers/);
assert.match(identitySrc, /WHERE userId=\?3 AND stripeCustomerId=\?4 AND stripeSubscriptionId=\?5/);
assert.match(identitySrc, /subscriptionStatus IS NULL OR subscriptionStatus NOT IN/);

const tick = String.fromCharCode(96);
const pattern = new RegExp("env\\.DB\\.prepare\\(" + tick + "([\\s\\S]*?)" + tick + "\\)\\.bind", "g");
const sql = [...src.slice(marker).matchAll(pattern)].slice(0, 2).map((match) => match[1]);
assert.equal(sql.length, 2, "plan and ledger statements must be present");
assert.match(sql[0], /INSERT INTO user_plans/);
assert.match(sql[1], /UPDATE stripe_webhook_events/);
assert.match(sql[1], /outcome = 'applied'/);
assert.match(src.slice(marker), /env\.DB\.prepare\(queuedEffect\.sql\)\.bind/);

function d1Batch(statements, db) {
  db.exec("BEGIN");
  try {
    const results = statements.map((statement) => statement.run());
    db.exec("COMMIT");
    return results.map((result) => ({ meta: { changes: Number(result.changes) } }));
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const db = new DatabaseSync(":memory:");
try {
  db.exec(`
    CREATE TABLE stripe_webhook_events (
      eventId TEXT PRIMARY KEY, eventType TEXT, userId TEXT, plan TEXT,
      eventCreatedAt TEXT, processedAt TEXT, outcome TEXT
    );
    CREATE TABLE user_plans (
      userId TEXT PRIMARY KEY, plan TEXT, createdAt TEXT, updatedAt TEXT
    );
    CREATE TABLE stripe_customers (
      userId TEXT PRIMARY KEY, stripeCustomerId TEXT, stripeSubscriptionId TEXT,
      subscriptionStatus TEXT, cancelAtPeriodEnd INTEGER, updatedAt TEXT
    );
    ${TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA}
  `);

  const claim = db.prepare(`
    INSERT INTO stripe_webhook_events
      (eventId,eventType,userId,plan,eventCreatedAt,processedAt,outcome)
    VALUES (?1,?2,?3,?4,?5,?6,'ignored')
    ON CONFLICT(eventId) DO NOTHING
  `);
  const makeStatement = (statementSql, ...values) => ({ run: () => db.prepare(statementSql).run(...values) });
  const t = "2026-11-05T12:00:00.000Z";
  const now = "2026-11-05T12:00:01.000Z";
  const customer = "cus_sqlite_fixture";
  const subscription = "sub_sqlite_fixture";

  db.prepare(`
    INSERT INTO stripe_customers
      (userId,stripeCustomerId,stripeSubscriptionId,subscriptionStatus,cancelAtPeriodEnd,updatedAt)
    VALUES ('test_user',?1,?2,'active',1,?3)
  `).run(customer, subscription, t);

  const makeBatch = (eventId, userId) => {
    const queued = prepareTerminalEffect({
      eventId, userId, subscriptionId: subscription, customerId: customer,
      livemode: false, effectType: "billing-and-referral-downgrade", now,
    });
    assert.ok(queued);
    return [
      makeStatement(sql[0], userId, "basic", t),
      makeStatement(sql[1], now, eventId),
      makeStatement(queued.sql, ...queued.values),
      makeStatement(`
        UPDATE stripe_customers
        SET subscriptionStatus=?1, cancelAtPeriodEnd=0, updatedAt=?2
        WHERE userId=?3 AND stripeCustomerId=?4 AND stripeSubscriptionId=?5
          AND (subscriptionStatus IS NULL OR subscriptionStatus NOT IN
            ('canceled','unpaid','incomplete_expired'))
      `, "canceled", now, userId, customer, subscription),
    ];
  };

  assert.equal(claim.run("evt_one", "customer.subscription.deleted", "test_user", "premium", t, t).changes, 1);
  assert.equal(claim.run("evt_one", "customer.subscription.deleted", "test_user", "premium", t, t).changes, 0);
  const committed = d1Batch(makeBatch("evt_one", "test_user"), db);
  assert.equal(committed.length, 4);
  assert.equal(committed.every((result) => result.meta.changes === 1), true);
  assert.equal(db.prepare("SELECT plan FROM user_plans WHERE userId='test_user'").get().plan, "basic");
  assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_one'").get().outcome, "applied");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stripe_terminal_effect_outbox WHERE eventId='evt_one'").get().n, 1);
  assert.equal(db.prepare("SELECT subscriptionStatus FROM stripe_customers WHERE userId='test_user'").get().subscriptionStatus, "canceled");
  assert.equal(db.prepare("SELECT cancelAtPeriodEnd FROM stripe_customers WHERE userId='test_user'").get().cancelAtPeriodEnd, 0);

  claim.run("evt_fail", "customer.subscription.deleted", "other_user", "premium", t, t);
  db.exec("CREATE TRIGGER fail_finalize BEFORE UPDATE ON stripe_webhook_events WHEN NEW.eventId='evt_fail' BEGIN SELECT RAISE(ABORT,'simulated finalize crash'); END");
  assert.throws(() => d1Batch(makeBatch("evt_fail", "other_user"), db), /simulated finalize crash/);
  assert.equal(db.prepare("SELECT plan FROM user_plans WHERE userId='other_user'").get(), undefined);
  assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_fail'").get().outcome, "ignored");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stripe_terminal_effect_outbox WHERE eventId='evt_fail'").get().n, 0);
  assert.equal(db.prepare("SELECT subscriptionStatus FROM stripe_customers WHERE userId='test_user'").get().subscriptionStatus, "canceled");

  console.log("SQLite D1-batch PASS: plan, webhook ledger, outbox and billing identity commit or rollback together");
} finally {
  db.close();
}
