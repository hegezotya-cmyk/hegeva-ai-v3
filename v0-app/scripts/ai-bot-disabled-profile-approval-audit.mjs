import assert from "node:assert/strict"
import { createRequestHandler } from "../../src/index.js"

const owner = { id: "owner-setup-user", email: "hegezotya@gmail.com" }
const requestHeaders = { cookie: "session=redacted", "content-type": "application/json" }
const now = new Date().toISOString()

function makeDatabase(profile) {
  const state = {
    row: { data: JSON.stringify([profile]), updatedAt: now },
    writes: 0,
  }
  const db = {
    prepare(sql) {
      let values = []
      return {
        bind(...args) { values = args; return this },
        async first() {
          if (/SELECT\s+data\s*,\s*updatedAt/i.test(sql)) return state.row
          return null
        },
        async run() {
          if (/UPDATE workspace_data/i.test(sql)) {
            state.row = { data: values[0], updatedAt: values[1] }
            state.writes += 1
            return { meta: { changes: 1 } }
          }
          throw new Error("unexpected write")
        },
      }
    },
  }
  return { db, state }
}

const baseProfile = {
  id: "bot-owner-setup",
  schemaVersion: "0.1",
  name: "Owner canary profile",
  purpose: "Bounded owner-only setup",
  instructions: "Return one concise readiness statement only.",
  knowledgeScope: "No customer data and no external actions.",
  permittedTools: ["none"],
  enabled: false,
  approvalState: "not-requested",
  executionState: "not-started",
  approvedAt: null,
  approvalExpiresAt: null,
  approvedByActorHash: null,
  approvalVersion: 1,
  approvalRevision: null,
  createdAt: now,
  updatedAt: now,
}

const env = {
  AI_BOT_CANARY_EMAIL: owner.email,
  AI_PROVIDER_ENABLED: "disabled",
  AI_GLOBAL_KILL_SWITCH: "enabled",
  AI_OWNER_CANARY_ENABLED: "disabled",
  AI_OWNER_PROFILE_SETUP_ENABLED: "disabled",
  ASSETS: { fetch: () => new Response("Not found", { status: 404 }) },
}

const ownerHandler = createRequestHandler({ getLoggedInUserFn: async () => owner })
const unauthenticatedHandler = createRequestHandler({ getLoggedInUserFn: async () => null })
const nonOwnerHandler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "other", email: "other@example.test" }) })
const request = (handler, db, body) => handler.fetch(new Request("https://example.test/api/ai-bot/approve", { method: "POST", headers: requestHeaders, body: JSON.stringify(body) }), { ...env, DB: db }, {})

const first = makeDatabase(baseProfile)
const approved = await request(ownerHandler, first.db, { profileId: baseProfile.id })
assert.equal(approved.status, 200, "disabled setup profile must be approvable by the configured owner")
const approvedProfile = JSON.parse(first.state.row.data)[0]
assert.equal(approvedProfile.enabled, false, "approval must not enable the profile")
assert.equal(approvedProfile.approvalState, "owner-approved")
assert.equal(approvedProfile.executionState, "not-started")
assert.equal(approvedProfile.permittedTools.length, 1)
assert.equal(approvedProfile.permittedTools[0], "none")
assert.equal(typeof approvedProfile.approvedByActorHash, "string")
assert.equal(approvedProfile.approvalRevision, first.state.row.updatedAt)
assert.equal(first.state.writes, 1, "approval must perform exactly one workspace CAS write")

const unauthenticated = await request(unauthenticatedHandler, first.db, { profileId: baseProfile.id })
assert.equal(unauthenticated.status, 401)
const nonOwner = await request(nonOwnerHandler, first.db, { profileId: baseProfile.id })
assert.equal(nonOwner.status, 403)

const alreadyApproved = makeDatabase(approvedProfile)
const duplicate = await request(ownerHandler, alreadyApproved.db, { profileId: baseProfile.id })
assert.equal(duplicate.status, 409, "already-approved profile must be rejected")
assert.equal(alreadyApproved.state.writes, 0, "duplicate approval must not write")

const invalid = makeDatabase({ ...baseProfile, executionState: "started" })
const invalidLifecycle = await request(ownerHandler, invalid.db, { profileId: baseProfile.id })
assert.equal(invalidLifecycle.status, 409, "non-setup lifecycle must be rejected")
assert.equal(invalid.state.writes, 0, "invalid lifecycle must not write")

console.log("AI Bot disabled-profile approval audit passed: owner-only setup approval, disabled profile preservation, duplicate/lifecycle rejection, no provider path")
