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
    const response = await fetch("/api/chat", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: buildAdvertisingPrompt(brief).slice(0, 2500), history: [], language: brief.language, mode: "general", assistantOperationId: crypto.randomUUID() }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "unavailable")
    const result = typeof data?.response === "string" ? data.response.trim() : ""
    if (!result) throw new Error("empty")
    return result.slice(0, 8000)
  } finally {
    window.clearTimeout(timeout)
  }
}
