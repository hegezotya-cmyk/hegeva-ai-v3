const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isAssistantOperationId(value) {
  return typeof value === "string" && UUID_V4.test(value)
}

export function isAssistantPlanLimit(value) {
  return Number.isInteger(value) && value > 0 && value <= 1_000_000
}

function iso(value) {
  return (value instanceof Date ? value : new Date(value)).toISOString()
}

export async function startAssistantOperation(env, { operationId, userId, period, planLimit, now = new Date() }) {
  if (!isAssistantOperationId(operationId)) return { reserved: false, reason: "invalid_assistant_operation" }
  if (!isAssistantPlanLimit(planLimit)) return { reserved: false, reason: "invalid_assistant_plan_limit" }
  const createdAt = iso(now)
  const operationExpiresAt = new Date(new Date(now).getTime() + 30 * 60_000).toISOString()
  const purgeAfter = new Date(new Date(now).getTime() + 90 * 24 * 60 * 60_000).toISOString()
  try {
    await env.DB.prepare(`INSERT INTO assistant_operations (operationId,userId,period,planLimit,reserved,status,operationExpiresAt,purgeAfter,createdAt,updatedAt) VALUES (?1,?2,?3,?4,0,'reserved',?5,?6,?7,?7)`).bind(operationId, userId, period, planLimit, operationExpiresAt, purgeAfter, createdAt).run()
    return { reserved: true, duplicate: false, operationId, status: "reserved" }
  } catch (error) {
    const existing = await env.DB.prepare(`SELECT operationId,userId,period,planLimit,reserved,status,operationExpiresAt,purgeAfter FROM assistant_operations WHERE operationId = ?1 LIMIT 1`).bind(operationId).first()
    if (existing) {
      if (existing.userId !== userId || existing.period !== period) throw new Error("assistant operation ownership mismatch")
      if (new Date(existing.operationExpiresAt).getTime() <= new Date(now).getTime()) return { ...existing, reserved: false, duplicate: false, operationId: existing.operationId, reason: "expired_assistant_operation" }
      return { ...existing, reserved: false, duplicate: true, operationId: existing.operationId }
    }
    if (/assistant monthly quota unavailable/i.test(String(error?.message || error))) return { reserved: false, reason: "assistant_quota_unavailable" }
    throw error
  }
}

export async function finishAssistantOperation(env, { operationId, status, now = new Date() }) {
  if (!isAssistantOperationId(operationId)) return
  await env.DB.prepare(`UPDATE assistant_operations SET status = ?1, updatedAt = ?2 WHERE operationId = ?3`).bind(status, iso(now), operationId).run()
}

export async function readAssistantUsage(env, userId, period) {
  const row = await env.DB.prepare(`SELECT aiMessages FROM assistant_ai_usage WHERE userId = ?1 AND period = ?2 LIMIT 1`).bind(userId, period).first()
  return Number.isFinite(Number(row?.aiMessages)) ? Number(row.aiMessages) : 0
}
