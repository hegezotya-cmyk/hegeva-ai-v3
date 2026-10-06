import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { boundAssistantProviderPayload, buildWorkersAiProjection, ASSISTANT_MODEL_TIERS } from "../../src/cloudflare-ai-provider.js"

const languageCases = {
  en: ["What is HEGEVA AI?", "Respond in English."],
  hu: ["Mi a HEGEVA AI?", "Respond in Hungarian."],
  de: ["Was ist HEGEVA AI?", "Respond in German."],
  fr: ["Qu'est-ce que HEGEVA AI ?", "Respond in French."],
  es: ["¿Qué es HEGEVA AI?", "Respond in Spanish."],
}

let systemPrompt = ""
for (const [locale, [prompt, policy]] of Object.entries(languageCases)) {
  const projection = buildWorkersAiProjection({ operation: "assistant", locale, prompt })
  const bounded = boundAssistantProviderPayload(ASSISTANT_MODEL_TIERS.standard, projection)
  assert.equal(bounded.ok, true, `${locale} HEGEVA question should produce a valid provider request`)
  const currentSystemPrompt = bounded.request.messages.find((message) => message.role === "system")?.content ?? ""
  assert.match(currentSystemPrompt, new RegExp(policy.replace(".", "\\.")), `${locale} must use its configured response language`)
  if (locale === "en") systemPrompt = currentSystemPrompt
}

assert.match(systemPrompt, /You are Ashna/i, "system prompt must identify the assistant as Ashna")
assert.match(systemPrompt, /HEGEVA AI/i, "system prompt must identify Ashna as part of HEGEVA AI")
assert.match(systemPrompt, /HEGEVA Core/i, "system prompt must establish Ashna's Core role")
assert.match(systemPrompt, /UK small.business/i, "system prompt must establish its UK small-business audience")
assert.match(systemPrompt, /UK-focused small-business workspace/i, "system prompt must ground HEGEVA's actual product scope")
assert.match(systemPrompt, /complete final sentence/i, "system prompt must require complete answers")
assert.match(systemPrompt, /requested language policy/i, "system prompt must require the selected response language")
assert.match(systemPrompt, /approval required/i, "external-effect proposals must require approval")
assert.match(systemPrompt, /etymology/i, "system prompt must prevent invented explanations of the HEGEVA name")
assert.match(systemPrompt, /live data/i, "system prompt must disclose lack of live data for current opportunities")
assert.match(systemPrompt, /Do not call tools or execute actions/i, "existing no-tools/no-actions boundary must remain")

const assistantChat = await readFile(new URL("../components/assistant/assistant-chat.tsx", import.meta.url), "utf8")
assert.match(assistantChat, /Ashna · HEGEVA Core/, "Assistant UI must identify Ashna as the HEGEVA Core copilot")
assert.match(assistantChat, /Prepared actions always require your approval/, "Assistant UI must disclose approval requirements")

console.log("HEGEVA Assistant identity audit passed")
