-- DRAFT ONLY. DO NOT APPLY without an owner-approved staging migration,
-- pre-change bookmark/backup, rollback proof, retention-policy review,
-- and isolated remote webhook acceptance. NEVER apply to production.
--
-- Tombstone records are created ONLY when an existing authenticated user
-- is actually deleted. Do not infer deletion from Stripe metadata alone.
CREATE TABLE IF NOT EXISTS hegeva_deleted_user_tombstones (
  userId TEXT PRIMARY KEY NOT NULL,
  deletedAt TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS hegeva_auth_user_deleted_plan_cleanup
AFTER DELETE ON "user"
BEGIN
  INSERT INTO hegeva_deleted_user_tombstones(userId,deletedAt)
    VALUES (OLD.id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(userId) DO NOTHING;
  DELETE FROM user_plans WHERE userId = OLD.id;
END;

-- A delayed webhook may not create or update entitlement or billing identity
-- after the auth account is gone. ABORT, never IGNORE: silent success could
-- incorrectly finalize an event as applied.
CREATE TRIGGER IF NOT EXISTS hegeva_user_plan_requires_auth_user
BEFORE INSERT ON user_plans
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-plan-auth-user-missing');
END;

CREATE TRIGGER IF NOT EXISTS hegeva_user_plan_update_requires_auth_user
BEFORE UPDATE ON user_plans
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-plan-auth-user-missing');
END;

CREATE TRIGGER IF NOT EXISTS hegeva_stripe_customer_requires_auth_user
BEFORE INSERT ON stripe_customers
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-billing-auth-user-missing');
END;

CREATE TRIGGER IF NOT EXISTS hegeva_stripe_customer_update_requires_auth_user
BEFORE UPDATE ON stripe_customers
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(ABORT, 'hegeva-billing-auth-user-missing');
END;
