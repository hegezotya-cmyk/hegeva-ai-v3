-- HEGEVA AI V4.7
-- Plans + monthly AI usage

CREATE TABLE IF NOT EXISTS user_plans (
  userId TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'basic'
    CHECK (plan IN ('basic', 'premium', 'pro')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_usage (
  userId TEXT NOT NULL,
  period TEXT NOT NULL,
  aiMessages INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  PRIMARY KEY (userId, period)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user
ON ai_usage(userId);
