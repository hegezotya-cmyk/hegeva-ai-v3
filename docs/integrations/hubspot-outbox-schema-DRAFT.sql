-- DESIGN ONLY: not a numbered migration, never applied automatically.
-- Separate HEGEVA-owned sales leads from tenant workspace_data.
CREATE TABLE IF NOT EXISTS hubspot_lead_outbox (
  event_id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type = 'lead_upsert'),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','leased','delivered','failed','suppressed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
  next_attempt_at TEXT,
  lease_until TEXT,
  lease_token TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  delivered_at TEXT,
  FOREIGN KEY(user_id) REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS hubspot_lead_outbox_due
  ON hubspot_lead_outbox(state,next_attempt_at);
-- Suppression is independent of outbox rows, so deletions cannot be re-enqueued.
CREATE TABLE IF NOT EXISTS hubspot_lead_suppressions (
  user_id TEXT PRIMARY KEY NOT NULL,
  reason TEXT NOT NULL CHECK(reason IN ('opt_out','erasure','legal_hold')),
  created_at TEXT NOT NULL
);
-- Implementation gate: transactional enqueue must check suppression and legal basis.
-- Processor gate: transactional lease/claim, recheck suppression before sending,
-- compare-and-swap finalization, provider idempotency, recovery of expired leases,
-- and erasure/retention policy must be implemented and tested before deployment.
