CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY,
  attributionId TEXT NOT NULL UNIQUE,
  referrerUserId TEXT NOT NULL,
  referredUserId TEXT NOT NULL UNIQUE,
  rewardType TEXT NOT NULL DEFAULT 'owner-reviewed',
  rewardValue TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','ELIGIBLE','APPROVED','REJECTED','EXECUTED')),
  eligibilityReason TEXT NOT NULL,
  eligibleAt TEXT,
  approvedAt TEXT,
  approvedBy TEXT,
  executedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (attributionId) REFERENCES referral_attributions(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx
  ON referral_rewards(referrerUserId, createdAt DESC);
CREATE INDEX IF NOT EXISTS referral_rewards_referred_idx
  ON referral_rewards(referredUserId, createdAt DESC);
CREATE INDEX IF NOT EXISTS referral_rewards_status_idx
  ON referral_rewards(status, updatedAt DESC);
