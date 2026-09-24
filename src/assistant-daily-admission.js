const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DAY = /^\d{4}-\d{2}-\d{2}$/

function positiveInteger(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}
function iso(value = new Date()) { return (value instanceof Date ? value : new Date(value)).toISOString() }

export function readAssistantDailyAdmissionConfig(env = {}) {
  const requestLimit = positiveInteger(env.AI_DAILY_REQUEST_CEILING)
  const neuronLimit = positiveInteger(env.AI_DAILY_NEURON_CEILING)
  return { configured: Boolean(requestLimit && neuronLimit), requestLimit, neuronLimit }
}

export async function reserveAssistantDailyAdmission(env, { operationId, day, tier, reservationNeurons, config = readAssistantDailyAdmissionConfig(env), now = new Date() }) {
  if (!UUID_V4.test(String(operationId || "")) || !DAY.test(String(day || "")) || !(tier === "standard" || tier === "advanced") || !positiveInteger(reservationNeurons)) return { reserved: false, reason: "invalid_daily_admission" }
  if (!config?.configured) return { reserved: false, reason: "daily_admission_unconfigured" }
  const createdAt = iso(now)
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO assistant_daily_model_buckets (day,requestLimit,neuronLimit,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?4) ON CONFLICT(day) DO NOTHING`).bind(day, config.requestLimit, config.neuronLimit, createdAt),
      env.DB.prepare(`INSERT INTO assistant_daily_model_reservations (operationId,day,tier,reservedNeurons,settledNeurons,status,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?4,'reserved',?5,?5)`).bind(operationId, day, tier, reservationNeurons, createdAt),
    ])
    return { reserved: true, operationId, day, tier, reservationNeurons }
  } catch (error) {
    const existing = await env.DB.prepare("SELECT operationId,status FROM assistant_daily_model_reservations WHERE operationId=?1 LIMIT 1").bind(operationId).first()
    if (existing) return { reserved: false, duplicate: true, reason: "duplicate_daily_admission" }
    if (/daily capacity exhausted/i.test(String(error?.message || error))) return { reserved: false, reason: "daily_capacity_exhausted" }
    return { reserved: false, reason: "daily_admission_unavailable" }
  }
}

export async function settleAssistantDailyAdmission(env, { operationId, actualNeurons = null, now = new Date() }) {
  if (!UUID_V4.test(String(operationId || ""))) return { settled: false, reason: "invalid_daily_admission" }
  const existing = await env.DB.prepare("SELECT reservedNeurons,status FROM assistant_daily_model_reservations WHERE operationId=?1 LIMIT 1").bind(operationId).first()
  if (!existing) return { settled: false, reason: "daily_admission_missing" }
  const settledNeurons = positiveInteger(actualNeurons) || Number(existing.reservedNeurons)
  const result = await env.DB.prepare("UPDATE assistant_daily_model_reservations SET status='settled',settledNeurons=?1,updatedAt=?2 WHERE operationId=?3 AND status='reserved'").bind(settledNeurons, iso(now), operationId).run()
  const settled = Number(result?.meta?.changes || 0) === 1
  return { settled, duplicate: !settled, settledNeurons }
}

export async function releaseAssistantDailyAdmission(env, { operationId, now = new Date() }) {
  if (!UUID_V4.test(String(operationId || ""))) return { settled: false, reason: "invalid_daily_admission" }
  const result = await env.DB.prepare("UPDATE assistant_daily_model_reservations SET status='released',updatedAt=?1 WHERE operationId=?2 AND status='reserved'").bind(iso(now), operationId).run()
  const settled = Number(result?.meta?.changes || 0) === 1
  return { settled, duplicate: !settled }
}
