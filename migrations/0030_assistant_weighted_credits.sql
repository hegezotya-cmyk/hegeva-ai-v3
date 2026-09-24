-- Weighted Assistant credits. Tier cost is server-authoritative and each
-- reservation/refund remains an indivisible, exact-once ledger transition.
PRAGMA foreign_keys = OFF;

ALTER TABLE assistant_operations ADD COLUMN creditCost INTEGER NOT NULL DEFAULT 1 CHECK (creditCost > 0);
DROP TRIGGER IF EXISTS assistant_refund_reserved_message_once;
CREATE TRIGGER assistant_refund_reserved_message_once
AFTER UPDATE OF quotaSettlementState ON assistant_usage_settlements
WHEN OLD.quotaSettlementState = 'reserved' AND NEW.quotaSettlementState = 'refunded'
BEGIN
  SELECT RAISE(ABORT, 'assistant quota refund target missing') WHERE NOT EXISTS (
    SELECT 1 FROM assistant_operations operation JOIN assistant_ai_usage usage ON usage.userId = operation.userId AND usage.period = operation.period
    WHERE operation.operationId = NEW.operationId AND operation.reserved = 1
  );
  UPDATE assistant_ai_usage SET aiMessages = CASE WHEN aiMessages >= (SELECT creditCost FROM assistant_operations WHERE operationId=NEW.operationId)
      THEN aiMessages-(SELECT creditCost FROM assistant_operations WHERE operationId=NEW.operationId) ELSE 0 END,updatedAt=NEW.updatedAt
  WHERE EXISTS (SELECT 1 FROM assistant_operations operation WHERE operation.operationId=NEW.operationId AND operation.userId=assistant_ai_usage.userId AND operation.period=assistant_ai_usage.period AND operation.reserved=1);
END;
DROP TRIGGER IF EXISTS assistant_reserve_user_quota;
CREATE TRIGGER assistant_reserve_user_quota
AFTER INSERT ON assistant_operations
WHEN NEW.reserved = 0
BEGIN
  INSERT INTO assistant_ai_usage(userId, period, aiMessages, createdAt, updatedAt)
  VALUES (NEW.userId, NEW.period, NEW.creditCost, NEW.createdAt, NEW.updatedAt)
  ON CONFLICT(userId, period)
  DO UPDATE SET aiMessages = aiMessages + NEW.creditCost, updatedAt = NEW.updatedAt
  WHERE aiMessages + NEW.creditCost <= NEW.planLimit;
  SELECT RAISE(ABORT, 'assistant monthly quota unavailable') WHERE changes() = 0;
  UPDATE assistant_operations SET reserved = 1, updatedAt = NEW.updatedAt WHERE operationId = NEW.operationId;
END;

DROP TRIGGER IF EXISTS assistant_topup_lot_reserve_credit;
DROP TRIGGER IF EXISTS assistant_topup_lot_settle_success;
DROP TRIGGER IF EXISTS assistant_topup_lot_settle_failure;
DROP TRIGGER IF EXISTS assistant_topup_refund_failed_credit;
CREATE TABLE assistant_topup_operations_weighted (
  operationId TEXT PRIMARY KEY, userId TEXT NOT NULL,
  purchaseSource TEXT NOT NULL DEFAULT 'prepaid-topup',
  credits INTEGER NOT NULL DEFAULT 1 CHECK (credits > 0),
  status TEXT NOT NULL CHECK (status IN ('reserved','succeeded','failed','timed_out')),
  createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, lotId TEXT
);
INSERT INTO assistant_topup_operations_weighted(operationId,userId,purchaseSource,credits,status,createdAt,updatedAt,lotId)
  SELECT operationId,userId,purchaseSource,credits,status,createdAt,updatedAt,lotId FROM assistant_topup_operations;
DROP TABLE assistant_topup_operations;
ALTER TABLE assistant_topup_operations_weighted RENAME TO assistant_topup_operations;

