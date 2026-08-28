-- HEGEVA X20 action and provider-attempt accounting
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS x20_request_ledger (
  actionId TEXT PRIMARY KEY,
  startRequestId TEXT NOT NULL,
  userId TEXT NOT NULL,
  period TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind = 'x20'),
  planLimit INTEGER NOT NULL CHECK (planLimit IN (50, 300, 1000)),
  userReserved INTEGER NOT NULL DEFAULT 0 CHECK (userReserved IN (0, 1)),
  providerCalls INTEGER NOT NULL DEFAULT 0 CHECK (providerCalls BETWEEN 0 AND 3),
  status TEXT NOT NULL CHECK (status IN ('active', 'succeeded', 'failed', 'timed_out', 'rejected', 'expired')),
  actionExpiresAt TEXT NOT NULL,
  purgeAfter TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (userId, startRequestId)
);

CREATE INDEX IF NOT EXISTS idx_x20_ledger_user_period ON x20_request_ledger(userId, period);
CREATE INDEX IF NOT EXISTS idx_x20_ledger_expiry ON x20_request_ledger(actionExpiresAt);
CREATE INDEX IF NOT EXISTS idx_x20_ledger_purge ON x20_request_ledger(purgeAfter);

CREATE TABLE IF NOT EXISTS x20_provider_attempts (
  attemptId TEXT PRIMARY KEY,
  attemptRequestId TEXT NOT NULL,
  actionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  period TEXT NOT NULL,
  attemptNumber INTEGER NOT NULL CHECK (attemptNumber BETWEEN 1 AND 3),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'succeeded', 'failed', 'timed_out')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (actionId, attemptRequestId),
  UNIQUE (actionId, attemptNumber),
  FOREIGN KEY (actionId) REFERENCES x20_request_ledger(actionId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_x20_attempts_action ON x20_provider_attempts(actionId);
CREATE INDEX IF NOT EXISTS idx_x20_attempts_user_period ON x20_provider_attempts(userId, period);

CREATE TRIGGER IF NOT EXISTS x20_reserve_user_quota
AFTER INSERT ON x20_request_ledger
WHEN NEW.userReserved = 0
BEGIN
  INSERT INTO ai_usage(userId, period, aiMessages, createdAt, updatedAt)
  VALUES (NEW.userId, NEW.period, 1, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(userId, period)
  DO UPDATE SET aiMessages = aiMessages + 1, updatedAt = NEW.updatedAt
  WHERE aiMessages < NEW.planLimit;

  SELECT CASE WHEN changes() = 0 THEN RAISE(ABORT, 'monthly quota unavailable') END;

  UPDATE x20_request_ledger
  SET userReserved = 1, updatedAt = NEW.updatedAt
  WHERE actionId = NEW.actionId;
END;

CREATE TRIGGER IF NOT EXISTS x20_validate_attempt
BEFORE INSERT ON x20_provider_attempts
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM x20_request_ledger
    WHERE actionId = NEW.actionId
      AND userId = NEW.userId
      AND period = NEW.period
      AND userReserved = 1
      AND kind = 'x20'
      AND actionExpiresAt > NEW.createdAt
      AND providerCalls < 3
  ) THEN RAISE(ABORT, 'x20 action unavailable') END;
END;

CREATE TRIGGER IF NOT EXISTS x20_count_attempt
AFTER INSERT ON x20_provider_attempts
BEGIN
  UPDATE x20_request_ledger
  SET providerCalls = providerCalls + 1, updatedAt = NEW.updatedAt
  WHERE actionId = NEW.actionId AND providerCalls < 3;
END;
