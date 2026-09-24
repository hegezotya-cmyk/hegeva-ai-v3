-- HEGEVA Assistant prepaid Top-Up credit ledger.
-- Credits are granted only after a verified Stripe payment webhook.
-- No prompt, response, card, or credential data is stored here.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assistant_topup_wallets (
  userId TEXT PRIMARY KEY,
  availableCredits INTEGER NOT NULL DEFAULT 0 CHECK (availableCredits >= 0),
  purchasedCredits INTEGER NOT NULL DEFAULT 0 CHECK (purchasedCredits >= 0),
  consumedCredits INTEGER NOT NULL DEFAULT 0 CHECK (consumedCredits >= 0),
  refundedCredits INTEGER NOT NULL DEFAULT 0 CHECK (refundedCredits >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assistant_topup_purchases (
  purchaseId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  stripeCheckoutSessionId TEXT NOT NULL UNIQUE,
  stripePaymentIntentId TEXT,
  packCode TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  amountTotal INTEGER NOT NULL CHECK (amountTotal >= 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid','refunded','disputed')),
  stripeEventId TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assistant_topup_purchases_user_created
  ON assistant_topup_purchases(userId, createdAt);

CREATE TABLE IF NOT EXISTS assistant_topup_operations (
  operationId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  purchaseSource TEXT NOT NULL DEFAULT 'prepaid-topup',
  credits INTEGER NOT NULL DEFAULT 1 CHECK (credits = 1),
  status TEXT NOT NULL CHECK (status IN ('reserved','succeeded','failed','timed_out')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS assistant_topup_reserve_credit
AFTER INSERT ON assistant_topup_operations
WHEN NEW.status = 'reserved'
BEGIN
  UPDATE assistant_topup_wallets
  SET availableCredits = availableCredits - NEW.credits,
      consumedCredits = consumedCredits + NEW.credits,
      updatedAt = NEW.updatedAt
  WHERE userId = NEW.userId
    AND availableCredits >= NEW.credits;

  SELECT RAISE(ABORT, 'assistant topup credit unavailable')
  WHERE changes() = 0;
END;

CREATE TRIGGER IF NOT EXISTS assistant_topup_refund_failed_credit
AFTER UPDATE OF status ON assistant_topup_operations
WHEN OLD.status = 'reserved' AND NEW.status IN ('failed','timed_out')
BEGIN
  UPDATE assistant_topup_wallets
  SET availableCredits = availableCredits + OLD.credits,
      consumedCredits = CASE WHEN consumedCredits >= OLD.credits THEN consumedCredits - OLD.credits ELSE 0 END,
      refundedCredits = refundedCredits + OLD.credits,
      updatedAt = NEW.updatedAt
  WHERE userId = NEW.userId;
END;
