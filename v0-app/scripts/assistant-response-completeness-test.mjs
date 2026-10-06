import assert from "node:assert/strict"
import { ensureCompleteAssistantResponse } from "../../src/cloudflare-ai-provider.js"

assert.equal(ensureCompleteAssistantResponse("A complete answer.", "hu"), "A complete answer.")
assert.equal(
  ensureCompleteAssistantResponse("A complete sentence. An unfinished tail", "hu"),
  "A complete sentence. A válasz generálása félbeszakadt. Kérlek, kérdezd újra rövidebben.",
)
assert.equal(
  ensureCompleteAssistantResponse("Unfinished answer", "en"),
  "The answer was interrupted. Please ask again more briefly.",
)
assert.equal(
  ensureCompleteAssistantResponse("Eine Antwort ist fertig.", "de"),
  "Eine Antwort ist fertig.",
)
assert.equal(
  ensureCompleteAssistantResponse("Réponse terminée !", "fr"),
  "Réponse terminée !",
)
assert.equal(
  ensureCompleteAssistantResponse("Respuesta completa.", "es"),
  "Respuesta completa.",
)
console.log("Assistant response completeness tests passed")
