const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const ASSISTANT_TOPUP_PACKS = Object.freeze({
  small: Object.freeze({ code: "small", credits: 100, amount: 199, currency: "gbp" }),
  medium: Object.freeze({ code: "medium", credits: 300, amount: 399, currency: "gbp" }),
  large: Object.freeze({ code: "large", credits: 1000, amount: 799, currency: "gbp" }),
})
function iso(value = new Date()) { return (value instanceof Date ? value : new Date(value)).toISOString() }
async function fifoLot(env, userId) {
  return env.DB.prepare(`SELECT lotId FROM assistant_topup_credit_lots WHERE userId=?1 AND remainingCredits>0 AND paymentState='paid' ORDER BY createdAt, lotId LIMIT 1`).bind(userId).first()
}
export async function readAssistantTopUpBalance(env, userId) {
  if (!userId) return 0
  const row = await env.DB.prepare("SELECT availableCredits FROM assistant_topup_wallets WHERE userId=?1 LIMIT 1").bind(userId).first()
  const value = Number(row?.availableCredits)
  return Number.isSafeInteger(value) && value >= 0 ? value : 0
}
export async function reserveAssistantTopUpCredit(env, { operationId, userId, credits = 1, now = new Date() }) {
  if (!UUID_V4.test(String(operationId || "")) || !userId || !Number.isSafeInteger(credits) || credits <= 0) return { reserved:false, reason:"invalid_topup_operation" }
  const lot = await fifoLot(env, userId)
  if (!lot?.lotId) return { reserved:false, reason:"topup_credit_unavailable" }
  const createdAt = iso(now)
  try {
    await env.DB.prepare("INSERT INTO assistant_topup_operations (operationId,userId,purchaseSource,credits,status,createdAt,updatedAt,lotId) VALUES (?1,?2,'prepaid-topup',?3,'reserved',?4,?4,?5)").bind(operationId,userId,credits,createdAt,lot.lotId).run()
    return { reserved:true, operationId, creditSource:"topup", lotId:lot.lotId, credits }
  } catch (error) {
    const existing = await env.DB.prepare("SELECT operationId,userId,status,lotId FROM assistant_topup_operations WHERE operationId=?1 LIMIT 1").bind(operationId).first()
    if (existing) { if (existing.userId !== userId) throw new Error("assistant topup operation ownership mismatch"); return { reserved:false, reason:"duplicate_topup_operation", lotId:existing.lotId || null } }
    if (/assistant topup (credit|lot) unavailable/i.test(String(error?.message || error))) return { reserved:false, reason:"topup_credit_unavailable" }
    throw error
  }
}
export async function finishAssistantTopUpCredit(env, { operationId, status, now = new Date() }) {
  if (!UUID_V4.test(String(operationId || ""))) return { settled:false, reason:"invalid_topup_operation" }
  const normalized = status === "succeeded" ? "succeeded" : status === "timed_out" ? "timed_out" : "failed"
  const result = await env.DB.prepare("UPDATE assistant_topup_operations SET status=?1,updatedAt=?2 WHERE operationId=?3 AND status='reserved'").bind(normalized,iso(now),operationId).run()
  const settled = Number(result?.meta?.changes || 0) === 1
  return { settled, duplicate:!settled, status:normalized }
}
export async function grantAssistantTopUpPurchase(env, { purchaseId,userId,stripeCheckoutSessionId,stripePaymentIntentId=null,stripeChargeId=null,stripeEventId,packCode,credits,amountTotal,currency,now=new Date() }) {
  if (!purchaseId || !userId || !stripeCheckoutSessionId || !stripeEventId || !packCode) return { granted:false, reason:"invalid_topup_purchase" }
  if (!Number.isSafeInteger(credits) || credits<=0 || !Number.isSafeInteger(amountTotal) || amountTotal<0) return { granted:false, reason:"invalid_topup_purchase" }
  const createdAt=iso(now), lotId=`topup-lot-${purchaseId}`
  try {
    const purchase=env.DB.prepare(`INSERT INTO assistant_topup_purchases (purchaseId,userId,stripeCheckoutSessionId,stripePaymentIntentId,stripeChargeId,packCode,credits,amountTotal,currency,status,stripeEventId,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'paid',?10,?11,?11)`).bind(purchaseId,userId,stripeCheckoutSessionId,stripePaymentIntentId,stripeChargeId,packCode,credits,amountTotal,String(currency||"").toLowerCase(),stripeEventId,createdAt)
    const lot=env.DB.prepare(`INSERT INTO assistant_topup_credit_lots (lotId,purchaseId,userId,stripeCheckoutSessionId,stripePaymentIntentId,stripeChargeId,packCode,originalCredits,remainingCredits,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8,?9,?9)`).bind(lotId,purchaseId,userId,stripeCheckoutSessionId,stripePaymentIntentId,stripeChargeId,packCode,credits,createdAt)
    const wallet=env.DB.prepare(`INSERT INTO assistant_topup_wallets (userId,availableCredits,purchasedCredits,consumedCredits,refundedCredits,createdAt,updatedAt) VALUES (?1,?2,?2,0,0,?3,?3) ON CONFLICT(userId) DO UPDATE SET availableCredits=availableCredits+excluded.availableCredits,purchasedCredits=purchasedCredits+excluded.purchasedCredits,updatedAt=excluded.updatedAt`).bind(userId,credits,createdAt)
    await env.DB.batch([purchase,lot,wallet]); return { granted:true, credits, lotId }
  } catch (error) {
    const duplicate=await env.DB.prepare("SELECT purchaseId,userId,credits FROM assistant_topup_purchases WHERE stripeCheckoutSessionId=?1 OR stripeEventId=?2 LIMIT 1").bind(stripeCheckoutSessionId,stripeEventId).first()
    if (duplicate) { if (duplicate.userId!==userId) throw new Error("assistant topup purchase ownership mismatch"); return { granted:false, duplicate:true, reason:"duplicate_topup_purchase", credits:Number(duplicate.credits||0), lotId:`topup-lot-${duplicate.purchaseId}` } }
    throw error
  }
}
async function locateLot(env, identifiers) {
  const values=Object.values(identifiers).filter(Boolean); if (!values.length) return null
  const row=await env.DB.prepare(`SELECT l.*,p.purchaseId,p.amountTotal,p.currency FROM assistant_topup_credit_lots l JOIN assistant_topup_purchases p ON p.purchaseId=l.purchaseId WHERE l.stripePaymentIntentId IN (?1,?2,?3) OR l.stripeChargeId IN (?1,?2,?3) OR l.stripeCheckoutSessionId IN (?1,?2,?3) LIMIT 2`).bind(values[0]||"",values[1]||"",values[2]||"").all()
  return row.results?.length===1 ? row.results[0] : null
}
export async function reconcileAssistantTopUpFinancialEvent(env, { eventId,eventType,eventState,identifiers={},amount=null,currency=null,now=new Date() }) {
  if (!eventId || !eventType) return { reconciled:false, reason:"invalid_financial_event" }
  const lot=await locateLot(env,identifiers); if (!lot) return { reconciled:false, reason:"reconciliation_required" }
  const eventKey=`${eventType}:${eventId}`, createdAt=iso(now)
  try {
    const event=env.DB.prepare(`INSERT INTO assistant_topup_financial_events(eventKey,eventId,lotId,purchaseId,eventType,eventState,amount,currency,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)`).bind(eventKey,eventId,lot.lotId,lot.purchaseId,eventType,eventState,amount,currency,createdAt)
    const full=eventType==='dispute_created' || (eventType==='refund' && Number.isSafeInteger(amount) && amount===Number(lot.amountTotal) && String(currency||'').toLowerCase()===String(lot.currency||'').toLowerCase())
    const statements=[event]
    if (full) {
      statements.push(env.DB.prepare(`UPDATE assistant_topup_wallets SET availableCredits=availableCredits-COALESCE((SELECT remainingCredits FROM assistant_topup_credit_lots WHERE lotId=?1),0),refundedCredits=refundedCredits+COALESCE((SELECT remainingCredits FROM assistant_topup_credit_lots WHERE lotId=?1),0),updatedAt=?2 WHERE userId=?3`).bind(lot.lotId,createdAt,lot.userId))
      statements.push(env.DB.prepare(`UPDATE assistant_topup_credit_lots SET revokedCredits=revokedCredits+remainingCredits,remainingCredits=0,paymentState=CASE WHEN reservedCredits>0 THEN 'refund-pending' ELSE ?1 END,reconciliationRequired=CASE WHEN consumedCredits>0 OR reservedCredits>0 THEN 1 ELSE 0 END,updatedAt=?2 WHERE lotId=?3`).bind(eventType==='refund'?'refunded':'disputed',createdAt,lot.lotId))
    } else statements.push(env.DB.prepare("UPDATE assistant_topup_credit_lots SET paymentState='reconciliation-required',reconciliationRequired=1,updatedAt=?1 WHERE lotId=?2").bind(createdAt,lot.lotId))
    await env.DB.batch(statements); return { reconciled:true, lotId:lot.lotId, reconciliationRequired:full && (lot.consumedCredits>0||lot.reservedCredits>0) }
  } catch (error) {
    const existing=await env.DB.prepare("SELECT eventKey,lotId FROM assistant_topup_financial_events WHERE eventKey=?1 LIMIT 1").bind(eventKey).first(); if (existing) return { reconciled:false, duplicate:true, lotId:existing.lotId }; throw error
  }
}
