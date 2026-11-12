import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { decideStripeEntitlement } from '../src/stripe-entitlement-reconciliation-policy.js';

const guardSql = readFileSync(new URL('../docs/release/2026-11-11-staging-orphan-plan-guards.sql', import.meta.url), 'utf8');
const makeDb = () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE "user" (id TEXT PRIMARY KEY, email TEXT NOT NULL);
    CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT NOT NULL CHECK (plan IN ('basic','premium','pro')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE stripe_customers (userId TEXT PRIMARY KEY, stripeCustomerId TEXT NOT NULL, stripeSubscriptionId TEXT, subscriptionStatus TEXT);
    CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY, userId TEXT, eventType TEXT NOT NULL, outcome TEXT NOT NULL);
  `);
  db.exec(guardSql);
  return db;
};
const get = (db, id) => db.prepare('SELECT plan FROM user_plans WHERE userId = ?').get(id)?.plan ?? null;
const addPlan = (db, id, plan = 'premium') => db.prepare('INSERT INTO user_plans(userId,plan,createdAt,updatedAt) VALUES (?, ?, ?, ?)').run(id, plan, '2026-11-08T19:17:56.000Z', '2026-11-08T19:17:56.000Z');

test('deleting an authenticated test user removes only their plan and retains billing audit', () => {
  const db = makeDb();
  try {
    db.exec(`INSERT INTO "user" VALUES ('owner-qa','qa@hegeva.test'), ('other-qa','other@hegeva.test')`);
    addPlan(db, 'owner-qa'); addPlan(db, 'other-qa', 'basic');
    db.exec(`INSERT INTO stripe_customers VALUES ('owner-qa','cus_qa','sub_qa','canceled')`);
    db.exec(`INSERT INTO stripe_webhook_events VALUES ('evt_qa','owner-qa','customer.subscription.deleted','applied')`);
    db.prepare('DELETE FROM "user" WHERE id=?').run('owner-qa');
    assert.equal(get(db, 'owner-qa'), null);
    assert.equal(get(db, 'other-qa'), 'basic');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM stripe_customers').get().count, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM stripe_webhook_events').get().count, 1);
  } finally { db.close(); }
});

test('late Stripe webhook cannot recreate a deleted user plan', () => {
  const db = makeDb();
  try {
    db.exec(`INSERT INTO "user" VALUES ('owner-qa','qa@hegeva.test')`);
    addPlan(db, 'owner-qa');
    db.exec(`DELETE FROM "user" WHERE id='owner-qa'`);
    assert.throws(() => addPlan(db, 'owner-qa'), /hegeva-plan-auth-user-missing/);
    assert.equal(get(db, 'owner-qa'), null);
    db.exec(`INSERT INTO "user" VALUES ('owner-qa','qa@hegeva.test')`);
    assert.equal(addPlan(db, 'owner-qa').changes, 1);
  } finally { db.close(); }
});

test('normal signed-in subscription writes still work', () => {
  const db = makeDb();
  try {
    db.exec(`INSERT INTO "user" VALUES ('valid-user','qa@hegeva.test')`);
    assert.equal(addPlan(db, 'valid-user').changes, 1);
    assert.equal(get(db, 'valid-user'), 'premium');
  } finally { db.close(); }
});

test('existing orphan rows are deliberately not deleted by proposed guards', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE "user" (id TEXT PRIMARY KEY);
      CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT NOT NULL, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE stripe_customers (userId TEXT PRIMARY KEY, stripeCustomerId TEXT NOT NULL);
      INSERT INTO user_plans VALUES ('historical-orphan', 'premium', 'now', 'now');`);
    db.exec(guardSql);
    assert.equal(get(db, 'historical-orphan'), 'premium');
    assert.throws(() => addPlan(db, 'another-orphan'), /hegeva-plan-auth-user-missing/);
    assert.throws(
      () => db.prepare("UPDATE user_plans SET plan='basic' WHERE userId='historical-orphan'").run(),
      /hegeva-plan-auth-user-missing/
    );
    assert.equal(get(db, 'historical-orphan'), 'premium');
  } finally { db.close(); }
});

test('a late webhook plan grant is rejected so the event ledger cannot be marked applied', () => {
  const db = makeDb();
  try {
    db.exec("BEGIN");
    assert.throws(() => {
      db.exec("INSERT INTO stripe_webhook_events VALUES ('evt_late','gone-user','invoice.paid','ignored')");
      addPlan(db, 'gone-user');
      db.exec("UPDATE stripe_webhook_events SET outcome='applied' WHERE eventId='evt_late'");
    }, /hegeva-plan-auth-user-missing/);
    db.exec("ROLLBACK");
    assert.equal(db.prepare("SELECT COUNT(*) AS c FROM stripe_webhook_events WHERE eventId='evt_late'").get().c, 0);
    assert.equal(get(db, 'gone-user'), null);
  } finally { db.close(); }
});

test('an ON CONFLICT plan upsert for a historical orphan fails closed', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE "user" (id TEXT PRIMARY KEY);
      CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT NOT NULL, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE stripe_customers (userId TEXT PRIMARY KEY, stripeCustomerId TEXT NOT NULL);
      INSERT INTO user_plans VALUES ('historical-orphan', 'premium', 'earlier', 'earlier');`);
    db.exec(guardSql);
    assert.throws(() => db.prepare(`
      INSERT INTO user_plans(userId,plan,createdAt,updatedAt)
      VALUES ('historical-orphan','basic','later','later')
      ON CONFLICT(userId) DO UPDATE SET plan=excluded.plan,updatedAt=excluded.updatedAt
    `).run(), /hegeva-plan-auth-user-missing/);
    assert.equal(get(db, 'historical-orphan'), 'premium');
  } finally { db.close(); }
});

test('cancellation retains Premium when another same-user TEST subscription is active', () => {
  const result = decideStripeEntitlement({
    userId:'owner-qa', livemode:false, inventoryComplete:true,
    subscriptions:[
      {id:'sub_canceled',customerId:'cus_old',userId:'owner-qa',status:'canceled',plan:'premium',livemode:false},
      {id:'sub_active',customerId:'cus_new',userId:'owner-qa',status:'active',plan:'premium',livemode:false}
    ]
  });
  assert.deepEqual(result, {decision:'retain',plan:'premium'});
});

test('without an active subscription, complete inventory downgrades to Basic', () => {
  const result = decideStripeEntitlement({
    userId:'owner-qa', livemode:false, inventoryComplete:true,
    subscriptions:[{id:'sub_canceled',customerId:'cus_old',userId:'owner-qa',status:'canceled',plan:'premium',livemode:false}]
  });
  assert.deepEqual(result, {decision:'downgrade',plan:'basic'});
});

test('incomplete inventory never authorizes a downgrade', () => {
  assert.equal(decideStripeEntitlement({userId:'owner-qa',livemode:false,inventoryComplete:false,subscriptions:[]}).decision, 'defer');
});
