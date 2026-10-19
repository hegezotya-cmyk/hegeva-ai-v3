-- Authoritative prepaid Assistant top-up purchase lots.
PRAGMA foreign_keys = ON;
ALTER TABLE assistant_topup_purchases ADD COLUMN stripeChargeId TEXT;
ALTER TABLE assistant_topup_operations ADD COLUMN lotId TEXT;
CREATE TABLE IF NOT EXISTS assistant_topup_credit_lots (
  lotId TEXT PRIMARY KEY, purchaseId TEXT NOT NULL UNIQUE, userId TEXT NOT NULL,
  stripeCheckoutSessionId TEXT NOT NULL UNIQUE, stripePaymentIntentId TEXT, stripeChargeId TEXT,
  packCode TEXT NOT NULL, originalCredits INTEGER NOT NULL CHECK (originalCredits > 0),
  remainingCredits INTEGER NOT NULL DEFAULT 0 CHECK (remainingCredits >= 0),
  reservedCredits INTEGER NOT NULL DEFAULT 0 CHECK (reservedCredits >= 0),
  consumedCredits INTEGER NOT NULL DEFAULT 0 CHECK (consumedCredits >= 0),
  revokedCredits INTEGER NOT NULL DEFAULT 0 CHECK (revokedCredits >= 0),
  paymentState TEXT NOT NULL DEFAULT 'paid' CHECK (paymentState IN ('paid','refund-pending','refunded','disputed','reconciliation-required')),
  reconciliationRequired INTEGER NOT NULL DEFAULT 0 CHECK (reconciliationRequired IN (0,1)),
  createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
  CHECK (originalCredits = remainingCredits + reservedCredits + consumedCredits + revokedCredits)
);
CREATE INDEX IF NOT EXISTS idx_assistant_topup_lots_user_fifo ON assistant_topup_credit_lots(userId, paymentState, createdAt, lotId);
CREATE INDEX IF NOT EXISTS idx_assistant_topup_lots_user_state ON assistant_topup_credit_lots(userId, reconciliationRequired, updatedAt);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assistant_topup_lots_payment_intent ON assistant_topup_credit_lots(stripePaymentIntentId) WHERE stripePaymentIntentId IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_assistant_topup_lots_charge ON assistant_topup_credit_lots(stripeChargeId) WHERE stripeChargeId IS NOT NULL;
CREATE TABLE IF NOT EXISTS assistant_topup_financial_events (
  eventKey TEXT PRIMARY KEY, eventId TEXT NOT NULL UNIQUE, lotId TEXT NOT NULL, purchaseId TEXT NOT NULL,
  eventType TEXT NOT NULL CHECK (eventType IN ('refund','dispute_created','dispute_updated','dispute_closed')),
  eventState TEXT NOT NULL, amount INTEGER, currency TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assistant_topup_financial_events_lot ON assistant_topup_financial_events(lotId, createdAt);
CREATE TRIGGER IF NOT EXISTS assistant_topup_lot_reserve_credit
AFTER INSERT ON assistant_topup_operations WHEN NEW.status = 'reserved' AND NEW.lotId IS NOT NULL BEGIN
  UPDATE assistant_topup_credit_lots SET remainingCredits=remainingCredits-NEW.credits, reservedCredits=reservedCredits+NEW.credits, updatedAt=NEW.updatedAt
   WHERE lotId=NEW.lotId AND userId=NEW.userId AND remainingCredits>=NEW.credits AND paymentState='paid';
  SELECT RAISE(ABORT,'assistant topup lot unavailable') WHERE changes()=0;
END;
CREATE TRIGGER IF NOT EXISTS assistant_topup_lot_settle_success
AFTER UPDATE OF status ON assistant_topup_operations WHEN OLD.status='reserved' AND NEW.status='succeeded' AND NEW.lotId IS NOT NULL BEGIN
  UPDATE assistant_topup_credit_lots SET reservedCredits=reservedCredits-NEW.credits, consumedCredits=consumedCredits+NEW.credits, updatedAt=NEW.updatedAt
   WHERE lotId=NEW.lotId AND userId=NEW.userId AND reservedCredits>=NEW.credits;
  SELECT RAISE(ABORT,'assistant topup lot settlement unavailable') WHERE changes()=0;
END;
CREATE TRIGGER IF NOT EXISTS assistant_topup_lot_settle_failure
AFTER UPDATE OF status ON assistant_topup_operations WHEN OLD.status='reserved' AND NEW.status IN ('failed','timed_out') AND NEW.lotId IS NOT NULL BEGIN
  UPDATE assistant_topup_credit_lots SET reservedCredits=reservedCredits-NEW.credits,
    remainingCredits=remainingCredits+CASE WHEN paymentState='paid' THEN NEW.credits ELSE 0 END,
    revokedCredits=revokedCredits+CASE WHEN paymentState='paid' THEN 0 ELSE NEW.credits END, updatedAt=NEW.updatedAt
   WHERE lotId=NEW.lotId AND userId=NEW.userId AND reservedCredits>=NEW.credits;
  SELECT RAISE(ABORT,'assistant topup lot failure settlement unavailable') WHERE changes()=0;
  UPDATE assistant_topup_wallets
   SET availableCredits=CASE WHEN (SELECT paymentState FROM assistant_topup_credit_lots WHERE lotId=NEW.lotId)='paid' THEN availableCredits ELSE CASE WHEN availableCredits>=NEW.credits THEN availableCredits-NEW.credits ELSE 0 END END,
       refundedCredits=refundedCredits+CASE WHEN (SELECT paymentState FROM assistant_topup_credit_lots WHERE lotId=NEW.lotId)='paid' THEN 0 ELSE NEW.credits END,
       updatedAt=NEW.updatedAt
   WHERE userId=NEW.userId;
END;

-- Replace the pooled refund trigger so a revoked/refund-pending lot cannot be
-- returned to the spendable wallet when its in-flight operation settles.
DROP TRIGGER IF EXISTS assistant_topup_refund_failed_credit;
CREATE TRIGGER assistant_topup_refund_failed_credit
AFTER UPDATE OF status ON assistant_topup_operations
WHEN OLD.status='reserved' AND NEW.status IN ('failed','timed_out')
  AND COALESCE((SELECT paymentState FROM assistant_topup_credit_lots WHERE lotId=NEW.lotId),'paid')='paid'
BEGIN
  UPDATE assistant_topup_wallets
  SET availableCredits=availableCredits+OLD.credits,
      consumedCredits=CASE WHEN consumedCredits>=OLD.credits THEN consumedCredits-OLD.credits ELSE 0 END,
      refundedCredits=refundedCredits+OLD.credits,
      updatedAt=NEW.updatedAt
  WHERE userId=NEW.userId;
END;
