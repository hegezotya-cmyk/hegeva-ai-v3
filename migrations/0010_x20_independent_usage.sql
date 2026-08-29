-- Dedicated monthly X20 allowance; legacy ai_usage is intentionally untouched.
CREATE TABLE IF NOT EXISTS x20_ai_usage (
  userId TEXT NOT NULL,
  period TEXT NOT NULL,
  x20Actions INTEGER NOT NULL DEFAULT 0 CHECK (x20Actions >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (userId, period)
);

CREATE INDEX IF NOT EXISTS idx_x20_ai_usage_user ON x20_ai_usage(userId);

-- Backfill only retained, already-reserved X20 actions. Legacy and Assistant
-- counters are never copied; rerunning leaves existing rows intact.
INSERT INTO x20_ai_usage (userId, period, x20Actions, createdAt, updatedAt)
SELECT userId, period, CASE WHEN COUNT(*) > 1000 THEN 1000 ELSE COUNT(*) END,
       MIN(createdAt), MAX(updatedAt)
FROM x20_request_ledger
WHERE userReserved = 1
GROUP BY userId, period
ON CONFLICT(userId, period) DO NOTHING;

DROP TRIGGER IF EXISTS x20_reserve_user_quota;
CREATE TRIGGER x20_reserve_user_quota
AFTER INSERT ON x20_request_ledger
WHEN NEW.userReserved = 0
BEGIN
  INSERT INTO x20_ai_usage(userId, period, x20Actions, createdAt, updatedAt)
  VALUES (NEW.userId, NEW.period, 1, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(userId, period)
  DO UPDATE SET x20Actions = x20Actions + 1, updatedAt = NEW.updatedAt
  WHERE x20Actions < NEW.planLimit;

  SELECT RAISE(ABORT, 'monthly quota unavailable') WHERE changes() = 0;

  UPDATE x20_request_ledger
  SET userReserved = 1, updatedAt = NEW.updatedAt
  WHERE actionId = NEW.actionId;
END;
