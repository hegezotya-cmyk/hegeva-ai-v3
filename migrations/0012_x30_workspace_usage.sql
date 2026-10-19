-- Additive workspace-period X30 allowance. Existing Assistant/X20 counters are untouched.
ALTER TABLE x30_generation_operations ADD COLUMN workspaceLimit INTEGER NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS x30_workspace_usage (
  workspaceScope TEXT NOT NULL,
  period TEXT NOT NULL,
  x30Generations INTEGER NOT NULL DEFAULT 0 CHECK (x30Generations >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (workspaceScope, period)
);

-- Backfill only already-reserved X30 operations, capped conservatively.
INSERT INTO x30_workspace_usage (workspaceScope, period, x30Generations, createdAt, updatedAt)
SELECT workspaceScope, period,
       CASE WHEN COUNT(*) > 50 THEN 50 ELSE COUNT(*) END,
       MIN(createdAt), MAX(updatedAt)
FROM x30_generation_operations
WHERE reserved = 1
GROUP BY workspaceScope, period
ON CONFLICT(workspaceScope, period) DO NOTHING;

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

  INSERT INTO x30_workspace_usage(workspaceScope, period, x30Generations, createdAt, updatedAt)
  VALUES (NEW.workspaceScope, NEW.period, 1, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(workspaceScope, period)
  DO UPDATE SET x30Generations = x30Generations + 1, updatedAt = NEW.updatedAt
  WHERE x30Generations < NEW.workspaceLimit;
  SELECT RAISE(ABORT, 'workspace X30 generation allowance unavailable') WHERE changes() = 0;

  UPDATE x30_generation_operations SET reserved = 1, updatedAt = NEW.updatedAt
  WHERE operationId = NEW.operationId;
END;
