// Offline transaction model for #102. Run with Node 22: node --test this-file.mjs.
// The production adapter must resolve identity and verify signature and mode
// before executing equivalent guarded statements in a single D1 batch.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { decideStripeEntitlement } from '../src/stripe-entitlement-reconciliation-policy.js';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(`
    CREATE TABLE user (id TEXT PRIMARY KEY);
    CREATE TABLE user_plans (id TEXT PRIMARY KEY, plan TEXT NOT NULL);
    CREATE TABLE stripe_customers (id TEXT PRIMARY KEY, customer TEXT NOT NULL);
    CREATE TABLE tombstones (id TEXT PRIMARY KEY, deletedAt TEXT NOT NULL);
    CREATE TABLE audit (eventId TEXT PRIMARY KEY, userId TEXT NOT NULL, outcome TEXT NOT NULL);
    CREATE TRIGGER record_account_deletion AFTER DELETE ON user BEGIN
      INSERT INTO tombstones VALUES (OLD.id, CURRENT_TIMESTAMP);
      DELETE FROM user_plans WHERE id = OLD.id;
    END;
    INSERT INTO user VALUES ('user');
    INSERT INTO user_plans VALUES ('user', 'premium');
  `);
  return db;
}

function deliver(db, { eventId, userId, customer, plan }) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const prior = db.prepare('SELECT userId, outcome FROM audit WHERE eventId = ?').get(eventId);
    let outcome;
    if (prior) {
      if (prior.userId !== userId) throw new Error('event identity conflict');
      outcome = prior.outcome;
    } else {
      const deleted = db.prepare('SELECT 1 FROM tombstones WHERE id = ?').get(userId);
      if (deleted) {
        outcome = 'ignored_deleted_user';
      } else {
        if (!db.prepare('SELECT 1 FROM user WHERE id = ?').get(userId)) {
          throw new Error('unresolved user');
        }
        db.prepare('INSERT INTO stripe_customers VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET customer = excluded.customer').run(userId, customer);
        db.prepare('INSERT INTO user_plans VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET plan = excluded.plan').run(userId, plan);
        outcome = 'applied';
      }
      db.prepare('INSERT INTO audit VALUES (?, ?, ?)').run(eventId, userId, outcome);
    }
    db.exec('COMMIT');
    return { outcome, entitlementChanged: !prior && outcome === 'applied' };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

const event = { eventId: 'evt_test', userId: 'user', customer: 'cus_test', plan: 'premium' };
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;

test('deletion after entitlement decision prevents grant and records one terminal outcome on replay', t => {
  const db = fixture(t);
  db.exec("DELETE FROM user WHERE id = 'user'");
  const expected = { outcome: 'ignored_deleted_user', entitlementChanged: false };
  assert.deepEqual(deliver(db, event), expected);
  assert.deepEqual(deliver(db, event), expected);
  assert.equal(count(db, 'audit'), 1);
  assert.equal(count(db, 'stripe_customers'), 0);
  assert.equal(count(db, 'user_plans'), 0);
});

test('audit failure rolls back both customer and plan mutations and allows retry', t => {
  const db = fixture(t);
  db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON audit BEGIN SELECT RAISE(ABORT, 'audit failed'); END");
  const downgrade = { ...event, plan: 'basic' };
  assert.throws(() => deliver(db, downgrade), /audit failed/);
  assert.equal(count(db, 'stripe_customers'), 0);
  assert.equal(db.prepare('SELECT plan FROM user_plans').get().plan, 'premium');
  assert.equal(count(db, 'audit'), 0);
  db.exec('DROP TRIGGER fail_audit');
  assert.deepEqual(deliver(db, downgrade), { outcome: 'applied', entitlementChanged: true });
});

test('missing identity does not create a tombstone or acknowledge deletion', t => {
  const db = fixture(t);
  assert.throws(() => deliver(db, { ...event, userId: 'unknown' }), /unresolved user/);
  assert.equal(count(db, 'audit'), 0);
  assert.equal(count(db, 'tombstones'), 0);
  assert.equal(count(db, 'stripe_customers'), 0);
});

test('complete inventory retains Premium across distinct customers', t => {
  const db = fixture(t);
  const result = decideStripeEntitlement({
    userId: 'user', livemode: false, inventoryComplete: true,
    subscriptions: [
      { id: 'sub_cancel', customerId: 'cus_test', userId: 'user', status: 'canceled', plan: 'premium', livemode: false },
      { id: 'sub_active', customerId: 'cus_other', userId: 'user', status: 'active', plan: 'premium', livemode: false },
    ],
  });
  assert.deepEqual(result, { decision: 'retain', plan: 'premium' });
  deliver(db, { ...event, plan: result.plan });
  assert.equal(db.prepare('SELECT plan FROM user_plans').get().plan, 'premium');
});
