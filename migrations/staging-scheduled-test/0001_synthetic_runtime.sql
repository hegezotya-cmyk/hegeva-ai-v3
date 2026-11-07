CREATE TABLE IF NOT EXISTS stripe_terminal_effect_outbox (
  eventId TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  effectType TEXT NOT NULL CHECK (effectType IN ('billing-and-referral-downgrade','referral-retain')),
  subscriptionId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  livemode INTEGER NOT NULL CHECK (livemode IN (0,1)),
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','completed','blocked')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  nextAttemptAt TEXT NOT NULL,
  leaseUntil TEXT,
  lastError TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stripe_terminal_effect_due
  ON stripe_terminal_effect_outbox(state, nextAttemptAt);
CREATE TABLE IF NOT EXISTS staging_synthetic_fixture_lease (
  namespace TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  lease_until INTEGER NOT NULL,
  active INTEGER NOT NULL CHECK (active = 1)
);
CREATE TABLE IF NOT EXISTS staging_synthetic_fixture_effect (
  namespace TEXT NOT NULL,
  operation_key TEXT NOT NULL,
  fencing_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(namespace, operation_key)
);
CREATE TABLE IF NOT EXISTS staging_scheduled_test_runs (
  scenario TEXT PRIMARY KEY CHECK (scenario IN ('retry-recovery','lease-fencing')),
  namespace TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  cleanup_verified INTEGER NOT NULL DEFAULT 0 CHECK (cleanup_verified IN (0,1)),
  updated_at TEXT NOT NULL
);
