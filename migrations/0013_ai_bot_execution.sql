-- Additive AI Bot execution ledger. Applied only after owner-approved review.
CREATE TABLE IF NOT EXISTS ai_bot_usage (
  userId TEXT NOT NULL CHECK (length(userId) BETWEEN 1 AND 128),
  period TEXT NOT NULL CHECK (length(period) = 7 AND period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  executions INTEGER NOT NULL DEFAULT 0 CHECK (executions >= 0 AND executions <= 1000000),
  createdAt TEXT NOT NULL CHECK (length(createdAt) BETWEEN 20 AND 40),
  updatedAt TEXT NOT NULL CHECK (length(updatedAt) BETWEEN 20 AND 40),
  PRIMARY KEY (userId, period)
);

CREATE TABLE IF NOT EXISTS ai_bot_operations (
  operationId TEXT PRIMARY KEY CHECK (length(operationId) BETWEEN 36 AND 64),
  userId TEXT NOT NULL CHECK (length(userId) BETWEEN 1 AND 128),
  workspaceScope TEXT NOT NULL CHECK (length(workspaceScope) BETWEEN 1 AND 128),
  profileId TEXT NOT NULL CHECK (length(profileId) BETWEEN 5 AND 100),
  period TEXT NOT NULL CHECK (length(period) = 7 AND period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  status TEXT NOT NULL CHECK (status IN ('reserved','succeeded','rejected','failed','cancelled')),
  attemptNumber INTEGER NOT NULL DEFAULT 0 CHECK (attemptNumber BETWEEN 0 AND 1),
  approvedAt TEXT NOT NULL CHECK (length(approvedAt) BETWEEN 20 AND 40),
  approvalExpiresAt TEXT NOT NULL CHECK (length(approvalExpiresAt) BETWEEN 20 AND 40),
  approvalVersion INTEGER NOT NULL CHECK (approvalVersion BETWEEN 1 AND 1000000),
  approvedByActorHash TEXT NOT NULL CHECK (length(approvedByActorHash) BETWEEN 16 AND 128),
  usageLimit INTEGER NOT NULL CHECK (usageLimit BETWEEN 1 AND 1000000),
  createdAt TEXT NOT NULL CHECK (length(createdAt) BETWEEN 20 AND 40),
  updatedAt TEXT NOT NULL CHECK (length(updatedAt) BETWEEN 20 AND 40)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_bot_operations_owner_operation ON ai_bot_operations(userId, operationId);

CREATE TABLE IF NOT EXISTS ai_bot_execution_history (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 128),
  operationId TEXT NOT NULL CHECK (length(operationId) BETWEEN 36 AND 64),
  userId TEXT NOT NULL CHECK (length(userId) BETWEEN 1 AND 128),
  workspaceScope TEXT NOT NULL CHECK (length(workspaceScope) BETWEEN 1 AND 128),
  profileId TEXT NOT NULL CHECK (length(profileId) BETWEEN 5 AND 100),
  status TEXT NOT NULL CHECK (status IN ('succeeded','rejected','failed','cancelled')),
  failureCode TEXT CHECK (failureCode IS NULL OR length(failureCode) BETWEEN 1 AND 64),
  attemptNumber INTEGER NOT NULL CHECK (attemptNumber BETWEEN 0 AND 1),
  createdAt TEXT NOT NULL CHECK (length(createdAt) BETWEEN 20 AND 40),
  retentionUntil TEXT NOT NULL CHECK (length(retentionUntil) BETWEEN 20 AND 40),
  FOREIGN KEY (operationId) REFERENCES ai_bot_operations(operationId) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_ai_bot_history_owner_period ON ai_bot_execution_history(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_ai_bot_history_operation_time ON ai_bot_execution_history(operationId, createdAt);
CREATE INDEX IF NOT EXISTS idx_ai_bot_history_retention ON ai_bot_execution_history(retentionUntil);
CREATE INDEX IF NOT EXISTS idx_ai_bot_operations_status ON ai_bot_operations(userId, status, updatedAt);

CREATE TRIGGER IF NOT EXISTS ai_bot_reserve_usage
AFTER INSERT ON ai_bot_operations
WHEN NEW.status = 'reserved'
BEGIN
  INSERT INTO ai_bot_usage(userId, period, executions, createdAt, updatedAt)
  VALUES (NEW.userId, NEW.period, 1, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(userId, period) DO UPDATE SET executions = executions + 1, updatedAt = NEW.updatedAt
    WHERE executions < NEW.usageLimit;
  SELECT RAISE(ABORT, 'AI Bot allowance unavailable') WHERE changes() = 0;
END;

CREATE TRIGGER IF NOT EXISTS ai_bot_history_no_update
BEFORE UPDATE ON ai_bot_execution_history
BEGIN
  SELECT RAISE(ABORT, 'AI Bot execution history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS ai_bot_history_no_delete
BEFORE DELETE ON ai_bot_execution_history
BEGIN
  SELECT RAISE(ABORT, 'AI Bot execution history is append-only');
END;
