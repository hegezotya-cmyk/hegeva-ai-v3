const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function iso(value = new Date()) {
  return (value instanceof Date ? value : new Date(value)).toISOString()
}

export async function readAssistantTopUpBalance(env, userId) {
  if (!userId) return 0
  const row = await env.DB.prepare(
    "SELECT availableCredits FROM assistant_topup_wallets WHERE userId = ?1 LIMIT 1"
  ).bind(userId).first()
  const value = Number(row?.availableCredits)
  return Number.isSafeInteger(value) && value >= 0 ? value : 0
}

export async function reserveAssistantTopUpCredit(env, { operationId, userId, now = new Date() }) {
  if (!UUID_V4.test(String(operationId || "")) || !userId) {
    return { reserved: false, reason: "invalid_topup_operation" }
  }
  const createdAt = iso(now)
  try {
    await env.DB.prepare(
      "INSERT INTO assistant_topup_operations (operationId,userId,purchaseSource,credits,status,createdAt,updatedAt) VALUES (?1,?2,'prepaid-topup',1,'reserved',?3,?3)"
    ).bind(operationId, userId, createdAt).run()
    return { reserved: true, operationId, creditSource: "topup" }
  } catch (error) {
    const existing = await env.DB.prepare(
      "SELECT operationId,userId,status FROM assistant_topup_operations WHERE operationId = ?1 LIMIT 1"
    ).bind(operationId).first()
    if (existing) {
      if (existing.userId !== userId) throw new Error("assistant topup operation ownership mismatch")
      return { reserved: false, reason: "duplicate_topup_operation" }
    }
    if (/assistant topup credit unavailable/i.test(String(error?.message || error))) {
      return { reserved: false, reason: "topup_credit_unavailable" }
    }
    throw error
  }
}

export async function finishAssistantTopUpCredit(env, { operationId, status, now = new Date() }) {
  if (!UUID_V4.test(String(operationId || ""))) {
    return { settled: false, reason: "invalid_topup_operation" }
  }
  const normalized = status === "succeeded" ? "succeeded" : status === "timed_out" ? "timed_out" : "failed"
  const result = await env.DB.prepare(
    "UPDATE assistant_topup_operations SET status = ?1, updatedAt = ?2 WHERE operationId = ?3 AND status = 'reserved'"
  ).bind(normalized, iso(now), operationId).run()
  const settled = Number(result?.meta?.changes || 0) === 1
  return { settled, duplicate: !settled, status: normalized }
}

export async function grantAssistantTopUpPurchase(env, {
  purchaseId,
  userId,
  stripeCheckoutSessionId,
  stripePaymentIntentId = null,
  stripeEventId,
  packCode,
  credits,
  amountTotal,
  currency,
  now = new Date(),
}) {
  if (!purchaseId || !userId || !stripeCheckoutSessionId || !stripeEventId || !packCode) {
    return { granted: false, reason: "invalid_topup_purchase" }
  }
  if (!Number.isSafeInteger(credits) || credits <= 0 || !Number.isSafeInteger(amountTotal) || amountTotal < 0) {
    return { granted: false, reason: "invalid_topup_purchase" }
  }
  const createdAt = iso(now)
  try {
    const purchase = env.DB.prepare(`
      INSERT INTO assistant_topup_purchases
        (purchaseId,userId,stripeCheckoutSessionId,stripePaymentIntentId,packCode,credits,amountTotal,currency,status,stripeEventId,createdAt,updatedAt)
      VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'paid',?9,?10,?10)
    `).bind(purchaseId,userId,stripeCheckoutSessionId,stripePaymentIntentId,packCode,credits,amountTotal,String(currency || "").toLowerCase(),stripeEventId,createdAt)
    const wallet = env.DB.prepare(`
      INSERT INTO assistant_topup_wallets
        (userId,availableCredits,purchasedCredits,consumedCredits,refundedCredits,createdAt,updatedAt)
      VALUES (?1,?2,?2,0,0,?3,?3)
      ON CONFLICT(userId) DO UPDATE SET
        availableCredits = availableCredits + excluded.availableCredits,
        purchasedCredits = purchasedCredits + excluded.purchasedCredits,
        updatedAt = excluded.updatedAt
    `).bind(userId,credits,createdAt)
    await env.DB.batch([purchase,wallet])
    return { granted: true, credits }
  } catch (error) {
    const duplicate = await env.DB.prepare(
      "SELECT purchaseId,userId,credits FROM assistant_topup_purchases WHERE stripeCheckoutSessionId = ?1 OR stripeEventId = ?2 LIMIT 1"
    ).bind(stripeCheckoutSessionId,stripeEventId).first()
    if (duplicate) {
      if (duplicate.userId !== userId) throw new Error("assistant topup purchase ownership mismatch")
      return { granted: false, duplicate: true, reason: "duplicate_topup_purchase", credits: Number(duplicate.credits || 0) }
    }
    throw error
  }
}
