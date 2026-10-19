// Business Knowledge V1 runtime gateway for the existing Durable Memory D1 adapter.
// Workspace-scoped, explicit/verified facts only. No AI/provider/external execution.

export const BUSINESS_KNOWLEDGE_MEMORY_VERSION = 1;

const ALLOWED_FIELDS = new Set([
  "business-name",
  "service",
  "price",
  "payment-term",
  "communication-tone",
  "business-rule",
]);

const clean = (value, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const containsProhibitedData = (value) =>
  /(password|api[_ -]?key|secret|bearer\s+token|access[_ -]?token|refresh[_ -]?token|card\s*number|cvv|cvc)/i.test(
    typeof value === "string" ? value : JSON.stringify(value ?? "")
  );

export function buildBusinessKnowledgeMemoryRecord({ userId, workspaceId, items, now, correlationId }) {
  const ownerUserId = clean(userId, 128);
  const scopeId = clean(workspaceId, 128);
  const timestamp = clean(now, 64);
  const corr = clean(correlationId, 160);
  if (!ownerUserId || !scopeId || !Number.isFinite(Date.parse(timestamp)) || !corr) {
    throw new Error("business-knowledge-memory-context-invalid");
  }

  const seen = new Set();
  const accepted = [];
  for (const raw of Array.isArray(items) ? items : []) {
    const id = clean(raw?.id, 160);
    const field = clean(raw?.field, 64);
    const value = clean(raw?.value);
    const source = raw?.source;
    const confidence = raw?.confidence;
    const updatedAt = clean(raw?.updatedAt, 64);
    if (
      !id ||
      !ALLOWED_FIELDS.has(field) ||
      !value ||
      !((source === "owner" && confidence === "explicit") || (source === "workspace" && confidence === "verified")) ||
      !Number.isFinite(Date.parse(updatedAt))
    ) continue;
    const key = `${field}:${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    accepted.push({
      id,
      field,
      value,
      source,
      ...(clean(raw?.sourceId, 160) ? { sourceId: clean(raw.sourceId, 160) } : {}),
      confidence,
      updatedAt,
    });
  }

  if (containsProhibitedData(accepted)) {
    throw new Error("business-knowledge-prohibited-data");
  }

  return {
    schemaVersion: 1,
    memoryId: `business-knowledge:${scopeId}`,
    ownerUserId,
    workspaceId: scopeId,
    type: "workspace",
    payload: { version: BUSINESS_KNOWLEDGE_MEMORY_VERSION, workspaceId: scopeId, items: accepted },
    provenance: { source: "workspace", summary: "Explicit or verified HEGEVA business knowledge profile." },
    createdAt: timestamp,
    updatedAt: timestamp,
    retention: "workspace-lifetime",
    sensitivity: "internal",
    status: "active",
    version: 1,
    correlationId: corr,
  };
}

export async function saveBusinessKnowledgeMemory(adapter, input) {
  if (!adapter?.read || !adapter?.create || !adapter?.update) throw new Error("durable-memory-adapter-required");
  const record = buildBusinessKnowledgeMemoryRecord(input);
  const existing = await adapter.read(record.memoryId);
  if (!existing) return adapter.create(record);
  if (existing.ownerUserId !== record.ownerUserId || existing.workspaceId !== record.workspaceId) {
    throw new Error("business-knowledge-memory-scope-mismatch");
  }
  return adapter.update({
    ...record,
    createdAt: existing.createdAt,
    version: existing.version,
  });
}

export async function readBusinessKnowledgeMemory(adapter, { userId, workspaceId }) {
  if (!adapter?.read) throw new Error("durable-memory-adapter-required");
  const memoryId = `business-knowledge:${clean(workspaceId, 128)}`;
  const record = await adapter.read(memoryId);
  if (!record) return null;
  if (record.ownerUserId !== clean(userId, 128) || record.workspaceId !== clean(workspaceId, 128)) {
    throw new Error("business-knowledge-memory-scope-mismatch");
  }
  return record;
}
