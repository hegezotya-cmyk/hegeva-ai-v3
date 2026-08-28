import type { ApprovalState, MemoryRecord } from "@/lib/foundation/contracts"

export type MemoryWriteContext = {
  ownerId: string
  approval: ApprovalState
  allowedScopes: readonly MemoryRecord["scope"][]
  now: string
}

export type MemoryDecision = { allowed: true } | { allowed: false; reason: "owner-mismatch" | "scope-denied" | "approval-required" | "missing-provenance" | "invalid-timestamp" | "expired" }

export function authorizeMemoryWrite(record: MemoryRecord, context: MemoryWriteContext): MemoryDecision {
  if (record.ownerId !== context.ownerId) return { allowed: false, reason: "owner-mismatch" }
  if (!context.allowedScopes.includes(record.scope)) return { allowed: false, reason: "scope-denied" }
  if (record.scope === "approved-user" && context.approval !== "approved") return { allowed: false, reason: "approval-required" }
  if (!record.provenance.trim()) return { allowed: false, reason: "missing-provenance" }
  const now = Date.parse(context.now)
  const createdAt = Date.parse(record.createdAt)
  const expiresAt = record.expiresAt ? Date.parse(record.expiresAt) : undefined
  if (!Number.isFinite(now) || !Number.isFinite(createdAt) || expiresAt !== undefined && !Number.isFinite(expiresAt)) return { allowed: false, reason: "invalid-timestamp" }
  if (expiresAt !== undefined && expiresAt <= now) return { allowed: false, reason: "expired" }
  return { allowed: true }
}

export function selectRecallableMemory(records: readonly MemoryRecord[], context: Pick<MemoryWriteContext, "ownerId" | "allowedScopes" | "now">): readonly MemoryRecord[] {
  const now = Date.parse(context.now)
  if (!Number.isFinite(now)) return []
  return records.filter((record) => {
    const expiresAt = record.expiresAt ? Date.parse(record.expiresAt) : undefined
    return record.ownerId === context.ownerId
      && context.allowedScopes.includes(record.scope)
      && (expiresAt === undefined || Number.isFinite(expiresAt) && expiresAt > now)
  })
}
