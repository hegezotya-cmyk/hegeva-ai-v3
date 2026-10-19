const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isX20RequestId(value) {
  return typeof value === "string" && UUID_PATTERN.test(value)
}

export function newX20Id() {
  return crypto.randomUUID()
}

export async function startX20Action(env, { startRequestId, userId, period, planLimit, now = new Date() }) {
  if (!isX20RequestId(startRequestId)) throw new Error("invalid startRequestId")
  const createdAt = now.toISOString()
  const actionId = newX20Id()
  const actionExpiresAt = new Date(now.getTime() + 30 * 60_000).toISOString()
  const purgeAfter = new Date(now.getTime() + 90 * 24 * 60 * 60_000).toISOString()
  try {
    await env.DB.prepare(`INSERT INTO x20_request_ledger (actionId,startRequestId,userId,period,kind,planLimit,userReserved,providerCalls,status,actionExpiresAt,purgeAfter,createdAt,updatedAt) VALUES (?1,?2,?3,?4,'x20',?5,0,0,'active',?6,?7,?8,?8)`).bind(actionId, startRequestId, userId, period, planLimit, actionExpiresAt, purgeAfter, createdAt).run()
    return { actionId, created: true }
  } catch (error) {
    const existing = await env.DB.prepare(`SELECT actionId, userId, period, kind, userReserved, providerCalls, status, actionExpiresAt FROM x20_request_ledger WHERE userId = ?1 AND startRequestId = ?2 LIMIT 1`).bind(userId, startRequestId).first()
    if (existing) return { ...existing, created: false }
    throw error
  }
}

export async function registerX20Attempt(env, { actionId, attemptRequestId, userId, period, now = new Date() }) {
  if (!isX20RequestId(attemptRequestId)) return { admitted: false, reason: "invalid_attempt_request" }
  const createdAt = now.toISOString()
  const attemptId = newX20Id()
  const existing = await env.DB.prepare(`SELECT attemptId, attemptNumber, status FROM x20_provider_attempts WHERE actionId = ?1 AND attemptRequestId = ?2 AND userId = ?3 AND period = ?4 LIMIT 1`).bind(actionId, attemptRequestId, userId, period).first()
  if (existing) return { ...existing, admitted: existing.status === "reserved", duplicate: true }
  try {
    await env.DB.prepare(`INSERT INTO x20_provider_attempts (attemptId,attemptRequestId,actionId,userId,period,attemptNumber,status,createdAt,updatedAt) SELECT ?1,?2,?3,?4,?5,COALESCE(MAX(attemptNumber),0)+1,'reserved',?6,?6 FROM x20_provider_attempts WHERE actionId = ?3 AND userId = ?4 AND period = ?5 HAVING COALESCE(MAX(attemptNumber),0) < 3`).bind(attemptId, attemptRequestId, actionId, userId, period, createdAt).run()
    const persisted = await env.DB.prepare(`SELECT attemptId, attemptNumber, status FROM x20_provider_attempts WHERE attemptId = ?1 AND actionId = ?2 AND userId = ?3 AND period = ?4 LIMIT 1`).bind(attemptId, actionId, userId, period).first()
    const attemptNumber = Number(persisted?.attemptNumber)
    if (!persisted || persisted.status !== "reserved" || !isX20RequestId(persisted.attemptId) || !Number.isInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > 3) return { admitted: false, reason: "attempt_cap" }
    return { attemptId: persisted.attemptId, attemptNumber, status: "reserved", admitted: true, duplicate: false }
  } catch {
    const retry = await env.DB.prepare(`SELECT attemptId, attemptNumber, status FROM x20_provider_attempts WHERE actionId = ?1 AND attemptRequestId = ?2 AND userId = ?3 AND period = ?4 LIMIT 1`).bind(actionId, attemptRequestId, userId, period).first()
    return retry ? { ...retry, admitted: retry.status === "reserved", duplicate: true } : { admitted: false, reason: "action_unavailable" }
  }
}

export async function finishX20Attempt(env, { attemptId, actionId, status, now = new Date() }) {
  const updatedAt = now.toISOString()
  await env.DB.batch([
    env.DB.prepare(`UPDATE x20_provider_attempts SET status = ?1, updatedAt = ?2 WHERE attemptId = ?3 AND actionId = ?4`).bind(status, updatedAt, attemptId, actionId),
    env.DB.prepare(`UPDATE x20_request_ledger SET status = ?1, updatedAt = ?2 WHERE actionId = ?3`).bind(status === "succeeded" ? "succeeded" : status, updatedAt, actionId),
  ])
}
