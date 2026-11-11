import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"

// Full Better Auth signup -> mocked Resend link -> verification -> login.
// In-memory SQLite and fake email only: no remote environment is contacted.
await import("./audit-runtime-register.mjs")
const { createAuth } = await import("../../src/auth.js")

const origin = "https://staging.hegevaai.co.uk"
const email = "isolated-verification@example.test"
const db = new DatabaseSync(":memory:")
db.exec(`
  CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, emailVerified INTEGER NOT NULL, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
  CREATE TABLE session (id TEXT PRIMARY KEY, expiresAt INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, ipAddress TEXT, userAgent TEXT, userId TEXT NOT NULL);
  CREATE TABLE account (id TEXT PRIMARY KEY, accountId TEXT NOT NULL, providerId TEXT NOT NULL, userId TEXT NOT NULL, accessToken TEXT, refreshToken TEXT, idToken TEXT, accessTokenExpiresAt INTEGER, refreshTokenExpiresAt INTEGER, scope TEXT, password TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
  CREATE TABLE verification (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expiresAt INTEGER NOT NULL, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
`)
// Preserve the DatabaseSync prototype so Better Auth detects SQLite correctly.
// Wrap D1-style chained calls as in the existing isolated referral HTTP audit.
const DB = new Proxy(db, {
  get(target, property, receiver) {
    if (property === "batch") return async (statements) => {
      target.exec("BEGIN")
      try {
        const results = statements.map(statement => statement.run())
        target.exec("COMMIT")
        return results
      } catch (error) {
        target.exec("ROLLBACK")
        throw error
      }
    }
    if (property !== "prepare") return Reflect.get(target, property, receiver)
    return sql => {
      const statement = target.prepare(sql)
      let values = null
      return {
        bind(...args) { values = args; return this },
        first() { return statement.get(...(values || [])) || null },
        all(...args) { return values ? { results: statement.all(...values) } : statement.all(...args) },
        run(...args) { const result = statement.run(...(values || args)); return values ? { meta: { changes: Number(result.changes) } } : result },
        get(...args) { return statement.get(...args) },
        columns(...args) { return statement.columns(...args) },
      }
    }
  },
})
const env = { DB, BETTER_AUTH_SECRET: "isolated-auth-secret-long-enough-2026", PUBLIC_APP_URL: origin, RESEND_API_KEY: "MOCK_NO_EXTERNAL_DELIVERY" }
const auth = createAuth(env, new Request(origin + "/api/auth/get-session"), {})
const originalFetch = globalThis.fetch
const sent = []
globalThis.fetch = async (url, init) => {
  assert.equal(String(url), "https://api.resend.com/emails", "all network access must be mocked Resend")
  assert.equal(init.method, "POST")
  sent.push(JSON.parse(init.body))
  return new Response(JSON.stringify({ id: "mock-isolated-email" }), { status: 200, headers: { "content-type": "application/json" } })
}

