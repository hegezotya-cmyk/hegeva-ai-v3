PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS creative_credit_accounts (
  userId TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  plan TEXT NOT NULL CHECK (plan IN ('premium','pro')),
  allowance INTEGER NOT NULL CHECK (allowance >= 0),
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (userId, period),
  CHECK (used + reserved <= allowance)
);

CREATE TABLE IF NOT EXISTS creative_credit_operations (
  operationId TEXT PRIMARY KEY CHECK (length(operationId) BETWEEN 36 AND 64),
  requestId TEXT NOT NULL UNIQUE CHECK (length(requestId) BETWEEN 36 AND 64),
  userId TEXT NOT NULL,
  period TEXT NOT NULL,
  operationType TEXT NOT NULL CHECK (operationType IN ('analysis','copy','image','video')),
  reservedCredits INTEGER NOT NULL CHECK (reservedCredits > 0),
  settledCredits INTEGER CHECK (settledCredits IS NULL OR settledCredits BETWEEN 0 AND reservedCredits),
  providerClass TEXT NOT NULL CHECK (providerClass IN ('workers-ai-text','approved-image-provider','approved-video-provider')),
  status TEXT NOT NULL CHECK (status IN ('reserved','succeeded','failed','released')),
  failureCode TEXT CHECK (failureCode IS NULL OR length(failureCode) BETWEEN 1 AND 64),
  createdAt TEXT NOT NULL,
  completedAt TEXT,
  FOREIGN KEY (userId, period) REFERENCES creative_credit_accounts(userId, period) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_creative_credit_scope ON creative_credit_operations(userId, period, status);

CREATE TRIGGER IF NOT EXISTS creative_credit_admission
BEFORE INSERT ON creative_credit_operations
BEGIN
  SELECT RAISE(ABORT, 'creative entitlement required') WHERE NOT EXISTS (
    SELECT 1 FROM creative_credit_accounts a WHERE a.userId=NEW.userId AND a.period=NEW.period AND a.plan IN ('premium','pro')
  );
  SELECT RAISE(ABORT, 'creative credits exhausted') WHERE NOT EXISTS (
    SELECT 1 FROM creative_credit_accounts a WHERE a.userId=NEW.userId AND a.period=NEW.period AND a.used+a.reserved+NEW.reservedCredits<=a.allowance
  );
END;

CREATE TRIGGER IF NOT EXISTS creative_credit_reserve
AFTER INSERT ON creative_credit_operations
BEGIN
  UPDATE creative_credit_accounts SET reserved=reserved+NEW.reservedCredits,updatedAt=NEW.createdAt WHERE userId=NEW.userId AND period=NEW.period;
END;

CREATE TRIGGER IF NOT EXISTS creative_credit_transition
BEFORE UPDATE OF status ON creative_credit_operations
WHEN OLD.status <> 'reserved' OR NEW.status NOT IN ('succeeded','failed','released')
BEGIN SELECT RAISE(ABORT, 'invalid creative credit transition'); END;

CREATE TRIGGER IF NOT EXISTS creative_credit_settle
AFTER UPDATE OF status ON creative_credit_operations
WHEN OLD.status='reserved' AND NEW.status='succeeded'
BEGIN
  UPDATE creative_credit_accounts SET reserved=reserved-OLD.reservedCredits,used=used+NEW.settledCredits,updatedAt=NEW.completedAt WHERE userId=NEW.userId AND period=NEW.period;
END;

CREATE TRIGGER IF NOT EXISTS creative_credit_release
AFTER UPDATE OF status ON creative_credit_operations
WHEN OLD.status='reserved' AND NEW.status IN ('failed','released')
BEGIN
  UPDATE creative_credit_accounts SET reserved=reserved-OLD.reservedCredits,updatedAt=NEW.completedAt WHERE userId=NEW.userId AND period=NEW.period;
END;

CREATE TRIGGER IF NOT EXISTS creative_credit_terminal_immutable
BEFORE UPDATE ON creative_credit_operations
WHEN OLD.status <> 'reserved'
BEGIN SELECT RAISE(ABORT, 'terminal creative credit operation is immutable'); END;

CREATE TRIGGER IF NOT EXISTS creative_credit_no_delete
BEFORE DELETE ON creative_credit_operations
BEGIN SELECT RAISE(ABORT, 'creative credit audit is append-only'); END;
