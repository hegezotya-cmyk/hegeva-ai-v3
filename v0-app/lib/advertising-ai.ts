import type { AdvertisingBrief } from "./advertising-workflows"

export function buildAdvertisingPrompt(brief: AdvertisingBrief) {
  const task = brief.kind === "advertisement-improver-brief" ? "AUDIT AND IMPROVE" : "CREATE"
  return [
    "You are HEGEVA Advertising Studio, a rigorous business advertising strategist.",
    `TASK: ${task} one campaign using only the supplied facts.`,
    `OUTPUT LANGUAGE: ${brief.language}. CHANNEL: ${brief.channel}.`,
    "Return concise plain text with exactly these sections: DIAGNOSIS, STRONGER OFFER, PRIMARY COPY, CTA, THREE VARIATIONS, TRUST CHECK.",
    "The three variations must be clearly numbered and adapted to the selected channel.",
    "Never invent prices, guarantees, testimonials, certifications, performance figures, customer results or product capabilities.",
    "If a claim is unsupported, flag it in TRUST CHECK instead of presenting it as fact.",
    `PRODUCT OR SERVICE: ${brief.productOrService}`,
    `AUDIENCE: ${brief.targetAudience}`,
    `OBJECTIVE: ${brief.campaignObjective}`,
    `CURRENT AD: ${brief.advertisementText || "None — create from the approved facts."}`,
    `SOURCE URL (reference only; do not claim it was visited): ${brief.sourceUrl || "Not supplied"}`,
    `OFFER: ${brief.offer || "Not supplied"}`,
    `REQUESTED CTA: ${brief.callToAction || "Not supplied"}`,
    `BENEFITS: ${(brief.keyBenefits || []).join(" | ") || "Not supplied"}`,
    `TONE: ${brief.tone || "Professional and credible"}`,
    `RESTRICTIONS: ${(brief.restrictions || []).join(" | ") || "None supplied"}`,
  ].join("\n")
}

export async function generateAdvertisingCampaign(brief: AdvertisingBrief) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch("/api/creative/generate", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({operationId:crypto.randomUUID(),requestId:crypto.randomUUID(),operationType:brief.kind==="advertisement-improver-brief"?"analysis":"copy",locale:brief.language,channel:brief.channel,productOrService:brief.productOrService,targetAudience:brief.targetAudience,objective:brief.campaignObjective,currentAd:brief.advertisementText||"",sourceUrl:brief.sourceUrl||"",offer:brief.offer||"",cta:brief.callToAction||"",benefits:(brief.keyBenefits||[]).join(" | "),visualDirection:brief.mediaDescription||""}),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "unavailable")
    const result = typeof data?.text === "string" ? data.text.trim() : ""
    if (!result) throw new Error("empty")
    return {text:result.slice(0,8000),credits:data?.credits}
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function generateAdvertisingImage(brief:AdvertisingBrief){
 const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),35000)
 try{const response=await fetch("/api/creative/generate",{method:"POST",credentials:"include",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({operationId:crypto.randomUUID(),requestId:crypto.randomUUID(),operationType:"image",locale:brief.language,channel:brief.channel,productOrService:brief.productOrService,targetAudience:brief.targetAudience,objective:brief.campaignObjective,offer:brief.offer||"",cta:brief.callToAction||"",benefits:(brief.keyBenefits||[]).join(" | "),visualDirection:brief.mediaDescription||"premium commercial advertising visual"})});const data=await response.json().catch(()=>null);if(!response.ok)throw new Error(typeof data?.error==="string"?data.error:"unavailable");if(typeof data?.image!=="string"||!data.image.startsWith("data:image/"))throw new Error("invalid-image");return{image:data.image,credits:data.credits}}finally{window.clearTimeout(timeout)}
}
