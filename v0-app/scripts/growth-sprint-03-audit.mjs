import assert from "node:assert/strict"
import fs from "node:fs"

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
const home = read("app/page.tsx")
const hero = read("components/home/hero.tsx")
const promo = read("components/home/growth-loop-promo.tsx")
const acquisition = read("components/acquisition/acquisition-attribution.tsx")
const consent = read("components/analytics-consent.tsx")
const tracking = read("lib/conversion-tracking.ts")
const challenge = read("components/growth/sixty-second-challenge.tsx")
const niche = read("components/growth/niche-landing.tsx")

assert.match(home, /HOMEPAGE_CHALLENGE_HREF\s*=\s*["']\/challenge["']/)
assert.match(hero, /href="\/challenge"/, "homepage primary CTA must lead to the existing Challenge")
assert.match(hero, /data-acquisition-cta="homepage_challenge"/, "homepage Challenge CTA must be distinguishable without personal data")
assert.match(hero, /href="\/login\?mode=register"/, "direct registration must remain available as the secondary CTA")
assert.match(hero, /data-acquisition-cta="homepage_workspace"/, "homepage workspace CTA must be distinguishable without personal data")

assert.match(promo, /data-acquisition-event="demo_entry_click"[\s\S]*data-acquisition-destination="\/challenge"/, "Challenge entry must declare its real destination")
assert.match(acquisition, /destination:\s*"\/challenge"|acquisitionDestination/, "Challenge entry event must record /challenge, not /demo")
assert.doesNotMatch(acquisition, /destination:\s*"\/demo"/, "Challenge entry analytics must not claim /demo")

assert.match(promo, /data-acquisition-event="get_started_entry"/, "anonymous Get Started entry must be measured separately from registration")
assert.match(consent, /"get_started_entry"/, "consent allowlist must include anonymous Get Started entry")
assert.match(acquisition, /"get_started_entry"/, "acquisition event type must include anonymous Get Started entry")
assert.doesNotMatch(promo, /data-acquisition-event="registration_start"/, "anonymous Get Started entry must not duplicate registration_start")

assert.match(challenge, /recordAnalyticsEvent\("demo_analysis_complete"[\s\S]*setStage\("results"\)/, "demo_analysis_complete must mark a reached Challenge result")
assert.match(challenge, /const prepareAction[\s\S]*recordAnalyticsEvent\("challenge_complete"/, "challenge_complete must remain the prepared-action milestone")

assert.match(tracking, /utm_source:\s*\[[^\]]*"directory"[^\]]*"referral"/, "approved directory and referral sources must be retained")
assert.doesNotMatch(tracking, /utm_source:\s*\[[^\]]*"direct"/, "direct must remain absence of approved campaign attribution")
assert.match(tracking, /includes\(value\)/, "arbitrary campaign values must remain rejected")

assert.match(consent, /destination: pending\.destination/, "CTA measurement must use only a route destination")
assert.match(consent, /cta: pending\.cta/, "CTA measurement must use only a static CTA label")
assert.doesNotMatch(consent, /primary_cta_click[\s\S]{0,300}(email|userId|referral_code|customer)/, "CTA analytics must not include personal or customer data")

for (const route of ["for-electricians", "for-plumbers", "for-builders", "for-property-maintenance", "for-cleaners"]) {
  assert.equal(fs.existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)), true, `${route} route must remain available`)
}
assert.match(niche, /href="\/challenge"/, "shared niche landing must continue to lead visitors to the Challenge")

console.log("Growth Sprint 03 audit: PASS")
