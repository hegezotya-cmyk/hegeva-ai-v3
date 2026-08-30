const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isX30OperationId(value) {
  return typeof value === "string" && UUID_V4.test(value)
}

export const X30_DAILY_LIMIT = 3
export const X30_MONTHLY_LIMIT = 20
export const X30_WORKSPACE_LIMIT = 50
export const X30_OPERATION_TTL_MS = 30 * 60_000

function iso(value) { return (value instanceof Date ? value : new Date(value)).toISOString() }

export async function startX30Generation(env, { operationId, userId, workspaceScope, period, planLimit, workspaceLimit = X30_WORKSPACE_LIMIT, now = new Date() }) {
  if (!isX30OperationId(operationId) || typeof userId !== "string" || !userId || typeof workspaceScope !== "string" || !workspaceScope || typeof period !== "string" || !/^\d{4}-\d{2}$/.test(period)) return { reserved: false, reason: "invalid_x30_identity" }
  if (!Number.isInteger(planLimit) || planLimit < 1) return { reserved: false, reason: "invalid_x30_limit" }
  const createdAt = iso(now)
  const operationExpiresAt = new Date(now.getTime() + X30_OPERATION_TTL_MS).toISOString()
  try {
    await env.DB.prepare(`INSERT INTO x30_generation_operations (operationId,userId,workspaceScope,period,planLimit,dailyLimit,workspaceLimit,reserved,status,operationExpiresAt,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?5,?6,?7,0,'reserved',?8,?9,?9)`).bind(operationId, userId, workspaceScope, period, planLimit, X30_DAILY_LIMIT, workspaceLimit, operationExpiresAt, createdAt).run()
    return { reserved: true, duplicate: false, operationId, status: "reserved" }
  } catch (error) {
    const existing = await env.DB.prepare(`SELECT operationId,userId,workspaceScope,period,reserved,status,operationExpiresAt FROM x30_generation_operations WHERE operationId = ?1 LIMIT 1`).bind(operationId).first()
    if (existing) {
      if (existing.userId !== userId || existing.workspaceScope !== workspaceScope || existing.period !== period) return { reserved: false, reason: "invalid_x30_identity" }
      if (new Date(existing.operationExpiresAt).getTime() <= now.getTime()) return { reserved: false, reason: "expired_x30_operation" }
      return { ...existing, reserved: false, duplicate: true }
    }
    if (/allowance unavailable/i.test(String(error?.message || error))) return { reserved: false, reason: "x30_allowance_exhausted" }
    return { reserved: false, reason: "x30_allowance_unavailable" }
  }
}

export async function finishX30Generation(env, { operationId, userId, status, now = new Date() }) {
  if (!isX30OperationId(operationId) || typeof userId !== "string") return { updated: false }
  const result = await env.DB.prepare(`UPDATE x30_generation_operations SET status = ?1, updatedAt = ?2 WHERE operationId = ?3 AND userId = ?4 AND reserved = 1`).bind(status, iso(now), operationId, userId).run()
  return { updated: Number(result?.meta?.changes || 0) === 1 }
}
