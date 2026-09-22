import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { createRequestHandler } from "../../src/index.js"

const owner = { id: "owner-renewal-user", email: "hegezotya@gmail.com" }
const profileId = "bot-b2083aff-69ef-4902-93bd-2c792c3cb0c9"
const priorApproval = "2026-09-21T22:55:33.650Z"
const expiredAt = "2026-09-21T23:40:33.650Z"
const actorHash = createHash("sha256").update(owner.id).digest("hex")
const headers = { cookie: "session=redacted", "content-type": "application/json" }
const handler = (user) => createRequestHandler({ getLoggedInUserFn: async () => user })

const baseProfile = {
  id: profileId,
  schemaVersion: "0.1",
  name: "Owner canary profile",
  purpose: "Bounded owner-only test",
  instructions: "Return one concise status only.",
  knowledgeScope: "No customer data and no external actions.",
  permittedTools: ["none"],
  enabled: false,
  approvalState: "owner-approved",
  executionState: "not-started",
  approvedAt: priorApproval,
  approvalExpiresAt: expiredAt,
  approvedByActorHash: actorHash,
  approvalVersion: 2,
  approvalRevision: priorApproval,
  createdAt: priorApproval,
  updatedAt: priorApproval,
}

const env = {
  AI_BOT_CANARY_EMAIL: owner.email,
  AI_PUBLIC_ASSISTANT_ENABLED: "false",
  AI_PROVIDER_ENABLED: "disabled",
  AI_GLOBAL_KILL_SWITCH: "enabled",
  AI_OWNER_CANARY_ENABLED: "disabled",
  AI_OWNER_PROFILE_SETUP_ENABLED: "disabled",
  ASSETS: { fetch: () => new Response("Not found", { status: 404 }) },
}

function makeDatabase(profiles, { casConflict = false, workspaceUserId = owner.id } = {}) {
  const state = {
    profiles: structuredClone(profiles),
    updatedAt: priorApproval,
    reads: 0,
    writes: 0,
    writeAttempts: 0,
  }
  const db = {
    prepare(sql) {
      let values = []
      return {
        bind(...args) { values = args; return this },
        async first() {
          if (/SELECT\s+data\s*,\s*updatedAt/i.test(sql) && sql.includes("ai-bot-profiles")) {
            assert.equal(values[0], workspaceUserId, "profile reads must be scoped to the authenticated owner workspace")
            state.reads += 1
            return { data: JSON.stringify(state.profiles), updatedAt: state.updatedAt }
          }
          throw new Error(`unexpected read: ${sql}`)
        },
        async run() {
          if (/UPDATE workspace_data/i.test(sql) && sql.includes("ai-bot-profiles")) {
            state.writeAttempts += 1
            assert.equal(values[2], owner.id, "renewal update must be scoped to the authenticated workspace")
            assert.equal(values[3], state.updatedAt, "renewal update must compare-and-swap the prior row revision")
            if (casConflict) return { meta: { changes: 0 } }
            state.profiles = JSON.parse(values[0])
            state.updatedAt = values[1]
            state.writes += 1
            return { meta: { changes: 1 } }
          }
          throw new Error(`unexpected write: ${sql}`)
        },
      }
    },
  }
  return { db, state }
}

async function renew(user, db, body) {
  return handler(user).fetch(new Request("https://example.test/api/ai-bot/renew-approval", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }), { ...env, DB: db, AI: { async run() { throw new Error("provider must not be called") } } }, {})
}

