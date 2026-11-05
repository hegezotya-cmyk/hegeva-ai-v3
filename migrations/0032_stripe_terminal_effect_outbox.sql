-- Draft ONLY. Do not apply before explicit staging migration approval.
-- Durable post-commit billing and referral effect jobs for terminal Stripe events.
CREATE TABLE IF NOT EXISTS stripe_terminal_effect_outbox (
  eventId TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  effectType TEXT NOT NULL CHECK (effectType IN ('billing-and-referral-downgrade','referral-retain')),
  subscriptionId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  livemode INTEGER NOT NULL CHECK (livemode IN (0,1)),
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','completed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  nextAttemptAt TEXT NOT NULL,
  leaseUntil TEXT,
  lastError TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stripe_terminal_effect_due
 ON stripe_terminal_effect_outbox(state, nextAttemptAt);
