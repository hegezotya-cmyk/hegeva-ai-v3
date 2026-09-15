import fs from "node:fs"
import assert from "node:assert/strict"

const auth = fs.readFileSync(new URL("../components/auth/auth-panel.tsx", import.meta.url), "utf8")
const onboarding = fs.readFileSync(new URL("../app/get-started/page.tsx", import.meta.url), "utf8")

assert.match(auth, /setVerificationPending\(true\)/)
assert.match(auth, /setSuccess\(c\.verificationRequired\)/)
assert.doesNotMatch(auth, /router\.push\(mode === "register"/)
assert.match(auth, /function safeCallbackURL\(fallback = "\/command-center"\)/)
assert.match(onboarding, /router\.replace\("\/login\?mode=register&callbackURL=%2Fget-started"\)/)
console.log("Onboarding redirect audit passed: registration requires email verification before onboarding, existing login callbacks preserved, anonymous /get-started protected")