let providerCalls = 0
const successState = makeDatabase([baseProfile])
const success = await handler(owner).fetch(new Request("https://example.test/api/ai-bot/renew-approval", {
  method: "POST",
  headers,
  body: JSON.stringify({ profileId }),
}), {
  ...env,
  DB: successState.db,
  AI: { async run() { providerCalls += 1; throw new Error("provider must not be called") } },
}, {})
assert.equal(success.status, 200, "owner may renew the expired approval for the exact disabled profile")
const successPayload = await success.json()
assert.equal(successPayload.status, "owner-reapproved")
assert.equal(successPayload.profileId, profileId)
assert.equal(successPayload.approvalVersion, 3)
const renewed = successState.state.profiles[0]
assert.ok(Date.parse(renewed.approvalExpiresAt) > Date.now(), "renewal must issue a future expiry")
assert.ok(Date.parse(renewed.approvalExpiresAt) <= Date.now() + 31 * 60 * 1000, "renewal must retain the existing bounded approval window")
assert.equal(renewed.approvalState, "owner-approved")
assert.equal(renewed.enabled, false, "renewal must never enable the profile")
assert.equal(renewed.executionState, "not-started", "renewal must not activate execution")
assert.deepEqual(renewed.permittedTools, ["none"], "renewal must preserve the no-tools boundary")
assert.equal(renewed.approvedByActorHash, actorHash)
assert.equal(renewed.approvalRevision, successState.state.updatedAt)
assert.equal(renewed.approvedAt, successState.state.updatedAt)
assert.equal(renewed.updatedAt, successState.state.updatedAt)
assert.equal(successState.state.writeAttempts, 1)
assert.equal(successState.state.writes, 1)

const cases = [
  { name: "unauthenticated", user: null, profiles: [baseProfile], status: 401 },
  { name: "authenticated session without user id", user: { email: owner.email }, profiles: [baseProfile], status: 401 },
  { name: "non-owner", user: { id: "other-user", email: "other@example.test" }, profiles: [baseProfile], status: 403 },
  { name: "missing profile in owner workspace", user: owner, profiles: [], status: 404 },
  { name: "foreign profile id", user: owner, profiles: [{ ...baseProfile, id: "bot-foreign-profile" }], status: 404 },
  { name: "malformed profile id", user: owner, profiles: [baseProfile], body: { profileId: "not a profile id" }, status: 400 },
  { name: "extra authority field", user: owner, profiles: [baseProfile], body: { profileId, userId: owner.id }, status: 400 },
  { name: "duplicate profile id", user: owner, profiles: [baseProfile, { ...baseProfile }], status: 404 },
  { name: "already-valid approval", user: owner, profiles: [{ ...baseProfile, approvalExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }], status: 409 },
  { name: "enabled profile", user: owner, profiles: [{ ...baseProfile, enabled: true }], status: 409 },
  { name: "active execution", user: owner, profiles: [{ ...baseProfile, executionState: "running" }], status: 409 },
  { name: "wrong tools", user: owner, profiles: [{ ...baseProfile, permittedTools: ["send-email"] }], status: 409 },
  { name: "wrong approval state", user: owner, profiles: [{ ...baseProfile, approvalState: "not-requested" }], status: 409 },
  { name: "malformed expiry", user: owner, profiles: [{ ...baseProfile, approvalExpiresAt: "not-a-date" }], status: 409 },
  { name: "approval timestamp after expiry", user: owner, profiles: [{ ...baseProfile, approvedAt: "2026-09-22T00:00:00.000Z" }], status: 409 },
  { name: "actor mismatch", user: owner, profiles: [{ ...baseProfile, approvedByActorHash: "f".repeat(64) }], status: 409 },
  { name: "stale approval revision", user: owner, profiles: [{ ...baseProfile, approvalRevision: "stale-revision" }], status: 409 },
  { name: "invalid approval version", user: owner, profiles: [{ ...baseProfile, approvalVersion: 0 }], status: 409 },
]

for (const testCase of cases) {
  const fixture = makeDatabase(testCase.profiles)
  const response = await renew(testCase.user, fixture.db, testCase.body || { profileId })
  assert.equal(response.status, testCase.status, `${testCase.name} must fail closed`)
  assert.equal(fixture.state.writeAttempts, 0, `${testCase.name} must not attempt a D1 write`)
  assert.equal(fixture.state.writes, 0, `${testCase.name} must not change profile data`)
}

const conflict = makeDatabase([baseProfile], { casConflict: true })
const conflictResponse = await renew(owner, conflict.db, { profileId })
assert.equal(conflictResponse.status, 409, "concurrent profile change must be rejected")
assert.equal(conflict.state.writeAttempts, 1)
assert.equal(conflict.state.writes, 0, "failed compare-and-swap must not change profile data")
assert.equal(providerCalls, 0, "approval renewal must never invoke the AI provider")

console.log("AI Bot approval renewal audit passed: exact owner/profile, expired-only lifecycle, CAS, disabled execution boundary, fail-closed cases, zero provider calls")
