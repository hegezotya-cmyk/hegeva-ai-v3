import type { ApprovalState, MemoryRecord } from "@/lib/foundation/contracts"

export type MemoryWriteContext = {
  ownerId: string
  approval: ApprovalState
  allowedScopes: readonly MemoryRecord["scope"][]
  now: string
}

export type MemoryDecision = { allowed: true } | { allowed: false; reason: "owner-mismatch" | "scope-denied" | "approval-required" | "missing-provenance" | "expired" }

export function authorizeMemoryWrite(record: MemoryRecord, context: MemoryWriteContext): MemoryDecision {
  if (record.ownerId !== context.ownerId) return { allowed: false, reason: "owner-mismatch" }
  if (!context.allowedScopes.includes(record.scope)) return { allowed: false, reason: "scope-denied" }
  if (record.scope === "approved-user" && context.approval !== "approved") return { allowed: false, reason: "approval-required" }
  if (!record.provenance.trim()) return { allowed: false, reason: "missing-provenance" }
  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.parse(context.now)) return { allowed: false, reason: "expired" }
  return { allowed: true }
}

export function selectRecallableMemory(records: readonly MemoryRecord[], context: Pick<MemoryWriteContext, "ownerId" | "allowedScopes" | "now">): readonly MemoryRecord[] {
  const now = Date.parse(context.now)
  return records.filter((record) => record.ownerId === context.ownerId && context.allowedScopes.includes(record.scope) && (!record.expiresAt || Date.parse(record.expiresAt) > now))
}
