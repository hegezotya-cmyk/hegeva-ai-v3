import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const challenge = read("components/growth/sixty-second-challenge.tsx")
const score = read("lib/business-score.ts")
const route = read("app/challenge/page.tsx")
const home = read("app/page.tsx")
const attribution = read("components/acquisition/acquisition-attribution.tsx")
const consent = read("components/analytics-consent.tsx")
const tracking = read("lib/conversion-tracking.ts")
const sitemap = read("app/sitemap.ts")

const expect = (condition, message) => {
  if (!condition) throw new Error(`Growth Engine V1 audit failed: ${message}`)
}

expect(route.includes("SixtySecondChallenge"), "challenge route missing")
expect(challenge.includes("DEMO BUSINESS — FICTIONAL DATA"), "fictional demo label missing")
expect(challenge.includes("£2,050 currently needs attention"), "truthful attention value missing")
expect(challenge.includes("INV-1042") && challenge.includes("£1,200") && challenge.includes("18 days"), "overdue invoice proof missing")
expect(challenge.includes("QUO-1081") && challenge.includes("£850") && challenge.includes("12 days"), "quote follow-up proof missing")
expect(challenge.includes("Daniel Wright") && challenge.includes("31 days"), "returning-customer proof missing")
expect(challenge.includes("Prepared only. Nothing has been sent."), "approval-first prepared state missing")
expect(challenge.includes("/login?mode=register&callbackURL=%2Fget-started"), "signup handoff missing")
expect(challenge.includes("No signup. No card. Nothing sent without your approval."), "trust copy missing")
expect(score.includes("calculateBusinessScore") && score.includes("Math.round"), "deterministic score engine missing")
for (const expected of ["overdue_invoice", "invoice_14_days", "invoice_1000_plus", "quote_7_days", "quote_10_days", "quote_500_plus", "returning_30_days", "returning_3_jobs", "overdue_high_priority", "due_today_unresolved"]) {
  expect(score.includes(expected), `score rule missing: ${expected}`)
}
for (const event of ["challenge_view", "challenge_start", "business_type_selected", "demo_loaded", "demo_analysis_complete", "priority_viewed", "prepare_action_click", "prepared_action_complete", "challenge_complete", "business_score_view", "try_my_business_click"]) {
  expect(attribution.includes(event), `analytics type missing: ${event}`)
  expect(consent.includes(event), `consent allowlist missing: ${event}`)
}
expect(tracking.includes('"/challenge"'), "challenge public analytics path missing")
expect(home.includes('href="/challenge"') && home.includes("GIVE HEGEVA 60 SECONDS"), "homepage challenge entry missing")
expect(sitemap.includes("'/challenge'"), "challenge sitemap entry missing")
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) expect(challenge.includes(locale), `locale missing: ${locale}`)
expect(!challenge.includes("window.gtag"), "challenge must not call GA4 directly")
expect(!challenge.includes("fetch("), "challenge demo must not call live business APIs")
console.log("HEGEVA Growth Engine V1 audit PASS")
