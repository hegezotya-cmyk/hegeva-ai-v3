CREATE TABLE IF NOT EXISTS contact_leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new',
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS contact_leads_created_idx
  ON contact_leads(createdAt DESC);

CREATE INDEX IF NOT EXISTS contact_leads_email_created_idx
  ON contact_leads(email, createdAt DESC);