CREATE TRIGGER assistant_topup_reserve_credit
AFTER INSERT ON assistant_topup_operations WHEN NEW.status = 'reserved'
BEGIN
  UPDATE assistant_topup_wallets SET availableCredits=availableCredits-NEW.credits,consumedCredits=consumedCredits+NEW.credits,updatedAt=NEW.updatedAt
   WHERE userId=NEW.userId AND availableCredits>=NEW.credits;
  SELECT RAISE(ABORT,'assistant topup credit unavailable') WHERE changes()=0;
END;
CREATE TRIGGER assistant_topup_lot_reserve_credit
AFTER INSERT ON assistant_topup_operations WHEN NEW.status = 'reserved' AND NEW.lotId IS NOT NULL BEGIN
  UPDATE assistant_topup_credit_lots SET remainingCredits=remainingCredits-NEW.credits,reservedCredits=reservedCredits+NEW.credits,updatedAt=NEW.updatedAt
   WHERE lotId=NEW.lotId AND userId=NEW.userId AND remainingCredits>=NEW.credits AND paymentState='paid';
  SELECT RAISE(ABORT,'assistant topup lot unavailable') WHERE changes()=0;
END;
CREATE TRIGGER assistant_topup_lot_settle_success
AFTER UPDATE OF status ON assistant_topup_operations WHEN OLD.status='reserved' AND NEW.status='succeeded' AND NEW.lotId IS NOT NULL BEGIN
  UPDATE assistant_topup_credit_lots SET reservedCredits=reservedCredits-NEW.credits,consumedCredits=consumedCredits+NEW.credits,updatedAt=NEW.updatedAt
   WHERE lotId=NEW.lotId AND userId=NEW.userId AND reservedCredits>=NEW.credits;
  SELECT RAISE(ABORT,'assistant topup lot settlement unavailable') WHERE changes()=0;
END;
CREATE TRIGGER assistant_topup_lot_settle_failure
AFTER UPDATE OF status ON assistant_topup_operations WHEN OLD.status='reserved' AND NEW.status IN ('failed','timed_out') AND NEW.lotId IS NOT NULL BEGIN
  UPDATE assistant_topup_credit_lots SET reservedCredits=reservedCredits-NEW.credits,
    remainingCredits=remainingCredits+CASE WHEN paymentState='paid' THEN NEW.credits ELSE 0 END,
    revokedCredits=revokedCredits+CASE WHEN paymentState='paid' THEN 0 ELSE NEW.credits END,updatedAt=NEW.updatedAt
   WHERE lotId=NEW.lotId AND userId=NEW.userId AND reservedCredits>=NEW.credits;
  SELECT RAISE(ABORT,'assistant topup lot failure settlement unavailable') WHERE changes()=0;
  UPDATE assistant_topup_wallets SET availableCredits=CASE WHEN (SELECT paymentState FROM assistant_topup_credit_lots WHERE lotId=NEW.lotId)='paid' THEN availableCredits ELSE CASE WHEN availableCredits>=NEW.credits THEN availableCredits-NEW.credits ELSE 0 END END,
    refundedCredits=refundedCredits+CASE WHEN (SELECT paymentState FROM assistant_topup_credit_lots WHERE lotId=NEW.lotId)='paid' THEN 0 ELSE NEW.credits END,updatedAt=NEW.updatedAt WHERE userId=NEW.userId;
END;
CREATE TRIGGER assistant_topup_refund_failed_credit
AFTER UPDATE OF status ON assistant_topup_operations
WHEN OLD.status='reserved' AND NEW.status IN ('failed','timed_out') AND COALESCE((SELECT paymentState FROM assistant_topup_credit_lots WHERE lotId=NEW.lotId),'paid')='paid'
BEGIN
  UPDATE assistant_topup_wallets SET availableCredits=availableCredits+OLD.credits,consumedCredits=CASE WHEN consumedCredits>=OLD.credits THEN consumedCredits-OLD.credits ELSE 0 END,
    refundedCredits=refundedCredits+OLD.credits,updatedAt=NEW.updatedAt WHERE userId=NEW.userId;
END;
PRAGMA foreign_keys = ON;
