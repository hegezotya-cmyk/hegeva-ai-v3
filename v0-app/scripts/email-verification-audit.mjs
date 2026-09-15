import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  HEGEVA_EMAIL_FROM,
  HEGEVA_EMAIL_VERIFICATION_CALLBACK,
  sendEmailVerification,
} from "../../src/auth.js"
import { authRoutePolicy, createAuthRateLimiter } from "../../src/auth-rate-limiter.js"

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const appDir = dirname(scriptsDir)
const rootDir = dirname(appDir)
const authSource = await readFile(join(rootDir, "src", "auth.js"), "utf8")
const authPanel = await readFile(join(appDir, "components", "auth", "auth-panel.tsx"), "utf8")
const verificationPage = await readFile(join(appDir, "components", "auth", "email-verification-panel.tsx"), "utf8")
const authCopy = await readFile(join(appDir, "lib", "i18n", "auth-copy.ts"), "utf8")

assert.match(authSource, /requireEmailVerification:\s*true/, "email/password sign-in must require verification")
assert.match(authSource, /emailVerification:\s*\{[\s\S]*sendOnSignUp:\s*true/, "new registrations must send verification email")
assert.match(authSource, /expiresIn:\s*3600/, "verification tokens must expire after one hour")
assert.match(authSource, /sendVerificationEmail:/, "Better Auth must own verification-email dispatch")
assert.match(authSource, /"\/api\/auth\/verify-email"/, "only the first-party Better Auth verification route may be emailed")
assert.match(authSource, /trustedOrigins:/, "Better Auth must validate verification callback origins")
assert.match(authSource, /sendResetPassword:/, "password-reset delivery must remain configured")
assert.equal(HEGEVA_EMAIL_VERIFICATION_CALLBACK, "/email-verification?status=verified")
assert.match(authPanel, /authClient\.sendVerificationEmail/, "unverified accounts must have a native resend path")
assert.match(authPanel, /EMAIL_NOT_VERIFIED/, "unverified sign-in must be explained without creating a session")
assert.match(authPanel, /signIn\.email\(\{[\s\S]*callbackURL: HEGEVA_EMAIL_VERIFICATION_CALLBACK/, "unverified sign-in resends must use the fixed callback")
assert.match(authPanel, /setSuccess\(c\.verificationRequired\)/, "registration must not claim verification delivery before Better Auth confirms it")
assert.match(verificationPage, /TOKEN_EXPIRED/, "expired tokens need a dedicated user-facing state")
assert.match(verificationPage, /verificationInvalid/, "invalid tokens need a dedicated user-facing state")
assert.match(authCopy, /verificationSuccessful/, "all locales must include verification success copy")
assert.match(authCopy, /resendVerification/, "all locales must include resend copy")

assert.deepEqual(authRoutePolicy("send-verification-email"), {
  limit: 3,
  windowMs: 60 * 60 * 1000,
})

const limiter = createAuthRateLimiter({ now: () => 1_000 })
assert.equal(limiter.admit("send-verification-email", "tenant-a", 1_000).allowed, true)
assert.equal(limiter.admit("send-verification-email", "tenant-a", 1_001).allowed, true)
assert.equal(limiter.admit("send-verification-email", "tenant-a", 1_002).allowed, true)
assert.equal(limiter.admit("send-verification-email", "tenant-a", 1_003).allowed, false)
assert.equal(limiter.admit("send-verification-email", "tenant-b", 1_003).allowed, true)

const originalFetch = globalThis.fetch
const deliveries = []
globalThis.fetch = async (url, init) => {
  deliveries.push({ url, init })
  return new Response(JSON.stringify({ id: "mock-verification-message" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

try {
  await sendEmailVerification(
    { RESEND_API_KEY: "mock-only" },
    {
      user: { name: "Owner", email: "owner@example.test" },
      url: "https://hegevaai.co.uk/api/auth/verify-email?token=mock-token&callbackURL=%2Femail-verification%3Fstatus%3Dverified",
      publicAppUrl: "https://hegevaai.co.uk",
    },
  )

  assert.equal(deliveries.length, 1, "verification dispatch must make exactly one provider request")
  const sent = JSON.parse(deliveries[0].init.body)
  assert.equal(deliveries[0].url, "https://api.resend.com/emails")
  assert.equal(sent.from, HEGEVA_EMAIL_FROM)
  assert.deepEqual(sent.to, ["owner@example.test"], "recipient must come from Better Auth's user record")
  assert.match(sent.subject, /Verify your HEGEVA AI email address/)
  assert.match(sent.text, /api\/auth\/verify-email\?token=mock-token/)
  assert.equal(deliveries[0].init.headers["Idempotency-Key"].startsWith("hegeva-email-verification-"), true)

  await assert.rejects(
    () => sendEmailVerification(
      { RESEND_API_KEY: "mock-only" },
      {
        user: { name: "Owner", email: "owner@example.test" },
        url: "https://attacker.example/verify-email?token=mock-token",
        publicAppUrl: "https://hegevaai.co.uk",
      },
    ),
    /Invalid email verification request/,
    "an attacker-controlled verification URL must never be emailed",
  )
  assert.equal(deliveries.length, 1, "invalid URL must not send email")
} finally {
  globalThis.fetch = originalFetch
}

console.log("Email verification audit passed: Better Auth tokens, fixed callback, recipient binding, mocked Resend, rate limits, recovery, and localized UI states")
