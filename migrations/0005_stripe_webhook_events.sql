CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  eventId TEXT PRIMARY KEY,
  eventType TEXT NOT NULL,
  userId TEXT,
  plan TEXT,
  eventCreatedAt TEXT NOT NULL,
  processedAt TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('applied','ignored'))
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_user_created
  ON stripe_webhook_events (userId, eventCreatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type_created
  ON stripe_webhook_events (eventType, eventCreatedAt DESC);
