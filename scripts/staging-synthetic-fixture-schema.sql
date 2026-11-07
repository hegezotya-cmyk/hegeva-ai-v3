CREATE TABLE IF NOT EXISTS staging_synthetic_fixture_lease (namespace TEXT PRIMARY KEY, nonce TEXT NOT NULL, lease_until INTEGER NOT NULL, active INTEGER NOT NULL CHECK (active = 1));
CREATE TABLE IF NOT EXISTS staging_synthetic_fixture_effect (namespace TEXT NOT NULL, operation_key TEXT NOT NULL, fencing_token TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (namespace, operation_key));
