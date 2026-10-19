const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/
const CLASSES = new Set(["included", "prepaid"])

function positiveInteger(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function iso(value = new Date()) {
  return (value instanceof Date ? value : new Date(value)).toISOString()
}

export function readAssistantCostGuardConfig(env = {}) {
  const includedLimit = positiveInteger(env.AI_GLOBAL_INCLUDED_BUDGET_UNITS)
  const prepaidLimit = positiveInteger(env.AI_GLOBAL_PREPAID_BUDGET_UNITS)
  const emergencyLimit = positiveInteger(env.AI_GLOBAL_EMERGENCY_CAP_UNITS)
  const requestUnits = positiveInteger(env.AI_GLOBAL_REQUEST_RESERVATION_UNITS)
  const configured = Boolean(includedLimit && prepaidLimit && emergencyLimit && requestUnits)
  return { configured, includedLimit, prepaidLimit, emergencyLimit, requestUnits }
}

function bucketInsert(env, period, budgetClass, limitUnits, now) {
  return env.DB.prepare(`
    INSERT INTO assistant_cost_guard_buckets (period,budgetClass,limitUnits,reservedUnits,settledUnits,createdAt,updatedAt)
    VALUES (?1,?2,?3,0,0,?4,?4)
    ON CONFLICT(period,budgetClass) DO NOTHING
  `).bind(period, budgetClass, limitUnits, now)
}

export async function reserveAssistantCostGuard(env, { operationId, period, fundingClass, config = readAssistantCostGuardConfig(env), now = new Date() }) {
  if (!UUID_V4.test(String(operationId || "")) || !PERIOD.test(String(period || "")) || !CLASSES.has(fundingClass)) return { reserved: false, reason: "invalid_cost_guard_request" }
  if (!config?.configured) return { reserved: false, reason: "cost_guard_unconfigured" }
  const createdAt = iso(now)
  const fundingLimit = fundingClass === "included" ? config.includedLimit : config.prepaidLimit
  try {
    await env.DB.batch([
      bucketInsert(env, period, fundingClass, fundingLimit, createdAt),
      bucketInsert(env, period, "emergency", config.emergencyLimit, createdAt),
      env.DB.prepare(`
        INSERT INTO assistant_cost_guard_reservations (operationId,period,fundingClass,requestUnits,emergencyUnits,status,createdAt,updatedAt)
        VALUES (?1,?2,?3,?4,?4,'reserved',?5,?5)
      `).bind(operationId, period, fundingClass, config.requestUnits, createdAt),
    ])
    return { reserved: true, operationId, requestUnits: config.requestUnits }
  } catch (error) {
    const existing = await env.DB.prepare("SELECT operationId,status,fundingClass FROM assistant_cost_guard_reservations WHERE operationId = ?1 LIMIT 1").bind(operationId).first()
    if (existing) return { reserved: false, duplicate: true, reason: "duplicate_cost_guard_operation" }
    const message = String(error?.message || error)
    if (/emergency budget exhausted/i.test(message)) return { reserved: false, reason: "emergency_budget_exhausted" }
    if (/funding budget exhausted/i.test(message)) return { reserved: false, reason: `${fundingClass}_budget_exhausted` }
    return { reserved: false, reason: "cost_guard_unavailable" }
  }
}

export async function settleAssistantCostGuard(env, { operationId, status, now = new Date() }) {
  if (!UUID_V4.test(String(operationId || "")) || !["settled", "released"].includes(status)) return { settled: false, reason: "invalid_cost_guard_settlement" }
  const result = await env.DB.prepare("UPDATE assistant_cost_guard_reservations SET status = ?1, updatedAt = ?2 WHERE operationId = ?3 AND status = 'reserved'").bind(status, iso(now), operationId).run()
  const settled = Number(result?.meta?.changes || 0) === 1
  return { settled, duplicate: !settled, status }
}
