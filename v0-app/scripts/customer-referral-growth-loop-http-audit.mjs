import assert from "node:assert/strict"
import fs from "node:fs"

await import("./audit-runtime-register.mjs")
const { createRequestHandler } = await import("../../src/index.js")
const { createAuth } = await import("../../src/auth.js")
const { DatabaseSync } = await import("node:sqlite")

const migration = fs.readFileSync(new URL("../../migrations/0024_referrals.sql", import.meta.url), "utf8")

function hybridDatabase(database) {
  return new Proxy(database, {
    get(target, property, receiver) {
      if (property === "batch") {
        return async (statements) => {
          target.exec("BEGIN")
          try {
            const results = statements.map((statement) => statement.run())
            target.exec("COMMIT")
            return results
          } catch (error) {
            target.exec("ROLLBACK")
            throw error
          }
        }
      }
      if (property !== "prepare") return Reflect.get(target, property, receiver)
      return (sql) => {
        const statement = target.prepare(sql)
        let bound = null
        return {
          bind(...values) { bound = values; return this },
          first() { return statement.get(...(bound || [])) || null },
          all(...values) { return bound ? { results: statement.all(...bound) } : statement.all(...values) },
          run(...values) { const result = statement.run(...(bound || values)); return bound ? { meta: { changes: Number(result.changes) } } : result },
          get(...values) { return statement.get(...values) },
          columns(...values) { return statement.columns(...values) },
        }
      }
    },
  })
}

function fixture() {
  const database = new DatabaseSync(":memory:")
  database.exec(`
    CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, emailVerified INTEGER NOT NULL, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS session (id TEXT PRIMARY KEY, expiresAt INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, ipAddress TEXT, userAgent TEXT, userId TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS account (id TEXT PRIMARY KEY, accountId TEXT NOT NULL, providerId TEXT NOT NULL, userId TEXT NOT NULL, accessToken TEXT, refreshToken TEXT, idToken TEXT, accessTokenExpiresAt INTEGER, refreshTokenExpiresAt INTEGER, scope TEXT, password TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, issuer TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS verification (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expiresAt INTEGER NOT NULL, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
  `)
  database.exec(migration)
  database.exec(fs.readFileSync(new URL("../../migrations/0031_referral_rewards.sql", import.meta.url), "utf8"))
  return { database, DB: hybridDatabase(database) }
}

const request = (path, method = "GET", body, session = null) => new Request(`https://example.test${path}`, {
  method,
  headers: { ...(body ? { "content-type": "application/json" } : {}), ...(session ? { cookie: session.cookie } : {}) },
  body: body ? JSON.stringify(body) : undefined,
})

const { database, DB } = fixture()
const env = { DB, BETTER_AUTH_SECRET: "fixture-secret-32-characters-long-123", PUBLIC_APP_URL: "https://example.test" }
let externalCalls = 0
globalThis.fetch = async () => { externalCalls += 1; throw new Error("external calls are forbidden in this audit") }
const worker = createRequestHandler()

async function createVerifiedSession(email) {
  const auth = createAuth(env, request("/api/auth/session"), {})
  const signup = await auth.api.signUpEmail({ body: { name: email.split("@")[0], email, password: "fixture-password" }, headers: new Headers(), asResponse: true })
  assert.equal(signup.status, 200, "isolated Better Auth signup fixture must succeed")
  database.prepare("UPDATE user SET emailVerified = 1 WHERE email = ?").run(email)
  const signIn = await auth.api.signInEmail({ body: { email, password: "fixture-password" }, headers: new Headers(), asResponse: true })
  assert.equal(signIn.status, 200, "isolated Better Auth sign-in fixture must succeed")
  const cookieName = (await auth.$context).authCookies.sessionToken.name
  const escapedCookieName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const cookie = signIn.headers.get("set-cookie")?.match(new RegExp(`${escapedCookieName}=([^;]+)`))?.[1]
  assert.ok(cookie, "Better Auth must issue a signed session cookie")
  return { id: database.prepare("SELECT id FROM user WHERE email = ?").get(email).id, email, cookie: `${cookieName}=${cookie}` }
}

const creator = await createVerifiedSession("creator@example.test")
const referred = await createVerifiedSession("referred@example.test")
const secondReferred = await createVerifiedSession("second-referred@example.test")
const otherOwner = await createVerifiedSession("other-owner@example.test")

const call = (session, path, method = "GET", body) => worker.fetch(request(path, method, body, session), env, {})

const created = await call(creator, "/api/referrals/code", "POST")
assert.equal(created.status, 201, "authenticated owner can create one referral code")
const createdPayload = await created.json()
assert.equal(typeof createdPayload.code, "string")
assert.equal(typeof createdPayload.id, "string")

const touch = await call(null, "/api/referrals/touch", "POST", { code: createdPayload.code, consentState: "granted" })
assert.equal(touch.status, 204, "valid granted-consent touch is accepted")
assert.equal(database.prepare("SELECT COUNT(*) AS count FROM referral_touches").get().count, 1)

const attributed = await call(referred, "/api/referrals/attribute", "POST", { code: createdPayload.code })
assert.equal(attributed.status, 201, "first authenticated signup attribution is accepted")
assert.deepEqual(await attributed.json(), { attributed: true })

