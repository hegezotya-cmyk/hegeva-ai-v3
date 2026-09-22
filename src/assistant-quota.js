const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isAssistantOperationId(value) {
  return typeof value === "string" && UUID_V4.test(value)
}

export function isAssistantPlanLimit(value) {
  return Number.isInteger(value) && value > 0 && value <= 1_000_000
}

const PLANS = new Set(["basic", "premium", "pro"])
const PROVIDERS = new Set(["workers-ai"])
const SETTLEMENTS = Object.freeze({
  succeeded: { operationStatus: "succeeded", outcome: "success", quotaState: "finalized", defaultHttpStatus: 200 },
  failed: { operationStatus: "failed", outcome: "failure", quotaState: "refunded", defaultHttpStatus: 500 },
  timed_out: { operationStatus: "timed_out", outcome: "timeout", quotaState: "refunded", defaultHttpStatus: 500 },
  cancelled: { operationStatus: "failed", outcome: "cancelled", quotaState: "refunded", defaultHttpStatus: 500 },
})

function nullableCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

function safeMetrics(metrics) {
  return {
    inputTokens: nullableCount(metrics?.inputTokens),
    outputTokens: nullableCount(metrics?.outputTokens),
    totalTokens: nullableCount(metrics?.totalTokens),
    neuronUsage: nullableCount(metrics?.neuronUsage),
  }
}

function iso(value) {
  return (value instanceof Date ? value : new Date(value)).toISOString()
}

export async function startAssistantOperation(env, { operationId, userId, workspaceId, period, planLimit, plan, provider, model, now = new Date() }) {
  if (!isAssistantOperationId(operationId)) return { reserved: false, reason: "invalid_assistant_operation" }
  if (!isAssistantPlanLimit(planLimit)) return { reserved: false, reason: "invalid_assistant_plan_limit" }
  if (!userId || !workspaceId || !period || !PLANS.has(plan) || !PROVIDERS.has(provider) || typeof model !== "string" || !model || model.length > 160) return { reserved: false, reason: "invalid_assistant_operation_metadata" }
  const createdAt = iso(now)
  const operationExpiresAt = new Date(new Date(now).getTime() + 30 * 60_000).toISOString()
  const purgeAfter = new Date(new Date(now).getTime() + 90 * 24 * 60 * 60_000).toISOString()
  try {
    const operation = env.DB.prepare(`INSERT INTO assistant_operations (operationId,userId,period,planLimit,reserved,status,operationExpiresAt,purgeAfter,createdAt,updatedAt) VALUES (?1,?2,?3,?4,0,'reserved',?5,?6,?7,?7)`).bind(operationId, userId, period, planLimit, operationExpiresAt, purgeAfter, createdAt)
    const settlement = env.DB.prepare(`INSERT INTO assistant_usage_settlements (operationId,userId,workspaceId,plan,provider,model,elapsedMs,quotaSettlementState,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?5,?6,0,'reserved',?7,?7)`).bind(operationId, userId, workspaceId, plan, provider, model, createdAt)
    await env.DB.batch([operation, settlement])
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

export async function finishAssistantOperation(env, { operationId, status, metrics = null, elapsedMs = metrics?.durationMs ?? 0, httpStatus, now = new Date() }) {
  if (!isAssistantOperationId(operationId)) return { settled: false, reason: "invalid_assistant_operation" }
  const settlement = SETTLEMENTS[status]
  if (!settlement) return { settled: false, reason: "invalid_assistant_settlement" }
  const updatedAt = iso(now)
  const elapsed = Number.isSafeInteger(elapsedMs) && elapsedMs >= 0 ? elapsedMs : 0
  const responseStatus = Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? httpStatus : settlement.defaultHttpStatus
  const usage = safeMetrics(metrics)
  const results = await env.DB.batch([
    env.DB.prepare(`UPDATE assistant_operations SET status = ?1, updatedAt = ?2 WHERE operationId = ?3 AND status = 'reserved'`).bind(settlement.operationStatus, updatedAt, operationId),
    env.DB.prepare(`UPDATE assistant_usage_settlements
      SET inputTokens = ?1, outputTokens = ?2, totalTokens = ?3, neuronUsage = ?4,
          elapsedMs = ?5, httpStatus = ?6, outcome = ?7, quotaSettlementState = ?8, updatedAt = ?9
      WHERE operationId = ?10 AND quotaSettlementState = 'reserved'
        AND EXISTS (SELECT 1 FROM assistant_operations WHERE operationId = ?10 AND status = ?11)`)
      .bind(usage.inputTokens, usage.outputTokens, usage.totalTokens, usage.neuronUsage, elapsed, responseStatus, settlement.outcome, settlement.quotaState, updatedAt, operationId, settlement.operationStatus),
  ])
  const settled = Number(results?.[1]?.meta?.changes || 0) === 1
  return { settled, duplicate: !settled, quotaSettlementState: settled ? settlement.quotaState : undefined }
}

export async function readAssistantUsage(env, userId, period) {
  const row = await env.DB.prepare(`SELECT aiMessages FROM assistant_ai_usage WHERE userId = ?1 AND period = ?2 LIMIT 1`).bind(userId, period).first()
  return Number.isFinite(Number(row?.aiMessages)) ? Number(row.aiMessages) : 0
}
