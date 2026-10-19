import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source = fs.readFileSync(new URL("../lib/rate-limit-policy.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { RATE_LIMIT_POLICIES, getRateLimitPolicy, rateLimitHeaders } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
for (const category of ["auth", "chat", "studio", "billing", "workspace", "admin", "contact"]) assert.ok(getRateLimitPolicy(category).limit > 0)
assert.equal(RATE_LIMIT_POLICIES.auth.key, "ip")
assert.equal(RATE_LIMIT_POLICIES.chat.key, "user")
assert.equal(rateLimitHeaders(RATE_LIMIT_POLICIES.chat, 3, 1700000000000)["X-RateLimit-Remaining"], "3")
console.log("Rate-limit policy audit passed")
