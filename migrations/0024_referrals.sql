CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY,
  ownerUserId TEXT NOT NULL,
  codeHash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  createdAt TEXT NOT NULL,
  revokedAt TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_one_active ON referral_codes(ownerUserId) WHERE status='active';
CREATE TABLE IF NOT EXISTS referral_touches (
  id TEXT PRIMARY KEY,
  codeId TEXT NOT NULL,
  touchHash TEXT NOT NULL,
  touchType TEXT NOT NULL CHECK (touchType IN ('visit','challenge','share')),
  occurredAt TEXT NOT NULL,
  consentState TEXT NOT NULL,
  metadataVersion TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS referral_touches_code_idx ON referral_touches(codeId, occurredAt);
CREATE TABLE IF NOT EXISTS referral_attributions (
  id TEXT PRIMARY KEY,
  codeId TEXT NOT NULL,
  referredUserId TEXT NOT NULL UNIQUE,
  firstTouchAt TEXT NOT NULL,
  lastTouchAt TEXT NOT NULL,
  attributionState TEXT NOT NULL DEFAULT 'pending' CHECK (attributionState IN ('pending','rejected')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS referral_attributions_code_user ON referral_attributions(codeId, referredUserId);
