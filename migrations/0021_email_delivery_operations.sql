CREATE TABLE IF NOT EXISTS email_delivery_operations (
  operationId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  actionId TEXT NOT NULL,
  readyVersion INTEGER NOT NULL,
  contentDigest TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sending','sent','failed','uncertain','cancelled')),
  providerMessageId TEXT,
  failureCode TEXT,
  confirmedByActorHash TEXT NOT NULL,
  confirmedAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(userId, actionId, readyVersion)
);
CREATE INDEX IF NOT EXISTS idx_email_delivery_operations_owner_action ON email_delivery_operations(userId, actionId);

CREATE TABLE IF NOT EXISTS email_delivery_history (
  id TEXT PRIMARY KEY,
  operationId TEXT NOT NULL,
  userId TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('final-confirmed','sending','sent','failed','uncertain','cancelled')),
  status TEXT NOT NULL CHECK (status IN ('sending','sent','failed','uncertain','cancelled')),
  providerMessageId TEXT,
  failureCode TEXT,
  actorHash TEXT NOT NULL,
  occurredAt TEXT NOT NULL,
  FOREIGN KEY (operationId) REFERENCES email_delivery_operations(operationId) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_email_delivery_history_owner_operation ON email_delivery_history(userId, operationId, occurredAt);
CREATE TRIGGER IF NOT EXISTS email_delivery_history_no_update BEFORE UPDATE ON email_delivery_history BEGIN SELECT RAISE(ABORT, 'email delivery history is append-only'); END;
CREATE TRIGGER IF NOT EXISTS email_delivery_history_no_delete BEFORE DELETE ON email_delivery_history BEGIN SELECT RAISE(ABORT, 'email delivery history is append-only'); END;
