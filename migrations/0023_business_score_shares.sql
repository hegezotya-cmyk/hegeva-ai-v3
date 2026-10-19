CREATE TABLE IF NOT EXISTS business_score_shares (
  id TEXT PRIMARY KEY,
  ownerUserId TEXT NOT NULL,
  tokenHash TEXT NOT NULL UNIQUE,
  scoreBand TEXT NOT NULL CHECK (scoreBand IN ('0-49','50-74','75-100')),
  methodologyVersion TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  revokedAt TEXT,
  createdAt TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_score_shares_one_active
  ON business_score_shares(ownerUserId) WHERE revokedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_score_shares_token
  ON business_score_shares(tokenHash, expiresAt);
