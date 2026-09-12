CREATE TABLE IF NOT EXISTS client_portal_shares (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tokenHash TEXT NOT NULL UNIQUE,
  snapshot TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  revokedAt TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_client_portal_owner ON client_portal_shares(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_client_portal_expiry ON client_portal_shares(tokenHash, expiresAt);
