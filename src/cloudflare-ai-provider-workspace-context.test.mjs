import assert from "node:assert/strict"
import {
  boundAssistantProviderPayload,
  buildWorkersAiProjection,
  resolveAssistantModelTier,
} from "./cloudflare-ai-provider.js"

const tierResult = resolveAssistantModelTier({ tier: "standard", plan: "premium" })
assert.equal(tierResult.ok, true)

const workspaceContext = "customers=2; open_tasks=1; overdue_invoices=0; outstanding_GBP=0.00"
const projection = buildWorkersAiProjection({
  operation: "assistant",
  locale: "hu",
  prompt: "Foglald össze az aktuális munkaterületemet.",
  workspaceContext,
})
assert.equal(projection.prompt, "Foglald össze az aktuális munkaterületemet.")
assert.equal(projection.workspaceContext, workspaceContext)

const payload = boundAssistantProviderPayload(tierResult.tier, projection)
assert.equal(payload.ok, true)
assert.match(payload.request.messages[0].content, /Authenticated workspace facts for the signed-in user/)
assert.match(payload.request.messages[0].content, /customers=2; open_tasks=1/)
assert.equal(payload.request.messages[1].content, projection.prompt, "the actual user prompt remains separate from trusted context")

const invoiceQuestion = "Elfogadott, CRM-ügyfélhez kapcsolt ajánlatból hogyan készül számlapiszkozat?"
const invoicePayload = boundAssistantProviderPayload(tierResult.tier, buildWorkersAiProjection({
  operation: "assistant",
  locale: "hu",
  prompt: invoiceQuestion,
  workspaceContext,
}))
assert.equal(invoicePayload.ok, true)
assert.match(invoicePayload.request.messages[0].content, /elfogadott, CRM-ügyfélhez kapcsolt ajánlatot.*Create invoice.*számlapiszkozatot készít automatikus kiküldés nélkül/)
assert.match(invoicePayload.request.messages[0].content, /Omit them from how-to answers/)
assert.equal(invoicePayload.request.messages[1].content, invoiceQuestion)

const noContext = boundAssistantProviderPayload(tierResult.tier, buildWorkersAiProjection({
  operation: "assistant",
  locale: "en",
  prompt: "What should I prioritize?",
}))
assert.equal(noContext.ok, true)
assert.equal(noContext.request.messages[0].content.includes(workspaceContext), false)

const bounded = buildWorkersAiProjection({
  operation: "assistant",
  locale: "en",
  prompt: "Summarize my workspace.",
  workspaceContext: "x".repeat(2_000),
})
assert.equal(bounded.workspaceContext.length, 1_200)
console.log("Cloudflare AI workspace context tests passed")
