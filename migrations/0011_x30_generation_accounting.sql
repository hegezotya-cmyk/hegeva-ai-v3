-- Independent X30 generation accounting. No legacy Assistant or X20 data is copied.
CREATE TABLE IF NOT EXISTS x30_ai_usage (
  userId TEXT NOT NULL,
  workspaceScope TEXT NOT NULL,
  period TEXT NOT NULL,
  x30Generations INTEGER NOT NULL DEFAULT 0 CHECK (x30Generations >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (userId, workspaceScope, period)
);

CREATE TABLE IF NOT EXISTS x30_ai_daily_usage (
  userId TEXT NOT NULL,
  workspaceScope TEXT NOT NULL,
  day TEXT NOT NULL,
  x30Generations INTEGER NOT NULL DEFAULT 0 CHECK (x30Generations >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (userId, workspaceScope, day)
);

CREATE TABLE IF NOT EXISTS x30_generation_operations (
  operationId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  workspaceScope TEXT NOT NULL,
  period TEXT NOT NULL,
  planLimit INTEGER NOT NULL,
  dailyLimit INTEGER NOT NULL,
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved IN (0, 1)),
  status TEXT NOT NULL,
  operationExpiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_x30_generation_user_period
  ON x30_generation_operations(userId, operationId);

DROP TRIGGER IF EXISTS x30_reserve_generation;
CREATE TRIGGER x30_reserve_generation
AFTER INSERT ON x30_generation_operations
WHEN NEW.reserved = 0 AND NEW.status = 'reserved'
BEGIN
  INSERT INTO x30_ai_daily_usage(userId, workspaceScope, day, x30Generations, createdAt, updatedAt)
  VALUES (NEW.userId, NEW.workspaceScope, substr(NEW.createdAt, 1, 10), 1, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(userId, workspaceScope, day)
  DO UPDATE SET x30Generations = x30Generations + 1, updatedAt = NEW.updatedAt
  WHERE x30Generations < NEW.dailyLimit;
  SELECT RAISE(ABORT, 'daily X30 generation allowance unavailable') WHERE changes() = 0;

  INSERT INTO x30_ai_usage(userId, workspaceScope, period, x30Generations, createdAt, updatedAt)
  VALUES (NEW.userId, NEW.workspaceScope, NEW.period, 1, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(userId, workspaceScope, period)
  DO UPDATE SET x30Generations = x30Generations + 1, updatedAt = NEW.updatedAt
  WHERE x30Generations < NEW.planLimit;
  SELECT RAISE(ABORT, 'monthly X30 generation allowance unavailable') WHERE changes() = 0;

  UPDATE x30_generation_operations SET reserved = 1, updatedAt = NEW.updatedAt
  WHERE operationId = NEW.operationId;
END;
