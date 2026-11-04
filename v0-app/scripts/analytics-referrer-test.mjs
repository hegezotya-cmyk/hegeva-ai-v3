import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { analyticsReferrerOrigin, analyticsIgnoreLegacyReferrer } from "../lib/analytics-referrer.mjs"

test("keeps only the external referrer origin, excluding path, query and fragment", () => {
  assert.equal(
    analyticsReferrerOrigin("https://search.example/results?q=private#top", "https://hegevaai.co.uk"),
    "https://search.example/",
  )
})

test("does not report a same-site referrer", () => {
  assert.equal(
    analyticsReferrerOrigin("https://hegevaai.co.uk/login?email=private", "https://hegevaai.co.uk"),
    "",
  )
})

test("rejects empty, malformed and non-web referrers", () => {
  for (const referrer of ["", "not a URL", "javascript:alert(1)", "mailto:user@example.com"]) {
    assert.equal(analyticsReferrerOrigin(referrer, "https://hegevaai.co.uk"), "")
  }
})

test("legacy HEGEVA Netlify host is not an external referral on production", () => {
  for (const site of ["https://hegevaai.co.uk", "https://www.hegevaai.co.uk"]) {
    assert.equal(analyticsReferrerOrigin("https://shiny-stardust-e0dcb3.netlify.app/?utm_source=private", site), "")
  }
})

test("unrelated Netlify and social referrers remain external", () => {
  const production = "https://hegevaai.co.uk"
  assert.equal(analyticsReferrerOrigin("https://other-customer.netlify.app/sale", production), "https://other-customer.netlify.app/")
  assert.equal(analyticsReferrerOrigin("https://m.facebook.com/story.php?id=1", production), "https://m.facebook.com/")
  assert.equal(analyticsReferrerOrigin("https://www.google.com/search?q=hegeva", production), "https://www.google.com/")
  // Staging has its own attribution: do not reinterpret its referrers.
  assert.equal(analyticsReferrerOrigin("https://shiny-stardust-e0dcb3.netlify.app/", "https://staging.hegevaai.co.uk"), "https://shiny-stardust-e0dcb3.netlify.app/")
})

test("spoofed legacy hostname is not accepted as first party", () => {
  assert.equal(analyticsReferrerOrigin("https://shiny-stardust-e0dcb3.netlify.app.evil.example/", "https://hegevaai.co.uk"), "https://shiny-stardust-e0dcb3.netlify.app.evil.example/")
})

test("GA4 ignore_referrer only applies to the exact legacy Netlify host on production", () => {
  const old = "https://shiny-stardust-e0dcb3.netlify.app/old?secret=1"
  for (const site of ["https://hegevaai.co.uk", "https://www.hegevaai.co.uk"])
    assert.equal(analyticsIgnoreLegacyReferrer(old, site), true)
  for (const other of ["https://www.google.com/search", "https://m.facebook.com/hello", "https://other.netlify.app", "https://shiny-stardust-e0dcb3.netlify.app.evil.com"])
    assert.equal(analyticsIgnoreLegacyReferrer(other, "https://hegevaai.co.uk"), false, other)
  assert.equal(analyticsIgnoreLegacyReferrer(old, "https://staging.hegevaai.co.uk"), false)
  assert.equal(analyticsIgnoreLegacyReferrer("", "https://hegevaai.co.uk"), false)
})

test("consent-gated GA4 configuration wires legacy source exclusion without blanket disabling referrals", () => {
  const source = fs.readFileSync(new URL("../components/analytics-consent.tsx", import.meta.url), "utf8")
  assert.match(source, /import \{ analyticsReferrerOrigin, analyticsIgnoreLegacyReferrer \} from "@\/lib\/analytics-referrer\.mjs"/)
  assert.match(source, /page_referrer: pageReferrer,\s*\.\.\.\(analyticsIgnoreLegacyReferrer\(document\.referrer, window\.location\.origin\) \? \{ ignore_referrer: true \} : \{\}\)/)
  assert.doesNotMatch(source, /ignore_referrer:\s*true\s*,\s*\n\s*\.\.\.campaignAttribution/, "do not exclude all referral sources")
})