try {
  const signup = await auth.api.signUpEmail({
    body: { name: "Isolated User", email, password: "Example-password-strong-123", callbackURL: "/email-verification?status=verified" },
    headers: new Headers(),
    asResponse: true,
  })
  assert.equal(signup.status, 200, "in-memory signup must succeed")
  assert.equal(db.prepare("SELECT emailVerified FROM user WHERE email = ?").get(email).emailVerified, 0, "new account must start unverified")
  const denied = await auth.api.signInEmail({ body: { email, password: "Example-password-strong-123" }, headers: new Headers(), asResponse: true })
  assert.notEqual(denied.status, 200, "unverified account must not sign in")
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM session").get().n, 0, "unverified sign-in must not create a session")

  assert.equal(sent.length, 1, "signup must trigger exactly one mocked verification message")
  assert.deepEqual(sent[0].to, [email], "send only to signed-up account")
  const match = sent[0].text.match(/https:\/\/[^\s]+\/api\/auth\/verify-email\?[^\s]+/)
  assert.ok(match, "email must contain the first-party Better Auth verification URL")
  const url = new URL(match[0])
  assert.equal(url.origin, origin, "never send a production verification link from staging")
  assert.equal(url.pathname, "/api/auth/verify-email")
  assert.ok(url.searchParams.get("token"), "verification must use an opaque token")
  assert.equal(sent[0].text.includes("hegevaai.co.uk/api/auth/verify-email") && !sent[0].text.includes("https://hegevaai.co.uk/api/auth/verify-email"), true, "verification email must not point to production")

  const verified = await auth.handler(new Request(url, { method: "GET", redirect: "manual" }))
  assert.ok([200, 302, 303].includes(verified.status), `verification route must handle the token, got ${verified.status}`)
  assert.equal(db.prepare("SELECT emailVerified FROM user WHERE email = ?").get(email).emailVerified, 1, "real token must flip the verified flag")
  const accepted = await auth.api.signInEmail({ body: { email, password: "Example-password-strong-123" }, headers: new Headers(), asResponse: true })
  assert.equal(accepted.status, 200, "verified account must sign in")
  assert.ok(accepted.headers.get("set-cookie"), "verified sign-in must issue a session cookie")
  // Isolated password recovery for the same verified QA identity.
  const recovery = await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/reset-password" },
    headers: new Headers(),
    asResponse: true,
  })
  assert.equal(recovery.status, 200, "verified user must be able to request password recovery")
  assert.equal(sent.length, 2, "recovery must generate exactly one additional mocked Resend message")
  assert.deepEqual(sent[1].to, [email], "recovery must target the original account")
  // Better Auth may email an intermediate endpoint that redirects to the UI.
  // Execute that real in-memory route, rather than assuming a direct UI URL.
  const resetMatch = sent[1].text.match(/https:\/\/[^\s]+/)
  assert.ok(resetMatch, "reset message must contain a first-party HTTPS URL")
  const resetEntryUrl = new URL(resetMatch[0])
  assert.equal(resetEntryUrl.origin, origin, "password reset must not link to production")
  let resetUrl = resetEntryUrl
  if (resetEntryUrl.pathname !== "/reset-password") {
    const intermediate = await auth.handler(new Request(resetEntryUrl, { method: "GET", redirect: "manual" }))
    assert.ok([302, 303, 307, 308].includes(intermediate.status), `intermediate reset URL must redirect, got HTTP ${intermediate.status}`)
    const location = intermediate.headers.get("location")
    assert.ok(location, "intermediate reset route must return a location")
    resetUrl = new URL(location, origin)
  }
  assert.equal(resetUrl.origin, origin, "reset callback must stay on staging")
  assert.equal(resetUrl.pathname, "/reset-password", "reset must resolve to the UI token form")
  const resetToken = resetUrl.searchParams.get("token")
  assert.ok(resetToken, "reset UI link must include an opaque token")
  const freshPassword = "New-isolated-password-456!"
  const resetResult = await auth.api.resetPassword({
    body: { token: resetToken, newPassword: freshPassword },
    headers: new Headers(),
    asResponse: true,
  })
  assert.equal(resetResult.status, 200, "password reset must accept the sent token")
  const oldPassword = await auth.api.signInEmail({ body: { email, password: "Example-password-strong-123" }, headers: new Headers(), asResponse: true })
  assert.notEqual(oldPassword.status, 200, "old password must be invalid after reset")
  const newPassword = await auth.api.signInEmail({ body: { email, password: freshPassword }, headers: new Headers(), asResponse: true })
  assert.equal(newPassword.status, 200, "new password must allow verified account login")
  console.log("PASS: isolated signup, one mocked verification email, staging-only token, unverified sign-in denial, real token verification, verified sign-in, password recovery email, reset token, old-password rejection and new-password login")
} finally {
  globalThis.fetch = originalFetch
  db.close()
}
