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
      await context.route("**/api/**", (route) => {
        const path = new URL(route.request().url()).pathname
        if (path.endsWith("/sign-up/email")) {
          const rejected = scenario === "rejected"
          return route.fulfill({ status: rejected ? 400 : 200, contentType: "application/json", body: JSON.stringify(rejected ? { code: "USER_ALREADY_EXISTS", message: "Rejected" } : { token: null, user: { id: "fixture", name: "Test", email: "test@example.invalid", emailVerified: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }) })
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: "null" })
      })
      await context.route("**/*googletagmanager.com/**", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }))
      await context.route("**/*google-analytics.com/**", (route) => route.abort())
      const page = await context.newPage()
      await page.goto((process.env.TEST_BASE_URL || "http://localhost:3010") + "/login?mode=register")
      await page.locator('input[autocomplete="name"]').fill("Test")
      await page.locator('input[type="email"]').fill("test@example.invalid")
      await page.locator('input[type="password"]').fill("Fixture-password-123")
      await page.locator('button[type="submit"]').click()
      await page.getByText(scenario === "rejected" ? "Authentication failed." : "Check your inbox", { exact: false }).waitFor()
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
