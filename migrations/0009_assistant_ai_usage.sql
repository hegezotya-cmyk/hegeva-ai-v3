-- HEGEVA Assistant-only monthly usage and idempotent operation accounting
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assistant_ai_usage (
  userId TEXT NOT NULL,
  period TEXT NOT NULL,
  aiMessages INTEGER NOT NULL DEFAULT 0 CHECK (aiMessages >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (userId, period)
);

CREATE INDEX IF NOT EXISTS idx_assistant_ai_usage_user
  ON assistant_ai_usage(userId);

CREATE TABLE IF NOT EXISTS assistant_operations (
  operationId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  period TEXT NOT NULL,
  planLimit INTEGER NOT NULL CHECK (planLimit BETWEEN 1 AND 1000000),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'succeeded', 'failed', 'timed_out')),
  operationExpiresAt TEXT NOT NULL,
  purgeAfter TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (userId, operationId)
);

CREATE INDEX IF NOT EXISTS idx_assistant_operations_user_period
  ON assistant_operations(userId, period);
CREATE INDEX IF NOT EXISTS idx_assistant_operations_expiry
  ON assistant_operations(operationExpiresAt);
CREATE INDEX IF NOT EXISTS idx_assistant_operations_purge
  ON assistant_operations(purgeAfter);

CREATE TRIGGER IF NOT EXISTS assistant_reserve_user_quota
AFTER INSERT ON assistant_operations
WHEN NEW.reserved = 0
BEGIN
  INSERT INTO assistant_ai_usage(userId, period, aiMessages, createdAt, updatedAt)
  VALUES (NEW.userId, NEW.period, 1, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(userId, period)
  DO UPDATE SET aiMessages = aiMessages + 1, updatedAt = NEW.updatedAt
  WHERE aiMessages < NEW.planLimit;

  SELECT RAISE(ABORT, 'assistant monthly quota unavailable')
  WHERE changes() = 0;

  UPDATE assistant_operations
  SET reserved = 1, updatedAt = NEW.updatedAt
  WHERE operationId = NEW.operationId;
END;
