import test from "node:test"
import assert from "node:assert/strict"
import { analyticsCollectionAllowed } from "../lib/analytics-host-policy.mjs"

test("production analytics only runs on owned public hostnames", () => {
  for (const hostname of ["hegevaai.co.uk", "www.hegevaai.co.uk"])
    assert.equal(analyticsCollectionAllowed(hostname, false), true)
  for (const hostname of ["127.0.0.1", "localhost", "hegeva-ai-v3-v0.hegezotya.workers.dev", "shiny-stardust-e0dcb3.netlify.app", "hegevaai.co.uk.evil.test", ""])
    assert.equal(analyticsCollectionAllowed(hostname, false), false, hostname)
})
test("staging can use preview and local test hosts with a separately configured GA ID", () => {
  assert.equal(analyticsCollectionAllowed("cc024394-hegeva-ai-v3-v0-staging.hegezotya.workers.dev", true), true)
  assert.equal(analyticsCollectionAllowed("127.0.0.1", true), true)
})
