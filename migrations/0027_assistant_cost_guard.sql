-- HEGEVA Assistant global cost guard.
-- Limits are configured server-side in provider cost units; no monetary estimate is stored.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assistant_cost_guard_buckets (
  period TEXT NOT NULL,
  budgetClass TEXT NOT NULL CHECK (budgetClass IN ('included','prepaid','emergency')),
  limitUnits INTEGER NOT NULL CHECK (limitUnits > 0),
  reservedUnits INTEGER NOT NULL DEFAULT 0 CHECK (reservedUnits >= 0),
  settledUnits INTEGER NOT NULL DEFAULT 0 CHECK (settledUnits >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (period, budgetClass)
);

CREATE TABLE IF NOT EXISTS assistant_cost_guard_reservations (
  operationId TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  fundingClass TEXT NOT NULL CHECK (fundingClass IN ('included','prepaid')),
  requestUnits INTEGER NOT NULL CHECK (requestUnits > 0),
  emergencyUnits INTEGER NOT NULL CHECK (emergencyUnits > 0),
  status TEXT NOT NULL CHECK (status IN ('reserved','settled','released')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assistant_cost_guard_period_status
  ON assistant_cost_guard_reservations(period, status, createdAt);

CREATE TRIGGER IF NOT EXISTS assistant_cost_guard_reserve
AFTER INSERT ON assistant_cost_guard_reservations
BEGIN
  UPDATE assistant_cost_guard_buckets
  SET reservedUnits = reservedUnits + NEW.requestUnits,
      updatedAt = NEW.updatedAt
  WHERE period = NEW.period AND budgetClass = NEW.fundingClass
    AND reservedUnits + settledUnits + NEW.requestUnits <= limitUnits;
  SELECT RAISE(ABORT, 'assistant funding budget exhausted') WHERE changes() = 0;

  UPDATE assistant_cost_guard_buckets
  SET reservedUnits = reservedUnits + NEW.emergencyUnits,
      updatedAt = NEW.updatedAt
  WHERE period = NEW.period AND budgetClass = 'emergency'
    AND reservedUnits + settledUnits + NEW.emergencyUnits <= limitUnits;
  SELECT RAISE(ABORT, 'assistant emergency budget exhausted') WHERE changes() = 0;
END;

CREATE TRIGGER IF NOT EXISTS assistant_cost_guard_settle
AFTER UPDATE OF status ON assistant_cost_guard_reservations
WHEN OLD.status = 'reserved' AND NEW.status IN ('settled','released')
BEGIN
  UPDATE assistant_cost_guard_buckets
  SET reservedUnits = CASE WHEN reservedUnits >= OLD.requestUnits THEN reservedUnits - OLD.requestUnits ELSE 0 END,
      settledUnits = CASE WHEN NEW.status = 'settled' THEN settledUnits + OLD.requestUnits ELSE settledUnits END,
      updatedAt = NEW.updatedAt
  WHERE period = OLD.period AND budgetClass = OLD.fundingClass;
  UPDATE assistant_cost_guard_buckets
  SET reservedUnits = CASE WHEN reservedUnits >= OLD.emergencyUnits THEN reservedUnits - OLD.emergencyUnits ELSE 0 END,
      settledUnits = CASE WHEN NEW.status = 'settled' THEN settledUnits + OLD.emergencyUnits ELSE settledUnits END,
      updatedAt = NEW.updatedAt
  WHERE period = OLD.period AND budgetClass = 'emergency';
END;
