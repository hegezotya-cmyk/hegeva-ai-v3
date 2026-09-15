import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequestHandler } from "../../src/index.js"
import { emailContentDigest } from "../../src/email-delivery-governance.js"

const action = { id: "delivery-action", actionType: "email-draft", recipient: "customer@example.test", subject: "Follow up", body: "Exact preview", approvalState: "ready-to-execute", workflowStatus: "ready-to-execute", readyVersion: 1, deliveryStatus: "not-sent", executionStatus: "not-executed", audit: [] }
function fakeDb() {
  const state = { messages: JSON.stringify([action]), updatedAt: "2026-09-15T12:00:00.000Z", operations: new Map(), history: [] }
  const db = {
    prepare(sql) {
      return { bind(...args) {
        return {
          async first() {
            if (sql.includes("workspace_data")) return { data: state.messages, updatedAt: state.updatedAt }
            if (sql.includes("email_delivery_operations")) return state.operations.get(`${args[0]}:${args[1]}:${args[2]}`) || null
            return null
          },
          async run() {
            if (sql.includes("INSERT INTO email_delivery_operations")) { const key = `${args[1]}:${args[2]}:${args[3]}`; if (state.operations.has(key)) throw new Error("duplicate"); state.operations.set(key, { status: "sending" }); return { meta: { changes: 1 } } }
            if (sql.includes("INSERT INTO email_delivery_history")) { state.history.push(args); return { meta: { changes: 1 } } }
            if (sql.includes("UPDATE email_delivery_operations")) { for (const record of state.operations.values()) record.status = args[0]; return { meta: { changes: 1 } } }
            if (sql.includes("UPDATE workspace_data")) { if (args.length === 4 && state.updatedAt !== args[3]) return { meta: { changes: 0 } }; state.messages = args[0]; state.updatedAt = args[1]; return { meta: { changes: 1 } } }
            return { meta: { changes: 1 } }
          },
        }
      } }
    },
    async batch(items) { return Promise.all(items.map((item) => item.run())) },
  }
  return { db, state }
}
const post = (body) => new Request("https://hegevaai.co.uk/api/external-actions/email-delivery/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
const handler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "owner" }) }), anonymous = createRequestHandler({ getLoggedInUserFn: async () => null })
function fakeLimiter({ allowed = true, throws = false } = {}) { return { getByName(name) { return { async admit() { if (throws) throw new Error("limiter unavailable"); return allowed ? { allowed: true, token: `${name}:token` } : { allowed: false, retryAfterMs: 1000 } }, async release() { return { released: true } } } } } }
const originalFetch = globalThis.fetch
try {
  const disabled = fakeDb(), digest = await emailContentDigest(action)
  assert.equal((await handler.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: disabled.db, EMAIL_DELIVERY_ENABLED: "disabled" }, {})).status, 503)
  assert.equal((await anonymous.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: disabled.db, EMAIL_DELIVERY_ENABLED: "enabled" }, {})).status, 401)
  assert.equal((await handler.fetch(post({ actionId: action.id, confirmationDigest: "0".repeat(64) }), { DB: disabled.db, EMAIL_DELIVERY_ENABLED: "enabled", RATE_LIMITER: fakeLimiter() }, {})).status, 409)
  const success = fakeDb(); let calls = 0; globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ id: "provider-message-1" }), { status: 200 }) }
  const sent = await handler.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: success.db, EMAIL_DELIVERY_ENABLED: "enabled", RESEND_API_KEY: "mock", RATE_LIMITER: fakeLimiter() }, {})
  assert.equal(sent.status, 200); assert.equal((await sent.json()).status, "sent"); assert.equal(calls, 1); assert.equal(success.state.history.length, 2)
  assert.equal((await handler.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: success.db, EMAIL_DELIVERY_ENABLED: "enabled", RESEND_API_KEY: "mock", RATE_LIMITER: fakeLimiter() }, {})).status, 409, "duplicate action confirmation must be blocked")
  const limited = fakeDb(); assert.equal((await handler.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: limited.db, EMAIL_DELIVERY_ENABLED: "enabled", RATE_LIMITER: fakeLimiter({ allowed: false }) }, {})).status, 429, "limit exceeded must return 429")
  const unavailable = fakeDb(); assert.equal((await handler.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: unavailable.db, EMAIL_DELIVERY_ENABLED: "enabled", RATE_LIMITER: fakeLimiter({ throws: true }) }, {})).status, 503, "limiter failure must fail closed")
  const failed = fakeDb(); globalThis.fetch = async () => new Response("no", { status: 503 })
  assert.equal((await handler.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: failed.db, EMAIL_DELIVERY_ENABLED: "enabled", RESEND_API_KEY: "mock", RATE_LIMITER: fakeLimiter() }, {})).status, 503)
  const timeout = fakeDb(); globalThis.fetch = async () => { const error = new Error("timeout"); error.name = "AbortError"; throw error }
  const timeoutResponse = await handler.fetch(post({ actionId: action.id, confirmationDigest: digest }), { DB: timeout.db, EMAIL_DELIVERY_ENABLED: "enabled", RESEND_API_KEY: "mock", RATE_LIMITER: fakeLimiter() }, {})
  assert.equal(timeoutResponse.status, 503); assert.equal((await timeoutResponse.json()).status, "uncertain")
} finally { globalThis.fetch = originalFetch }
const worker = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8"), migration = fs.readFileSync(new URL("../../migrations/0021_email_delivery_operations.sql", import.meta.url), "utf8")
assert(worker.includes('env.EMAIL_DELIVERY_ENABLED !== "enabled"') && worker.includes("Idempotency-Key") === false && worker.includes("idempotencyKey: operationId"))
assert(worker.includes("email-delivery-rate-limit:${user.id}") && worker.includes("Email delivery rate limit reached") && worker.includes("email_delivery_rate_limit_failed"))
assert(migration.includes("UNIQUE(userId, actionId, readyVersion)") && migration.includes("email_delivery_history_no_update") && migration.includes("email_delivery_history_no_delete"))
console.log("Owner-approved email delivery audit passed: mocked provider, auth, stale confirmation, idempotency, immutable history, and kill switch.")
