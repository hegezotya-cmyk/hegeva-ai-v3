import assert from "node:assert/strict"
import { createRequestHandler } from "../../src/index.js"

let providerCalls = 0
let workspaceWrites = 0
let canaryWrites = 0
let financialWrites = 0
const owner = { id: "owner-setup-user", email: "owner@example.test" }
const requestHeaders = { cookie: "session=redacted", "content-type": "application/json" }
const validProfile = {
  name: "Owner canary profile",
  purpose: "Verify one bounded owner-only AI Bot canary.",
  instructions: "Return one concise readiness statement only.",
  knowledgeScope: "No customer data and no external actions.",
  permittedTools: ["none"],
}

function createDatabase() {
  let row = null
  return {
    prepare(sql) {
      let values = []
      return {
        bind(...args) { values = args; return this },
        async first() {
          if (sql.includes("FROM workspace_data") && sql.includes("ai-bot-profiles")) return row
          return null
        },
        async run() {
          if (sql.includes("INSERT INTO workspace_data") && sql.includes("ai-bot-profiles")) {
            if (row) return { meta: { changes: 0 } }
            const [id, userId, data, now] = values
            row = { id, userId, data, updatedAt: now }
            workspaceWrites += 1
            return { meta: { changes: 1 } }
          }
          if (sql.includes("UPDATE workspace_data") && sql.includes("ai-bot-profiles")) {
            const [data, now, userId, expectedUpdatedAt] = values
            if (!row || row.userId !== userId || row.updatedAt !== expectedUpdatedAt) return { meta: { changes: 0 } }
            row = { ...row, data, updatedAt: now }
            workspaceWrites += 1
            return { meta: { changes: 1 } }
          }
          if (sql.includes("ai_canary") || sql.includes("financial_guard")) throw new Error("forbidden lifecycle write")
          return { meta: { changes: 0 } }
        },
      }
    },
  }
}

const db = createDatabase()
const enabledEnv = {
  DB: db,
  ASSETS: { fetch() { return new Response("Not found", { status: 404 }) } },
  AI_BOT_CANARY_EMAIL: owner.email,
  AI_OWNER_PROFILE_SETUP_ENABLED: "enabled",
  AI_PROVIDER_ENABLED: "disabled",
  AI_GLOBAL_KILL_SWITCH: "enabled",
  AI_OWNER_CANARY_ENABLED: "disabled",
  AI: { async run() { providerCalls += 1; throw new Error("provider must remain unreachable") } },
}
const ownerHandler = createRequestHandler({ getLoggedInUserFn: async () => owner })
const unauthenticatedHandler = createRequestHandler({ getLoggedInUserFn: async () => null })
const nonOwnerHandler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "not-owner", email: "not-owner@example.test" }) })
const url = "https://hegevaai.co.uk/api/ai-bot/owner-setup-profile"
const capabilityUrl = "https://hegevaai.co.uk/api/ai-bot/owner-setup-capability"

const unauthenticatedCapability = await unauthenticatedHandler.fetch(new Request(capabilityUrl, { headers: requestHeaders }), enabledEnv, {})
assert.equal(unauthenticatedCapability.status, 401, "unauthenticated capability must fail closed")
const unauthenticatedCreate = await unauthenticatedHandler.fetch(new Request(url, { method: "POST", headers: requestHeaders, body: JSON.stringify(validProfile) }), enabledEnv, {})
assert.equal(unauthenticatedCreate.status, 401, "unauthenticated creation must fail closed")

const nonOwnerCapability = await nonOwnerHandler.fetch(new Request(capabilityUrl, { headers: requestHeaders }), enabledEnv, {})
assert.equal(nonOwnerCapability.status, 403, "non-owner capability must fail closed")
const nonOwnerCreate = await nonOwnerHandler.fetch(new Request(url, { method: "POST", headers: requestHeaders, body: JSON.stringify(validProfile) }), enabledEnv, {})
assert.equal(nonOwnerCreate.status, 403, "non-owner creation must fail closed")

const disabledCapability = await ownerHandler.fetch(new Request(capabilityUrl, { headers: requestHeaders }), { ...enabledEnv, AI_OWNER_PROFILE_SETUP_ENABLED: "disabled" }, {})
assert.equal(disabledCapability.status, 503, "disabled setup must fail closed")

const capability = await ownerHandler.fetch(new Request(capabilityUrl, { headers: requestHeaders }), enabledEnv, {})
assert.equal(capability.status, 200, "matching owner receives bounded setup capability")
assert.deepEqual(await capability.json(), { setupEligible: true, profileExists: false })

const invalid = await ownerHandler.fetch(new Request(url, { method: "POST", headers: requestHeaders, body: JSON.stringify({ ...validProfile, extra: "no" }) }), enabledEnv, {})
assert.equal(invalid.status, 400, "extra request keys are rejected")

const created = await ownerHandler.fetch(new Request(url, { method: "POST", headers: requestHeaders, body: JSON.stringify(validProfile) }), enabledEnv, {})
assert.equal(created.status, 201, "matching owner can create exactly one disabled profile")
const createdBody = await created.json()
assert.equal(createdBody.status, "created")
assert.equal(createdBody.profile.enabled, false)
assert.equal(createdBody.profile.approvalState, "not-requested")
assert.equal(createdBody.profile.executionState, "not-started")
assert.equal(createdBody.profile.approvalVersion, 1)

const existingCapability = await ownerHandler.fetch(new Request(capabilityUrl, { headers: requestHeaders }), enabledEnv, {})
assert.equal(existingCapability.status, 200, "matching owner can read the inert existing-profile state")
assert.deepEqual(await existingCapability.json(), { setupEligible: false, profileExists: true, reason: "profile-exists" })

const duplicate = await ownerHandler.fetch(new Request(url, { method: "POST", headers: requestHeaders, body: JSON.stringify(validProfile) }), enabledEnv, {})
assert.equal(duplicate.status, 409, "a second owner setup creation must conflict")

assert.equal(workspaceWrites, 1, "only one caller-scoped workspace profile write is allowed")
assert.equal(canaryWrites, 0, "setup must not write canary records")
assert.equal(financialWrites, 0, "setup must not write financial records")
assert.equal(providerCalls, 0, "setup must never invoke a provider")
console.log("Owner AI Bot setup audit: PASS")
console.log(`workspace writes: ${workspaceWrites}; provider calls: ${providerCalls}; canary writes: ${canaryWrites}; financial writes: ${financialWrites}`)
