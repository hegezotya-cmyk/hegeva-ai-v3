import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const page = read("app/get-started/page.tsx")
const wow = read("components/get-started/first-wow.tsx")
const analyser = read("lib/first-wow.ts")
const studio = read("components/business/message-studio.tsx")
const verification = read("components/auth/email-verification-panel.tsx")
const attribution = read("components/acquisition/acquisition-attribution.tsx")
const consent = read("components/analytics-consent.tsx")

const expect = (condition, message) => {
  if (!condition) throw new Error(`Onboarding WOW audit failed: ${message}`)
}

expect(page.includes("FirstWowQuickStart"), "first WOW is not mounted on get-started")
expect(page.includes("!hasBusinessRecord"), "first WOW must target new/empty workspaces")
expect(page.includes("const completedSteps = [customers.length > 0, goals.length > 0, invoices.length > 0]"), "guided progress must use the exact customer, goal and quote/invoice records")
expect(page.includes("const nextStepIndex = completedSteps.findIndex"), "guided onboarding must select one current next step")
expect(page.includes("const nextStep = nextStepIndex >= 0 ? c.steps[nextStepIndex] : null"), "guided onboarding must preserve the customer-to-goal-to-document order")
expect(page.includes(") : nextStep && ("), "only the current next step should be promoted")
expect(read("lib/i18n/first-customer-copy.ts").includes('href: "/command-center#goal-mode"'), "goal onboarding step must open the exact Goal Mode section")
expect(wow.includes("Give HEGEVA one thing to work with."), "first-WOW headline missing")
expect(wow.includes("Nothing is sent automatically."), "approval-first promise missing")
expect(wow.includes('href="/business/customers"'), "real customer workspace handoff missing")
expect(wow.includes('input_type: "customer"'), "first customer start measurement missing")
expect(wow.includes('href="/business/messages"'), "Message Studio handoff missing")
expect(wow.includes("Quick-start signal only"), "heuristic disclosure missing")
expect(wow.includes("Prepared only. Nothing has been sent."), "prepared-only boundary missing")
expect(!wow.includes("window.gtag"), "first WOW must not call GA4 directly")
expect(!wow.includes("fetch("), "first WOW must not call live AI/business APIs")
expect(analyser.includes("analyseCustomerMessage"), "deterministic analyser missing")
for (const intent of ["payment", "quote", "schedule", "support", "general"]) {
  expect(analyser.includes(intent), `message intent missing: ${intent}`)
}
expect(studio.includes("hegeva:first-wow-message-seed:v1"), "Message Studio quick-start handoff missing")
expect(studio.includes("sessionStorage.removeItem(key)"), "Message Studio seed must be one-shot")
expect(verification.includes("/login?callbackURL=%2Fget-started"), "verified user get-started return missing")
for (const event of ["own_business_start", "own_business_result"]) {
  expect(attribution.includes(event), `analytics type missing: ${event}`)
  expect(consent.includes(event), `consent allowlist missing: ${event}`)
}
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) {
  expect(wow.includes(locale), `first-WOW locale missing: ${locale}`)
}
console.log("HEGEVA onboarding first-WOW audit PASS")
