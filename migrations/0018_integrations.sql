CREATE TABLE IF NOT EXISTS integration_connections (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  provider TEXT NOT NULL,
  encryptedAccessToken TEXT NOT NULL,
  encryptedRefreshToken TEXT,
  scopes TEXT NOT NULL,
  expiresAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(userId, provider)
);
CREATE INDEX IF NOT EXISTS idx_integration_connections_owner ON integration_connections(userId, provider);

CREATE TABLE IF NOT EXISTS integration_oauth_states (
  stateHash TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  provider TEXT NOT NULL,
  encryptedVerifier TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_integration_oauth_expiry ON integration_oauth_states(expiresAt);