const replay = await call(referred, "/api/referrals/attribute", "POST", { code: createdPayload.code })
assert.equal(replay.status, 200, "replayed signup attribution is idempotent")
assert.deepEqual(await replay.json(), { attributed: false, duplicate: true })
assert.equal(database.prepare("SELECT COUNT(*) AS count FROM referral_attributions").get().count, 1)

const self = await call(creator, "/api/referrals/attribute", "POST", { code: createdPayload.code })
assert.equal(self.status, 409, "self-referral is rejected")
assert.deepEqual(await self.json(), { error: "Referral unavailable." })

const invalid = await call(referred, "/api/referrals/attribute", "POST", { code: "not-a-real-code" })
assert.equal(invalid.status, 404, "unknown referral code fails generically")
assert.deepEqual(await invalid.json(), { error: "Referral unavailable." })

const unauthenticated = await call(null, "/api/referrals/attributions")
assert.equal(unauthenticated.status, 401, "attribution list requires authentication")

const ownerList = await call(creator, "/api/referrals/attributions")
assert.equal(ownerList.status, 200)
const ownerPayload = await ownerList.json()
assert.equal(ownerPayload.items.length, 1)
assert.equal(ownerPayload.items[0].referredUserId, undefined, "owner response must not expose referred user identity")
assert.equal(ownerPayload.items[0].codeId, undefined, "owner response must not expose internal code identity")

const revokeFirst = await call(creator, `/api/referrals/code/${createdPayload.id}`, "DELETE")
assert.equal(revokeFirst.status, 200, "creator can revoke the first fixture code")
const secondCodeResponse = await call(creator, "/api/referrals/code", "POST")
assert.equal(secondCodeResponse.status, 201, "creator can create a replacement code")
const secondCode = await secondCodeResponse.json()
await call(null, "/api/referrals/touch", "POST", { code: secondCode.code, consentState: "granted" })
const preserved = await call(referred, "/api/referrals/attribute", "POST", { code: secondCode.code })
assert.equal(preserved.status, 200, "second referral code cannot replace an existing first-touch attribution")
assert.deepEqual(await preserved.json(), { attributed: false, duplicate: true })

const revokeSecond = await call(creator, `/api/referrals/code/${secondCode.id}`, "DELETE")
assert.equal(revokeSecond.status, 200, "replacement code can be revoked")
const thirdCodeResponse = await call(creator, "/api/referrals/code", "POST")
assert.equal(thirdCodeResponse.status, 201)
const thirdCode = await thirdCodeResponse.json()
await call(null, "/api/referrals/touch", "POST", { code: thirdCode.code, consentState: "granted" })
const thirdTouchId = database.prepare("SELECT id FROM referral_touches ORDER BY occurredAt DESC LIMIT 1").get().id
database.prepare("UPDATE referral_touches SET occurredAt = ? WHERE id = ?").run("2020-01-01T00:00:00.000Z", thirdTouchId)
const expired = await call(secondReferred, "/api/referrals/attribute", "POST", { code: thirdCode.code })
assert.equal(expired.status, 409, "expired first touch must not attribute")
assert.deepEqual(await expired.json(), { error: "Referral window expired." })

const revokeThird = await call(creator, `/api/referrals/code/${thirdCode.id}`, "DELETE")
assert.equal(revokeThird.status, 200)
const revoked = await call(otherOwner, "/api/referrals/attribute", "POST", { code: thirdCode.code })
assert.equal(revoked.status, 404, "revoked codes must fail generically")
assert.deepEqual(await revoked.json(), { error: "Referral unavailable." })

const malformed = await call(otherOwner, "/api/referrals/attribute", "POST", { code: "bad!" })
assert.equal(malformed.status, 404, "malformed codes must fail generically")
assert.deepEqual(await malformed.json(), { error: "Referral unavailable." })

const fourthCodeResponse = await call(creator, "/api/referrals/code", "POST")
assert.equal(fourthCodeResponse.status, 201)
const fourthCode = await fourthCodeResponse.json()
await call(null, "/api/referrals/touch", "POST", { code: fourthCode.code, consentState: "granted" })
const retry401 = await call(null, "/api/referrals/attribute", "POST", { code: fourthCode.code })
assert.equal(retry401.status, 401, "anonymous attribution must require a session")
const retryVerified = await call(otherOwner, "/api/referrals/attribute", "POST", { code: fourthCode.code })
assert.equal(retryVerified.status, 201, "verified session must complete the attribution retry")

const creatorListAfterRetry = await call(creator, "/api/referrals/attributions")
assert.equal(creatorListAfterRetry.status, 200)
assert.equal((await creatorListAfterRetry.json()).items.length, 2, "creator list contains both attributed referrals")
const otherOwnerList = await call(otherOwner, "/api/referrals/attributions")
assert.equal(otherOwnerList.status, 200)
const otherOwnerPayload = await otherOwnerList.json()
assert.equal(otherOwnerPayload.items.length, 0, "owner-scoped list does not expose another creator's referrals")
assert.equal(otherOwnerPayload.items.some((item) => item.codeId !== undefined), false, "cross-owner response must not expose code identity")
assert.equal(database.prepare("SELECT COUNT(*) AS count FROM referral_rewards WHERE status = 'EXECUTED'").get().count, 0, "no automatic reward execution")
assert.equal(externalCalls, 0, "fixture must not call email/provider/external services")

console.log("customer referral growth loop HTTP audit: PASS")
