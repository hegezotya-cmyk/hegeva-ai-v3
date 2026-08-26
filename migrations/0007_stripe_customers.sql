CREATE TABLE IF NOT EXISTS stripe_customers (
  userId TEXT PRIMARY KEY,
  stripeCustomerId TEXT NOT NULL UNIQUE,
  stripeSubscriptionId TEXT,
  subscriptionStatus TEXT,
  cancelAtPeriodEnd INTEGER NOT NULL DEFAULT 0 CHECK (cancelAtPeriodEnd IN (0, 1)),
  currentPeriodEnd TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS stripe_customers_subscription_idx
  ON stripe_customers(stripeSubscriptionId);
