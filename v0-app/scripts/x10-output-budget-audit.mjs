import assert from "node:assert/strict"
import { selectAiOutputTokens } from "../../src/index.js"
import { handleAiChatAdmission } from "../../src/ai-chat-admission.js"

assert.equal(selectAiOutputTokens({ appStudioProfile: "x10" }), 1800)
for (const value of [undefined, null, "", "x20", "admin", 1800, [], {}]) {
  assert.equal(selectAiOutputTokens({ appStudioProfile: value }), 700)
  assert.equal(selectAiOutputTokens({ isX20Action: true, appStudioProfile: value }), 700)
}

const calls = []
const runtime = { inFlight: new Set(), lastRequest: new Map() }
const result = await handleAiChatAdmission({
  request: new Request("https://example.test/api/chat", { method: "POST", body: JSON.stringify({ message: "x", appStudioProfile: "x10" }), headers: { "content-type": "application/json" } }),
  user: { id: "audit-user" }, planInfo: { plan: "basic", limit: 50 }, period: "2026-08", runtime,
  distributed: { admit: async () => ({ allowed: true, token: "audit-token" }), release: async () => {} },
  reserve: async () => { calls.push("reserve"); return { reserved: false } }, readUsage: async () => 50,
  execute: async () => { calls.push("provider"); return { response: "unexpected" } }, now: () => 2_000, cooldownMs: 0,
})
assert.equal(result.status, 429)
assert.deepEqual(calls, ["reserve"], "rejected admission must precede and prevent provider invocation")

console.log("X10 output-budget audit passed: allowlisted 1800 profile, default 700, X20 isolation and admission-before-provider ordering")
