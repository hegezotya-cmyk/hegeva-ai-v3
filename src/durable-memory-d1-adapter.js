// D1-backed DurableMemoryAdapter implementation
// Conforms to the interface in v0-app/lib/foundation/durable-memory.ts

export const DURABLE_MEMORY_SCHEMA_VERSION = 1;

export const MEMORY_TYPES = Object.freeze([
  "session",
  "workspace",
  "project-artifact",
  "approved-persistent"
]);

export const MEMORY_SENSITIVITY = Object.freeze([
  "public",
  "internal",
  "personal",
  "sensitive",
  "prohibited"
]);

export const RETENTION_POLICIES = Object.freeze([
  "session",
  "30-days",
  "project-lifetime",
  "workspace-lifetime",
  "until-deleted"
]);

export const MEMORY_STATUSES = Object.freeze([
  "active",
  "superseded",
  "deleted",
  "expired"
]);

export function createDurableMemoryD1Adapter({ DB }) {
  const TABLE = "durable_memory";
  let tableInitialized = false;

  async function ensureTable() {
    if (tableInitialized) return;
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        memoryId TEXT PRIMARY KEY,
        ownerUserId TEXT NOT NULL,
        workspaceId TEXT NOT NULL,
        projectId TEXT,
        artifactId TEXT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        provenance TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        expiresAt TEXT,
        retention TEXT NOT NULL,
        sensitivity TEXT NOT NULL DEFAULT 'internal',
        status TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        correlationId TEXT NOT NULL,
        schemaVersion INTEGER NOT NULL DEFAULT ${DURABLE_MEMORY_SCHEMA_VERSION}
      )
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_durable_memory_workspace
      ON ${TABLE}(workspaceId, status)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_durable_memory_owner
      ON ${TABLE}(ownerUserId, workspaceId, status)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_durable_memory_project
      ON ${TABLE}(projectId, status)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_durable_memory_correlation
      ON ${TABLE}(correlationId)
    `).run();

    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_durable_memory_expires
      ON ${TABLE}(expiresAt)
    `).run();

    tableInitialized = true;
  }

  async function withTable(fn) {
    await ensureTable();
    return fn();
  }

  function validateMemoryRecord(record) {
    if (!record.memoryId?.trim()) throw new Error("memory-identity-required: memoryId");
    if (!record.ownerUserId?.trim()) throw new Error("memory-identity-required: ownerUserId");
    if (!record.workspaceId?.trim()) throw new Error("memory-identity-required: workspaceId");
    if (!record.correlationId?.trim()) throw new Error("memory-identity-required: correlationId");
    if (!MEMORY_TYPES.includes(record.type)) throw new Error(`memory-record-invalid: invalid type ${record.type}`);
    if (!MEMORY_SENSITIVITY.includes(record.sensitivity)) throw new Error(`memory-record-invalid: invalid sensitivity ${record.sensitivity}`);
    if (!RETENTION_POLICIES.includes(record.retention)) throw new Error(`memory-record-invalid: invalid retention ${record.retention}`);
    if (!MEMORY_STATUSES.includes(record.status)) throw new Error(`memory-record-invalid: invalid status ${record.status}`);
    if (!Number.isInteger(record.version) || record.version < 1) throw new Error("memory-record-invalid: version");
    if (!record.provenance?.summary?.trim()) throw new Error("memory-provenance-required");
    if (record.schemaVersion !== DURABLE_MEMORY_SCHEMA_VERSION) throw new Error("memory-record-invalid: schemaVersion");

    for (const ts of [record.createdAt, record.updatedAt, record.expiresAt].filter(Boolean)) {
      if (!Number.isFinite(Date.parse(ts))) throw new Error("memory-timestamp-invalid");
    }

    try {
      JSON.stringify(record.payload);
    } catch {
      throw new Error("memory-record-invalid: payload not serializable");
    }

    if (containsProhibitedData(record.payload)) {
      throw new Error("memory-prohibited-data");
    }
  }

  function containsProhibitedData(value) {
    try {
      const text = JSON.stringify(value).toLowerCase();
      return /(?:password|api[_ -]?key|secret|bearer token|access[_ -]?token|refresh[_ -]?token|card number|cvv|cvc)/.test(text);
    } catch {
      return true;
    }
  }

  function mapRowToRecord(row) {
    if (!row) return null;
    return {
      schemaVersion: row.schemaVersion,
      memoryId: row.memoryId,
      ownerUserId: row.ownerUserId,
      workspaceId: row.workspaceId,
      projectId: row.projectId ?? undefined,
      artifactId: row.artifactId ?? undefined,
      type: row.type,
      payload: JSON.parse(row.payload),
      provenance: JSON.parse(row.provenance),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      expiresAt: row.expiresAt ?? undefined,
      retention: row.retention,
      sensitivity: row.sensitivity,
      status: row.status,
      version: row.version,
      correlationId: row.correlationId,
    };
  }

  function isExpired(record, now) {
    if (!record.expiresAt) return false;
    return Date.parse(record.expiresAt) <= Date.parse(now);
  }

  return {
    async create(record) {
      return withTable(async () => {
        validateMemoryRecord(record);
        await DB.prepare(`
          INSERT INTO ${TABLE} (
            memoryId, ownerUserId, workspaceId, projectId, artifactId,
            type, payload, provenance, createdAt, updatedAt, expiresAt,
            retention, sensitivity, status, version, correlationId, schemaVersion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          record.memoryId,
          record.ownerUserId,
          record.workspaceId,
          record.projectId ?? null,
          record.artifactId ?? null,
          record.type,
          JSON.stringify(record.payload),
          JSON.stringify(record.provenance),
          record.createdAt,
          record.updatedAt,
          record.expiresAt ?? null,
          record.retention,
          record.sensitivity,
          record.status,
          record.version,
          record.correlationId,
          record.schemaVersion
        ).run();
        return { ...record };
      });
    },

    async read(memoryId) {
      return withTable(async () => {
        const row = await DB.prepare(`
          SELECT * FROM ${TABLE} WHERE memoryId = ?
        `).bind(memoryId).first();
        return mapRowToRecord(row);
      });
    },

    async query({ workspaceId, projectId, artifactId, types, limit = 50 }) {
      return withTable(async () => {
        let sql = `SELECT * FROM ${TABLE} WHERE workspaceId = ? AND status = 'active'`;
        const params = [workspaceId];

        if (projectId) {
          sql += ` AND projectId = ?`;
          params.push(projectId);
        }
        if (artifactId) {
          sql += ` AND artifactId = ?`;
          params.push(artifactId);
        }
        if (types && types.length > 0) {
          const placeholders = types.map(() => "?").join(",");
          sql += ` AND type IN (${placeholders})`;
          params.push(...types);
        }

        sql += ` ORDER BY updatedAt DESC LIMIT ?`;
        params.push(Math.min(Math.max(limit, 0), 100));

        const { results } = await DB.prepare(sql).bind(...params).all();
        return (results || []).map(mapRowToRecord).filter(r => r !== null);
      });
    },

    async update(record) {
      return withTable(async () => {
        validateMemoryRecord(record);
        const existing = await this.read(record.memoryId);
        if (!existing) throw new Error("memory-not-found");

        if (
          record.ownerUserId !== existing.ownerUserId ||
          record.workspaceId !== existing.workspaceId ||
          record.projectId !== existing.projectId ||
          record.createdAt !== existing.createdAt
        ) {
          throw new Error("memory-scope-immutable");
        }

        const updated = { ...record, version: existing.version + 1, updatedAt: new Date().toISOString() };
        await DB.prepare(`
          UPDATE ${TABLE} SET
            payload = ?, provenance = ?, updatedAt = ?, expiresAt = ?,
            retention = ?, sensitivity = ?, status = ?, version = ?
          WHERE memoryId = ?
        `).bind(
          JSON.stringify(updated.payload),
          JSON.stringify(updated.provenance),
          updated.updatedAt,
          updated.expiresAt ?? null,
          updated.retention,
          updated.sensitivity,
          updated.status,
          updated.version,
          updated.memoryId
        ).run();
        return updated;
      });
    },

    async delete(memoryId) {
      return withTable(async () => {
        const result = await DB.prepare(`
          DELETE FROM ${TABLE} WHERE memoryId = ?
        `).bind(memoryId).run();
        return Number(result?.meta?.changes || 0) > 0;
      });
    },

    async purgeExpired(now) {
      return withTable(async () => {
        const result = await DB.prepare(`
          DELETE FROM ${TABLE}
          WHERE expiresAt IS NOT NULL AND expiresAt <= ? AND status = 'active'
        `).bind(now).run();
        return Number(result?.meta?.changes || 0);
      });
    },

    async listByScope(workspaceId, projectId) {
      return this.query({ workspaceId, projectId, limit: 200 });
    }
  };
}