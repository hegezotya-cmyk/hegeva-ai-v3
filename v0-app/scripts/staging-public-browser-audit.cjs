// Real staging read-only browser probe. This does NOT create accounts,
// click submit, send email, mutate workspace data, or access Stripe.
const assert = require("node:assert/strict")
const { chromium } = require("playwright")

const STAGING = "https://staging.hegevaai.co.uk"
const pathOnly = (value) => new URL(value).pathname

async function browserAudit(browser, label, viewport) {
  const context = await browser.newContext({ locale: "en-GB", viewport, serviceWorkers: "block" })
  const deniedWrites = []
  const unexpectedProductionHosts = []
  const browserErrors = []
  await context.route("**/*", (route) => {
    const request = route.request()
    const target = new URL(request.url())
    if (["hegevaai.co.uk", "www.hegevaai.co.uk"].includes(target.hostname)) {
      unexpectedProductionHosts.push({ method: request.method(), path: target.pathname })
      return route.abort("blockedbyclient")
    }
    if (target.origin !== STAGING) {
      return route.abort("blockedbyclient") // no third-party analytics/email/Stripe calls
    }
    if (!["GET", "HEAD"].includes(request.method())) {
      deniedWrites.push({ method: request.method(), path: target.pathname })
      return route.abort("blockedbyclient") // fail closed on ANY write
    }
    return route.continue()
  })
  try {
    const page = await context.newPage()
    page.on("pageerror", (error) => browserErrors.push(error.name || "Error"))
    const response = await page.goto(STAGING + "/login?mode=register", { waitUntil: "domcontentloaded", timeout: 30000 })
    assert.equal(response?.status(), 200, label + ": registration URL should return HTTP 200")
    await page.locator('form[data-registration-active="true"]').waitFor({ state: "visible", timeout: 30000 })
    assert.equal(await page.locator('input[type="email"]').count() > 0, true, label + ": email field missing")
    assert.equal(await page.locator('input[type="password"]').count() > 0, true, label + ": password field missing")
    assert.equal(await page.locator('button[type="submit"]').count() > 0, true, label + ": registration submit button missing")
    const pageHost = new URL(page.url()).hostname
    assert.equal(pageHost, "staging.hegevaai.co.uk", label + ": unexpected origin redirect")
    assert.deepEqual(unexpectedProductionHosts, [], label + ": browser attempted production HEGEVA request")
    assert.deepEqual(deniedWrites, [], label + ": browser attempted a write without user action")
    assert.deepEqual(browserErrors, [], label + ": uncaught browser runtime error")
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
    assert.equal(fits, true, label + ": horizontal viewport overflow")
    console.log("PASS " + label + " staging registration renders with no writes or production HEGEVA requests")
  } finally {
    await context.close()
  }
}

async function unauthenticatedApiAudit() {
  const checks = [
    { path: "/api/system/email-status", expected: 200, json: true },
    { path: "/api/billing/public-status", expected: 200, json: true, billingReadiness: true },
    { path: "/api/plan/status", expected: 401 },
    { path: "/api/billing/status", expected: 401 },
    { path: "/api/workspace", expected: 401 },
    { path: "/api/workspace/customers", expected: 401 },
  ]
  for (const check of checks) {
    const result = await fetch(STAGING + check.path, {
      method: "GET", redirect: "manual", signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "HEGEVA-staging-read-only-audit/1.0" },
    })
    assert.equal(result.status, check.expected, check.path + ": unexpected response status")
    if (check.json) {
      const ct = result.headers.get("content-type") || ""
      assert.match(ct, /application\/json/i, check.path + ": should return JSON")
      // Never log raw payloads: providers may expose diagnostic details.
      if (check.billingReadiness) {
        const body = await result.json()
        const flags = {
          testMode: body?.mode === "test",
          stripeSelected: body?.provider === "stripe",
          connected: body?.connected === true,
          checkoutEnabled: body?.checkoutEnabled === true,
          webhookConfigured: body?.webhookConfigured === true,
        }
        console.log("Staging billing TEST readiness flags:", JSON.stringify(flags))
        assert.equal(Object.values(flags).every(Boolean), true,
          "Staging billing must be in TEST mode with a configured checkout and webhook")
      }
    }
    const location = result.headers.get("location") || ""
    assert.equal(/https:\/\/(www\.)?hegevaai\.co\.uk(?:\/|$)/i.test(location), false, "No production redirects")
    console.log("PASS read-only GET " + check.path + " => " + result.status)
  }
}

;(async () => {
  assert.equal(process.env.HEGEVA_BROWSER_TARGET, STAGING,
    "Refuse any target other than exact isolated staging URL")
  await unauthenticatedApiAudit()
  const browser = await chromium.launch({ headless: true })
  try {
    await browserAudit(browser, "mobile", { width: 390, height: 844 })
    await browserAudit(browser, "desktop", { width: 1440, height: 900 })
  } finally {
    await browser.close()
  }
  console.log("Real staging read-only browser audit PASSED. No accounts, writes, emails or payments.")
})().catch((error) => {
  console.error("Real staging read-only browser audit FAILED:", error instanceof Error ? error.message : "unknown")
  process.exitCode = 1
})
