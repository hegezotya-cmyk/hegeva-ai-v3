-- Atomic UTC-day Assistant admission. This ledger is independent of customer
-- credits: it bounds HEGEVA's provider exposure before any provider dispatch.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assistant_daily_model_buckets (
  day TEXT PRIMARY KEY,
  requestLimit INTEGER NOT NULL CHECK (requestLimit > 0),
  neuronLimit INTEGER NOT NULL CHECK (neuronLimit > 0),
  reservedRequests INTEGER NOT NULL DEFAULT 0 CHECK (reservedRequests >= 0),
  settledRequests INTEGER NOT NULL DEFAULT 0 CHECK (settledRequests >= 0),
  reservedNeurons INTEGER NOT NULL DEFAULT 0 CHECK (reservedNeurons >= 0),
  settledNeurons INTEGER NOT NULL DEFAULT 0 CHECK (settledNeurons >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assistant_daily_model_reservations (
  operationId TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('standard','advanced')),
  reservedNeurons INTEGER NOT NULL CHECK (reservedNeurons > 0),
  settledNeurons INTEGER NOT NULL CHECK (settledNeurons >= 0),
  status TEXT NOT NULL CHECK (status IN ('reserved','settled','released')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assistant_daily_model_reservations_day_status
  ON assistant_daily_model_reservations(day, status, createdAt);

CREATE TRIGGER IF NOT EXISTS assistant_daily_model_reserve
AFTER INSERT ON assistant_daily_model_reservations
BEGIN
  UPDATE assistant_daily_model_buckets
  SET reservedRequests = reservedRequests + 1,
      reservedNeurons = reservedNeurons + NEW.reservedNeurons,
      updatedAt = NEW.updatedAt
  WHERE day = NEW.day
    AND reservedRequests + settledRequests + 1 <= requestLimit
    AND reservedNeurons + settledNeurons + NEW.reservedNeurons <= neuronLimit;
  SELECT RAISE(ABORT, 'assistant daily capacity exhausted') WHERE changes() = 0;
END;

CREATE TRIGGER IF NOT EXISTS assistant_daily_model_settle
AFTER UPDATE OF status ON assistant_daily_model_reservations
WHEN OLD.status = 'reserved' AND NEW.status IN ('settled','released')
BEGIN
  UPDATE assistant_daily_model_buckets
  SET reservedRequests = CASE WHEN reservedRequests > 0 THEN reservedRequests - 1 ELSE 0 END,
      settledRequests = CASE WHEN NEW.status = 'settled' THEN settledRequests + 1 ELSE settledRequests END,
      reservedNeurons = CASE WHEN reservedNeurons >= OLD.reservedNeurons THEN reservedNeurons - OLD.reservedNeurons ELSE 0 END,
      settledNeurons = CASE WHEN NEW.status = 'settled' THEN settledNeurons + NEW.settledNeurons ELSE settledNeurons END,
      updatedAt = NEW.updatedAt
  WHERE day = OLD.day;
END;
