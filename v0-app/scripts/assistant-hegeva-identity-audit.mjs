import assert from "node:assert/strict"
import { boundAssistantProviderPayload, buildWorkersAiProjection, ASSISTANT_MODEL_TIERS } from "../../src/cloudflare-ai-provider.js"

const projection = buildWorkersAiProjection({
  operation: "assistant",
  locale: "hu",
  prompt: "hegeva ai rol volt szo?",
})
const bounded = boundAssistantProviderPayload(ASSISTANT_MODEL_TIERS.standard, projection)
assert.equal(bounded.ok, true, "Hungarian HEGEVA question should produce a valid provider request")

const systemPrompt = bounded.request.messages.find((message) => message.role === "system")?.content ?? ""
assert.match(systemPrompt, /You are Ashna/i, "system prompt must identify the assistant as Ashna")
assert.match(systemPrompt, /HEGEVA AI/i, "system prompt must identify Ashna as part of HEGEVA AI")
assert.match(systemPrompt, /HEGEVA Core/i, "system prompt must establish Ashna's Core role")
assert.match(systemPrompt, /UK small.business/i, "system prompt must establish its UK small-business audience")
assert.match(systemPrompt, /English by default/i, "system prompt must default Ashna to English")
assert.match(systemPrompt, /approval required/i, "external-effect proposals must require approval")
assert.match(systemPrompt, /etymology/i, "system prompt must prevent invented explanations of the HEGEVA name")
assert.match(systemPrompt, /live data/i, "system prompt must disclose lack of live data for current opportunities")
assert.match(systemPrompt, /Do not call tools or execute actions/i, "existing no-tools/no-actions boundary must remain")

console.log("HEGEVA Assistant identity audit passed")
