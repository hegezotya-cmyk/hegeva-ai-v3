-- HEGEVA AI
-- Cloud workspace storage

CREATE TABLE IF NOT EXISTS workspace_data (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  dataType TEXT NOT NULL,
  data TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (userId, dataType)
);

CREATE INDEX IF NOT EXISTS idx_workspace_data_user
ON workspace_data(userId);

CREATE INDEX IF NOT EXISTS idx_workspace_data_type
ON workspace_data(dataType);
