-- Durable Memory table for Brain/Core V1 approved memory persistence
-- Conforms to v0-app/lib/foundation/durable-memory.ts schema

CREATE TABLE IF NOT EXISTS durable_memory (
  memoryId TEXT PRIMARY KEY,
  ownerUserId TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  projectId TEXT,
  artifactId TEXT,
  type TEXT NOT NULL CHECK (type IN ('session', 'workspace', 'project-artifact', 'approved-persistent')),
  payload TEXT NOT NULL,
  provenance TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  expiresAt TEXT,
  retention TEXT NOT NULL CHECK (retention IN ('session', '30-days', 'project-lifetime', 'workspace-lifetime', 'until-deleted')),
  sensitivity TEXT NOT NULL DEFAULT 'internal' CHECK (sensitivity IN ('public', 'internal', 'personal', 'sensitive', 'prohibited')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'deleted', 'expired')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  correlationId TEXT NOT NULL,
  schemaVersion INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_durable_memory_workspace ON durable_memory(workspaceId, status);
CREATE INDEX IF NOT EXISTS idx_durable_memory_owner ON durable_memory(ownerUserId, workspaceId, status);
CREATE INDEX IF NOT EXISTS idx_durable_memory_project ON durable_memory(projectId, status);
CREATE INDEX IF NOT EXISTS idx_durable_memory_correlation ON durable_memory(correlationId);
CREATE INDEX IF NOT EXISTS idx_durable_memory_expires ON durable_memory(expiresAt);