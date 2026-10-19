-- Private per-operation Assistant usage and quota settlement ledger.
-- No prompts, responses, credentials, or customer content are stored here.
CREATE TABLE IF NOT EXISTS assistant_usage_settlements (
  operationId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'pro')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  inputTokens INTEGER CHECK (inputTokens IS NULL OR inputTokens >= 0),
  outputTokens INTEGER CHECK (outputTokens IS NULL OR outputTokens >= 0),
  totalTokens INTEGER CHECK (totalTokens IS NULL OR totalTokens >= 0),
  neuronUsage INTEGER CHECK (neuronUsage IS NULL OR neuronUsage >= 0),
  elapsedMs INTEGER NOT NULL DEFAULT 0 CHECK (elapsedMs >= 0),
  httpStatus INTEGER CHECK (httpStatus IS NULL OR httpStatus BETWEEN 100 AND 599),
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('success', 'failure', 'timeout', 'cancelled')),
  quotaSettlementState TEXT NOT NULL DEFAULT 'reserved' CHECK (quotaSettlementState IN ('reserved', 'finalized', 'refunded')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (operationId) REFERENCES assistant_operations(operationId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assistant_usage_settlements_user_created
  ON assistant_usage_settlements(userId, createdAt);

CREATE TRIGGER IF NOT EXISTS assistant_refund_reserved_message_once
AFTER UPDATE OF quotaSettlementState ON assistant_usage_settlements
WHEN OLD.quotaSettlementState = 'reserved' AND NEW.quotaSettlementState = 'refunded'
BEGIN
  SELECT RAISE(ABORT, 'assistant quota refund target missing')
  WHERE NOT EXISTS (
    SELECT 1 FROM assistant_operations operation
    JOIN assistant_ai_usage usage ON usage.userId = operation.userId AND usage.period = operation.period
    WHERE operation.operationId = NEW.operationId AND operation.reserved = 1
  );

  UPDATE assistant_ai_usage
  SET aiMessages = CASE WHEN aiMessages > 0 THEN aiMessages - 1 ELSE 0 END,
      updatedAt = NEW.updatedAt
  WHERE EXISTS (
    SELECT 1 FROM assistant_operations operation
    WHERE operation.operationId = NEW.operationId
      AND operation.userId = assistant_ai_usage.userId
      AND operation.period = assistant_ai_usage.period
      AND operation.reserved = 1
  );
END;
