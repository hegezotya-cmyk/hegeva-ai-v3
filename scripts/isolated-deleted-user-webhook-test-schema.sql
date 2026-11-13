-- OFFLINE/OWNER-APPROVED DISPOSABLE TEST ONLY. DO NOT APPLY AUTOMATICALLY.
-- Pinned Cloudflare account: HEGEVA Synthetic Tests only.
-- Pinned D1: hegeva-deleted-user-webhook-test-db,
-- 84f4c3b0-c175-4458-bad1-e3f826d6ea96.
-- NOT a Better Auth schema, NOT production or shared staging migrations.
-- Require new D1 pre-change bookmark and independently verified exact binding.
-- Contains no real user/Stripe records or secrets.
CREATE TABLE hegeva_isolated_webhook_test_identity (
  singleton INTEGER PRIMARY KEY CHECK (singleton=1),
  accountId TEXT NOT NULL,
  databaseId TEXT NOT NULL,
  version TEXT NOT NULL
);
INSERT INTO hegeva_isolated_webhook_test_identity
  (singleton,accountId,databaseId,version)
VALUES (1,'ab362645fc03b7e63a26fd8e46e631b6',
  '84f4c3b0-c175-4458-bad1-e3f826d6ea96','v1');

-- Only a minimal shape for test fixtures, not the HEGEVA application schema.
CREATE TABLE "user" (
  id TEXT PRIMARY KEY NOT NULL
);
CREATE TABLE user_plans (
  userId TEXT PRIMARY KEY NOT NULL,
  plan TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE stripe_customers (
  userId TEXT PRIMARY KEY NOT NULL,
  stripeCustomerId TEXT NOT NULL,
  stripeSubscriptionId TEXT,
  subscriptionStatus TEXT
);
CREATE TABLE stripe_webhook_events (
  eventId TEXT PRIMARY KEY NOT NULL,
  eventType TEXT NOT NULL,
  userId TEXT,
  plan TEXT,
  eventCreatedAt TEXT NOT NULL,
  processedAt TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('applied','ignored'))
);
CREATE TABLE hegeva_deleted_user_tombstones (
  userId TEXT PRIMARY KEY NOT NULL,
  deletedAt TEXT NOT NULL
);
CREATE TRIGGER hegeva_auth_user_deleted_plan_cleanup
AFTER DELETE ON "user"
BEGIN
  INSERT INTO hegeva_deleted_user_tombstones(userId,deletedAt)
    VALUES (OLD.id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(userId) DO NOTHING;
  DELETE FROM user_plans WHERE userId = OLD.id;
END;
CREATE TRIGGER hegeva_user_plan_requires_auth_user
BEFORE INSERT ON user_plans
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-plan-auth-user-missing');
END;
CREATE TRIGGER hegeva_user_plan_update_requires_auth_user
BEFORE UPDATE ON user_plans
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-plan-auth-user-missing');
END;
CREATE TRIGGER hegeva_stripe_customer_requires_auth_user
BEFORE INSERT ON stripe_customers
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-billing-auth-user-missing');
END;
CREATE TRIGGER hegeva_stripe_customer_update_requires_auth_user
BEFORE UPDATE ON stripe_customers
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-billing-auth-user-missing');
END;
