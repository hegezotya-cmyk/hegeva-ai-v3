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
expect(page.includes('type WorkspaceDocument = { id: string; type: "invoice" | "quote"; status?: string }'), "guided progress must distinguish quotes from invoices")
expect(page.includes('const quotes = documents.filter((item) => item.type === "quote")'), "guided progress must derive real quote records")
expect(page.includes('const sentQuotes = quotes.filter((item) => ["sent", "accepted", "invoiced"].includes(item.status || "draft"))'), "guided progress must recognise quotes that advanced beyond draft")
expect(page.includes("const completedSteps = [customers.length > 0, quotes.length > 0, sentQuotes.length > 0]"), "guided progress must follow customer, quote and sent-quote evidence")
expect(page.includes("const nextStepIndex = completedSteps.findIndex"), "guided onboarding must select one current next step")
expect(page.includes("const nextStep = nextStepIndex >= 0 ? c.steps[nextStepIndex] : null"), "guided onboarding must preserve the customer-to-quote-to-sent order")
expect(page.includes(") : nextStep && ("), "only the current next step should be promoted")
const onboardingCopy = read("lib/i18n/first-customer-copy.ts")
expect(!onboardingCopy.includes('href: "/command-center#goal-mode"'), "the first customer journey must not divert to Goal Mode before a quote is sent")
expect(onboardingCopy.match(/href: "\/business\/invoices"/g)?.length === 10, "every locale must send quote creation and quote sending to the invoice workspace")
expect(onboardingCopy.includes("Send the quote"), "English sent-quote step missing")
expect(onboardingCopy.includes("Küldd el az ajánlatot"), "Hungarian sent-quote step missing")
expect(wow.includes("Give HEGEVA one thing to work with."), "first-WOW headline missing")
expect(wow.includes("Nothing is sent automatically."), "approval-first promise missing")
expect(wow.includes('href="/business/launch"'), "guided one-click workflow handoff missing")
expect(wow.includes('input_type: "one_click_workflow"'), "guided workflow start measurement missing")
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
