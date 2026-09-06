const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const CREATIVE_CREDIT_ALLOWANCE = Object.freeze({ basic: 0, premium: 100, pro: 300 })
export const CREATIVE_CREDIT_COST = Object.freeze({ analysis: 1, copy: 2, image: 8, video: 40 })
export const CREATIVE_PROVIDER_CLASS = Object.freeze({ analysis: "workers-ai-text", copy: "workers-ai-text", image: "approved-image-provider", video: "approved-video-provider" })

export function creativeProviderCapability(env, plan) {
  const entitled = plan === "premium" || plan === "pro"
  const textEnabled = env?.AI_PROVIDER_ENABLED === "enabled" && env?.AI_GLOBAL_KILL_SWITCH === "disabled" && Boolean(env?.AI)
  const imageEnabled = env?.CREATIVE_IMAGE_PROVIDER_ENABLED === "enabled" && Boolean(env?.CREATIVE_IMAGE_PROVIDER)
  const videoEnabled = env?.CREATIVE_VIDEO_PROVIDER_ENABLED === "enabled" && Boolean(env?.CREATIVE_VIDEO_PROVIDER)
  return { entitled, plan, allowance: CREATIVE_CREDIT_ALLOWANCE[plan] || 0, providers: { text: textEnabled, image: imageEnabled, video: videoEnabled }, publishing: false, outputState: "draft-review" }
}

export async function readCreativeCredits(db, userId, period, plan) {
  const allowance = CREATIVE_CREDIT_ALLOWANCE[plan] || 0
  if (!allowance) return { allowance: 0, used: 0, reserved: 0, remaining: 0 }
  await db.prepare("INSERT INTO creative_credit_accounts(userId,period,plan,allowance,used,reserved,updatedAt) VALUES(?1,?2,?3,?4,0,0,?5) ON CONFLICT(userId,period) DO UPDATE SET plan=excluded.plan,allowance=MAX(used+reserved,excluded.allowance),updatedAt=excluded.updatedAt").bind(userId,period,plan,allowance,new Date().toISOString()).run()
  const row = await db.prepare("SELECT allowance,used,reserved FROM creative_credit_accounts WHERE userId=?1 AND period=?2").bind(userId,period).first()
  return { allowance:Number(row.allowance),used:Number(row.used),reserved:Number(row.reserved),remaining:Math.max(0,Number(row.allowance)-Number(row.used)-Number(row.reserved)) }
}

export async function reserveCreativeCredits(db, { operationId, requestId, userId, period, plan, operationType, now=new Date() }) {
  if (!UUID.test(operationId)||!UUID.test(requestId)||!CREATIVE_CREDIT_COST[operationType]) return { reserved:false, reason:"invalid-operation" }
  if (plan!=="premium"&&plan!=="pro") return { reserved:false, reason:"premium-required" }
  await readCreativeCredits(db,userId,period,plan)
  try {
    await db.prepare("INSERT INTO creative_credit_operations(operationId,requestId,userId,period,operationType,reservedCredits,providerClass,status,createdAt) VALUES(?1,?2,?3,?4,?5,?6,?7,'reserved',?8)").bind(operationId,requestId,userId,period,operationType,CREATIVE_CREDIT_COST[operationType],CREATIVE_PROVIDER_CLASS[operationType],now.toISOString()).run()
    return { reserved:true, operationId, credits:CREATIVE_CREDIT_COST[operationType] }
  } catch (error) {
    const duplicate=await db.prepare("SELECT operationId,status FROM creative_credit_operations WHERE requestId=?1 OR operationId=?2 LIMIT 1").bind(requestId,operationId).first()
    if(duplicate)return{reserved:false,reason:"duplicate-operation",operationId:duplicate.operationId,status:duplicate.status}
    return{reserved:false,reason:/exhausted/i.test(String(error?.message||error))?"credits-exhausted":"reservation-unavailable"}
  }
}

export async function settleCreativeCredits(db,{operationId,userId,success,failureCode=null,settledCredits,now=new Date()}){
  const row=await db.prepare("SELECT reservedCredits,status FROM creative_credit_operations WHERE operationId=?1 AND userId=?2").bind(operationId,userId).first()
  if(!row||row.status!=="reserved")return{settled:false}
  const used=success?Math.max(0,Math.min(Number(row.reservedCredits),Number.isFinite(settledCredits)?Math.ceil(settledCredits):Number(row.reservedCredits))):0
  const status=success?"succeeded":"failed"
  const result=await db.prepare("UPDATE creative_credit_operations SET status=?1,settledCredits=?2,failureCode=?3,completedAt=?4 WHERE operationId=?5 AND userId=?6 AND status='reserved'").bind(status,used,success?null:String(failureCode||"provider-failure").slice(0,64),now.toISOString(),operationId,userId).run()
  return{settled:Number(result?.meta?.changes||0)===1,status,credits:used}
}
