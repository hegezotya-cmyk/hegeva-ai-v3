-- PROPOSAL ONLY: DO NOT APPLY as a migration without separate owner approval.
-- A staging-only candidate; it deliberately does not backfill/delete existing orphans.
-- Preserve Stripe audit/event rows; prevent new paid plan rows for deleted auth users.
CREATE TRIGGER IF NOT EXISTS hegeva_auth_user_deleted_plan_cleanup
AFTER DELETE ON "user"
BEGIN
  DELETE FROM user_plans WHERE userId = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS hegeva_user_plan_requires_auth_user
BEFORE INSERT ON user_plans
WHEN NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId)
BEGIN
  SELECT RAISE(IGNORE);
END;
