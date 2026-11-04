import test from "node:test"
import assert from "node:assert/strict"
import { analyticsReferrerOrigin } from "../lib/analytics-referrer.mjs"

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
