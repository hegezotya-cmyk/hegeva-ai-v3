import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const home = read("app/page.tsx")
const promo = read("components/home/growth-loop-promo.tsx")
const consent = read("components/analytics-consent.tsx")
const tracking = read("lib/conversion-tracking.ts")
const auth = read("components/auth/auth-panel.tsx")
const account = read("app/account/page.tsx")
const challenge = read("components/growth/sixty-second-challenge.tsx")
const referralUi = read("components/growth/referral-review.tsx")
const scorePanel = read("components/growth/workspace-business-check.tsx")
const referralRoute = read("app/r/[code]/page.tsx")

function assertReferralFirstTouchBehavior() {
  const compiled = ts.transpileModule(tracking, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const touchBodies = []
  let now = Date.parse("2026-09-27T00:00:00.000Z")
  const makeStorage = (initial = {}) => {
    const values = new Map(Object.entries(initial))
    return {
      getItem: (key) => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    }
  }
  const moduleRecord = { exports: {} }
  const sandbox = {
    module: moduleRecord,
    exports: moduleRecord.exports,
    require: (specifier) => {
      assert.equal(specifier, "./activation-measurement", "tracking module dependency must stay explicit")
      return { activationStorageKey: () => null }
    },
    Date: class extends Date { static now() { return now } },
    URLSearchParams,
    window: { location: { search: "?ref=AAAAAAAAAAAAAAAAAAAAAAAA" } },
    localStorage: makeStorage({ "hegeva:analytics-consent:v1": "granted" }),
    sessionStorage: makeStorage(),
    fetch: (_url, options) => {
      touchBodies.push(JSON.parse(options.body))
      return Promise.resolve({ ok: true })
    },
  }
  vm.runInNewContext(compiled, sandbox, { filename: "conversion-tracking.ts" })
  const capture = sandbox.module.exports.captureReferralAttribution
  assert.equal(typeof capture, "function", "tracking module must export the referral capture helper")

  const first = capture()
  assert.equal(first?.code, "AAAAAAAAAAAAAAAAAAAAAAAA", "the first referral URL must be captured")
  sandbox.window.location.search = "?ref=BBBBBBBBBBBBBBBBBBBBBBBB"
  const second = capture()
  assert.equal(second?.code, "AAAAAAAAAAAAAAAAAAAAAAAA", "a later referral URL must not replace the captured first touch")
  assert.equal(
    JSON.parse(sandbox.sessionStorage.getItem("hegeva:referral:v1")).code,
    "AAAAAAAAAAAAAAAAAAAAAAAA",
    "signup context must retain the first captured code",
  )
  assert.deepEqual(touchBodies.map((body) => body.code), ["AAAAAAAAAAAAAAAAAAAAAAAA", "BBBBBBBBBBBBBBBBBBBBBBBB"], "direct referral visits still reach the touch endpoint")
  sandbox.window.location.search = ""
  assert.equal(capture()?.code, "AAAAAAAAAAAAAAAAAAAAAAAA", "signup without a direct code must use the first captured touch")

  now += 31 * 24 * 60 * 60 * 1000
  sandbox.window.location.search = "?ref=BBBBBBBBBBBBBBBBBBBBBBBB"
  assert.equal(capture()?.code, "BBBBBBBBBBBBBBBBBBBBBBBB", "an expired first touch must allow a new 30-day window")
}

assertReferralFirstTouchBehavior()

assert.match(home, /HOMEPAGE_CHALLENGE_ENTRY/, "homepage must own the Challenge entry contract")
assert.match(home, /HOMEPAGE_CHALLENGE_HREF\s*=\s*["']\/challenge["']/, "page-level source must define the executable /challenge href")
for (const locale of ["en", "hu", "de", "fr", "es"]) {
  assert.match(home, new RegExp(`${locale}\\s*:`), `homepage Challenge locale missing: ${locale}`)
}
const challengeLinks = promo.match(/href=\{entry\.href\}/g) || []
assert.equal(challengeLinks.length, 1, "homepage must render exactly one Challenge link")
assert.match(home, /HOMEPAGE_CHALLENGE_ENTRY/, "page-level source must pass the contract to the promo")
const visitEvent = consent.match(/detail:\s*\{\s*event:\s*"referral_visit"[\s\S]*?\}\s*\}/)?.[0] || ""
const signupEvent = auth.match(/detail:\s*\{\s*event:\s*"referral_signup"[\s\S]*?\}\s*\}/)?.[0] || ""
assert(visitEvent && !visitEvent.includes("referral_code"), "referral_visit analytics must be code-free")
assert(signupEvent && !signupEvent.includes("referral_code"), "referral_signup analytics must be code-free")
assert.match(tracking, /hegeva:analytics-consent:v1[\s\S]*granted/, "referral touch capture must remain consent-gated")
assert.match(tracking, /\/api\/referrals\/touch/, "granted referral capture must use the touch endpoint")
assert.match(consent, /else \{[\s\S]*clearReferralAttribution\(\)/, "denied consent must clear referral context")
assert.match(tracking, /captureReferralAttribution\(\)[\s\S]*localStorage\.getItem\("hegeva:analytics-consent:v1"\) !== "granted"/, "referral capture must refuse non-granted consent")
assert.match(auth, /body:\s*JSON\.stringify\(\{ code: referral\.code \}\)/, "attribution API must retain its one-shot code")
const referralHelper = auth.slice(auth.indexOf("async function attributeCapturedReferral"), auth.indexOf("async function handleSubmit"))
assert.match(referralHelper, /captureReferralAttribution[\s\S]*if \(response\?\.ok\) clearReferralAttribution/, "failed attribution must retain context for the verified-session retry")
const verifiedLogin = auth.slice(auth.indexOf("const verifiedSession"))
assert.match(verifiedLogin, /attributeCapturedReferral\(\)/, "verified login must retry referral attribution")
assert.match(auth, /async function attributeCapturedReferral[\s\S]*\/api\/referrals\/attribute/, "retry must use the authenticated attribution endpoint")
const signupBlock = auth.slice(auth.indexOf("trackRegistrationCompleted()"), auth.indexOf("setVerificationPending"))
assert.doesNotMatch(signupBlock, /clearReferralAttribution\(\)/, "sessionless signup must not clear referral context after a 401")
assert.match(account, /WorkspaceBusinessCheck/, "Account must retain the private Business Check")
assert.match(account, /ReferralReview/, "Account must retain the private referral control")
const sessionGate = account.indexOf("if (!session?.user)")
const firstPrivatePanel = Math.min(account.indexOf("<WorkspaceBusinessCheck"), account.indexOf("<ReferralReview"))
assert(sessionGate >= 0 && firstPrivatePanel > sessionGate, "private panels must render only after the authenticated session gate")
assert.doesNotMatch(challenge, /WorkspaceBusinessCheck/, "public Challenge must not mount workspace scoring")
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert.match(referralUi, new RegExp(locale), `referral locale missing: ${locale}`)
assert.match(referralUi, /window\.location\.origin.*\/r\//, "referral URL must use the current public origin")
assert.doesNotMatch(referralUi, /test\.example|workspaceId|paymentId|customerEmail/, "referral UI must not expose private/test identifiers")
assert.match(referralUi, /key=\{x\.id\}|key=\{review\.id/, "owner-scoped IDs may remain internal React keys only")
assert.doesNotMatch(referralUi, />\s*(?:x|review)\.id\s*</, "owner-scoped IDs must not be visible UI text")
assert.match(scorePanel, /useWorkspaceData/, "Business Check must retain cloud workspace reads")
assert.match(referralRoute, /\/challenge\?ref=|\/challenge/, "invalid referrals must use the generic Challenge redirect")

console.log("customer referral growth loop audit: PASS")
