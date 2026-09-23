CREATE TABLE IF NOT EXISTS referral_reward_reviews (
  id TEXT PRIMARY KEY,
  attributionId TEXT NOT NULL UNIQUE,
  creatorUserId TEXT NOT NULL,
  referredUserId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','reversed')),
  reviewedBy TEXT,
  reviewedAt TEXT,
  decisionReason TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (attributionId) REFERENCES referral_attributions(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS referral_reward_reviews_creatorUserId_idx
  ON referral_reward_reviews(creatorUserId, createdAt DESC);
CREATE INDEX IF NOT EXISTS referral_reward_reviews_referredUserId_idx
  ON referral_reward_reviews(referredUserId, createdAt DESC);
CREATE INDEX IF NOT EXISTS referral_reward_reviews_status_idx
  ON referral_reward_reviews(status, updatedAt DESC);
CREATE INDEX IF NOT EXISTS referral_reward_reviews_createdAt_idx
  ON referral_reward_reviews(createdAt DESC);
