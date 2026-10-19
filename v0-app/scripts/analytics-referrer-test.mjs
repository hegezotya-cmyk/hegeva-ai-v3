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
