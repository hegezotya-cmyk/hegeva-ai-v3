// Runs locally with stubbed authentication. No account or email is created.
const assert = require("node:assert/strict")
const { chromium } = require("playwright")

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const scenario of ["accepted", "rejected", "no-consent"]) {
      const context = await browser.newContext({ locale: "en-GB", viewport: { width: 390, height: 844 } })
      await context.addInitScript((consent) => {
        localStorage.setItem("hegeva:analytics-consent:v1", consent)
        localStorage.setItem("hegeva.locale", "en")
      }, scenario === "no-consent" ? "denied" : "granted")
      const interceptedPaths = []
      const failedPaths = []
      const outgoingPaths = []
      const blockedHosts = []
      const browserErrorTypes = []
      const localOrigin = new URL(process.env.TEST_BASE_URL || "http://localhost:3010").origin
      await context.route("**/api/**", (route) => {
        const path = new URL(route.request().url()).pathname
        interceptedPaths.push(route.request().method() + " " + path)
        if (path.endsWith("/sign-up/email")) {
          const rejected = scenario === "rejected"
          return route.fulfill({ status: rejected ? 400 : 200, contentType: "application/json", body: JSON.stringify(rejected ? { code: "USER_ALREADY_EXISTS", message: "Rejected" } : { token: null, user: { id: "fixture", name: "Test", email: "test@example.invalid", emailVerified: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }) })
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: "null" })
      })
      await context.route("**/*googletagmanager.com/**", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }))
      await context.route("**/*google-analytics.com/**", (route) => route.abort())
      // Fail closed on all external hosts in the isolated fixture. The local
      // registration page and its mocked local API are the only trusted network.
      await context.route("**/*", async (route) => {
        const target = new URL(route.request().url())
        if (target.origin === localOrigin || target.protocol === "data:" || target.protocol === "blob:") return route.fallback()
        if (/^(?:www\\.)?(?:googletagmanager\\.com|google-analytics\\.com)$/.test(target.hostname)) return route.fallback()
        blockedHosts.push(target.hostname)
        return route.abort("blockedbyclient")
      })
      const page = await context.newPage()
      page.on("pageerror", (error) => browserErrorTypes.push(error.name || "Error"))
      page.on("request", (request) => {
        const url = new URL(request.url())
        if (/\\/api\\/|auth|sign-up/.test(url.pathname) || url.origin !== localOrigin) {
          outgoingPaths.push({ host: url.hostname, method: request.method(), path: url.pathname.slice(0, 120) })
        }
      })
      // Record only method and URL pathname: never capture request/response bodies or email.
      page.on("requestfailed", (request) => {
        if (request.url().includes("/api/")) {
          failedPaths.push({ path: new URL(request.url()).pathname, failure: request.failure()?.errorText || "unknown" })
        }
      })
      await page.goto((process.env.TEST_BASE_URL || "http://localhost:3010") + "/login?mode=register")
      await page.locator('input[autocomplete="name"]').fill("Test")
      await page.locator('input[type="email"]').fill("test@example.invalid")
      await page.locator('input[type="password"]').fill("Fixture-password-123")
      await page.evaluate(() => {
        window.__hegevaSubmitSeen = false
        window.__hegevaInvalidTypes = []
        document.addEventListener("submit", () => { window.__hegevaSubmitSeen = true }, true)
        document.addEventListener("invalid", (event) => { window.__hegevaInvalidTypes.push(event.target.type) }, true)
      })
      await page.locator('button[type="submit"]').click()
      try {
        await page.getByText(scenario === "rejected" ? "Authentication failed." : "Check your inbox", { exact: false }).waitFor()
      } catch (error) {
        const state = {
          scenario,
          interceptedPaths,
          failedPaths,
          outgoingPaths,
          blockedHosts,
          browserErrorTypes,
          formIsValid: await page.locator("form[data-registration-active='true']").evaluate(form => form.checkValidity()),
          formEventState: await page.evaluate(() => ({ submitSeen: window.__hegevaSubmitSeen, invalidTypes: window.__hegevaInvalidTypes })),
          registrationFormVisible: await page.locator("form[data-registration-active='true']").isVisible(),
          authFailureVisible: await page.getByText("Authentication failed.", { exact: false }).isVisible(),
          checkInboxVisible: await page.getByRole("heading", { name: "Check your inbox" }).isVisible(),
          submitDisabled: await page.locator('button[type="submit"]').isDisabled(),
        }
        console.error("Registration browser sanitized diagnostic:", JSON.stringify(state))
        throw error
      }
      const events = await page.evaluate(() => (window.dataLayer || []).filter((item) => item[0] === "event" && item[1] === "registration_submitted").map((item) => Array.from(item)))
      assert.equal(events.length, scenario === "accepted" ? 1 : 0, scenario)
      assert.equal(JSON.stringify(events).includes("test@example.invalid"), false, "analytics must not contain the email")
      await context.close()
    }
    console.log("Registration measurement browser test passed: accepted, rejected, consent and data minimisation")
  } finally {
    await browser.close()
  }
})().catch((error) => { console.error(error); process.exitCode = 1 })
