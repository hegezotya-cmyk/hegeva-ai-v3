import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source = fs.readFileSync(new URL("../lib/security-guard.ts", import.meta.url), "utf8")
const worker = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const proxy = fs.readFileSync(new URL("../app/api/[...path]/route.ts", import.meta.url), "utf8")
const assistant = fs.readFileSync(new URL("../components/assistant/assistant-chat.tsx", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { evaluateSecurityGuard } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const { default: workerHandler, readBodyWithinLimit, REQUEST_BODY_LIMITS } = await import("../../src/index.js")
const base = { action: "run-tool", category: "execute", userId: "u1", workspaceId: "w1", permission: "tool:run", risk: "high" }
assert.equal(evaluateSecurityGuard(base).outcome, "approval-required")
assert.equal(evaluateSecurityGuard({ ...base, approved: true }).outcome, "allow")
assert.equal(evaluateSecurityGuard({ ...base, userId: undefined, approved: true }).reasonCode, "ownership-scope-required")
assert.equal(evaluateSecurityGuard({ ...base, approved: false }).outcome, "deny")
assert(/REQUEST_BODY_LIMITS\s*=\s*Object\.freeze/.test(worker), "backend must define named request limits")
assert(/chat: 64 \* 1024/.test(worker), "chat limit must cover bounded Unicode history payloads")
assert(/workspace: 768 \* 1024/.test(worker), "workspace limit must cover the UTF-8 expansion of valid data")
for (const name of ["auth", "chat", "contact", "workspace", "billing", "email"]) {
  assert(new RegExp(`${name}:`).test(worker), `backend must define the ${name} limit`)
}
assert(/readBodyWithinLimit/.test(worker) && /reader\.read\(\)/.test(worker), "backend must stream request bodies")
assert(/total > limit/.test(worker) && /reader\.cancel\(\)/.test(worker), "backend must stop oversized streams immediately")
assert(/declaredBytes > limit/.test(worker), "backend must reject declared oversized bodies")
assert(/enforceRequestBodyLimit/.test(worker) && /request = limitedRequest/.test(worker), "backend limit must run before route processing")
assert(/Request body is too large\./.test(worker), "backend must use the stable 413 error")
assert(/readBodyWithinLimit/.test(proxy) && /total > limit/.test(proxy) && /reader\.cancel\(\)/.test(proxy), "proxy must provide streaming defense in depth")
assert(/bodyBytes\.byteLength/.test(proxy), "proxy must forward bounded body bytes")
assert(!/console\.error\([^\n]*data/.test(worker), "backend must not log provider response bodies")
assert(/HEGEVA_PROVIDER_FAILURE/.test(worker), "provider failures must use stable safe logging")
const emailStatusStart = worker.indexOf('"/api/system/email-status"')
const emailStatusEnd = worker.indexOf("// SECURITY EMAIL TEST", emailStatusStart)
const emailStatusBlock = worker.slice(emailStatusStart, emailStatusEnd)
assert(/passwordRecovery:\s*Boolean\(env\.RESEND_API_KEY\)/.test(emailStatusBlock), "email status must expose only recovery readiness")
assert(!/(configured|provider|sender|resetLinkExpiresInSeconds|revokeSessionsOnPasswordReset)/.test(emailStatusBlock), "email status must not expose operational configuration")
for (const status of [401, 409, 413, 429, 503]) {
  assert(new RegExp(`response\.status === ${status}`).test(assistant), `Assistant must provide status-specific ${status} guidance`)
}
assert(/Retry-After/.test(assistant) && /Math\.min\(300/.test(assistant), "Assistant Retry-After handling must be bounded")
assert(/pendingOperationRef\.current = \{ message: cleanMessage, operationId \}/.test(assistant), "Assistant must preserve the same operation ID after ambiguous failures")
assert(/controller\.signal\.aborted/.test(assistant), "Assistant must provide interruption/network recovery guidance")

function streamedRequest(chunks, contentLength) {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk))
      controller.close()
    },
  })
  const headers = contentLength === undefined ? {} : { "content-length": String(contentLength) }
  return new Request("https://hegevaai.co.uk/api/test", { method: "POST", headers, body: stream, duplex: "half" })
}

assert.equal((await readBodyWithinLimit(streamedRequest(["1234"]), 4)).byteLength, 4, "exact boundary must be accepted")
assert.equal(await readBodyWithinLimit(streamedRequest(["1234", "5"]), 4), null, "chunked oversized body must be rejected")
assert.equal(await readBodyWithinLimit(streamedRequest(["12345"]), 4), null, "missing content length must still be bounded")
assert.equal(await readBodyWithinLimit(streamedRequest(["12345"], 1), 4), null, "false-small content length must not bypass the stream limit")
assert.equal(await readBodyWithinLimit(streamedRequest(["1"], 5), 4), null, "declared oversized body must be rejected before processing")
const maxWorkspaceData = "漢".repeat(249998)
const maxWorkspaceBody = JSON.stringify({ data: maxWorkspaceData })
assert.equal(JSON.stringify(maxWorkspaceData).length, 250000, "maximum workspace data must match the application boundary")
assert.ok((await readBodyWithinLimit(new Request("https://hegevaai.co.uk/api/workspace/customers", { method: "POST", body: maxWorkspaceBody }), REQUEST_BODY_LIMITS.workspace)).byteLength > 0, "maximum valid workspace payload must be accepted")
const hungarianData = ("árvíztűrő tükörfúrógép ".repeat(20000)).slice(0, 249998)
assert.ok(JSON.stringify(hungarianData).length <= 250000, "Hungarian workspace data must remain within the application boundary")
assert.ok((await readBodyWithinLimit(new Request("https://hegevaai.co.uk/api/workspace/customers", { method: "POST", body: JSON.stringify({ data: hungarianData }) }), REQUEST_BODY_LIMITS.workspace)).byteLength > 0, "representative Unicode workspace payload must be accepted")
const firstOversizedWorkspaceBody = JSON.stringify({ data: "漢".repeat(262141) })
assert.ok(new TextEncoder().encode(firstOversizedWorkspaceBody).byteLength > REQUEST_BODY_LIMITS.workspace, "oversized workspace test must exceed the byte boundary")
const rejectedWorkspace = await workerHandler.fetch(new Request("https://hegevaai.co.uk/api/workspace/customers", { method: "PUT", body: firstOversizedWorkspaceBody, headers: { "Content-Type": "application/json" } }), {})
assert.equal(rejectedWorkspace.status, 413, "oversized workspace must be rejected before D1 processing")
for (const [path, limit] of [
  ["/api/chat", REQUEST_BODY_LIMITS.chat],
  ["/api/contact", REQUEST_BODY_LIMITS.contact],
  ["/api/workspace/customers", REQUEST_BODY_LIMITS.workspace],
  ["/api/auth/sign-in/email", REQUEST_BODY_LIMITS.auth],
  ["/api/billing/checkout", REQUEST_BODY_LIMITS.billing],
]) {
  const response = await workerHandler.fetch(new Request(`https://hegevaai.co.uk${path}`, {
    method: "POST",
    body: "x".repeat(limit + 1),
    headers: { "Content-Type": "application/json" },
  }), {})
  assert.equal(response.status, 413, `${path} must reject before downstream processing`)
}
console.log("Security Guard audit passed")
