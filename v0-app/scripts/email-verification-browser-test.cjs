// Local UI certification only. Auth and analytics requests are stubbed;
// this test never creates an account or sends an email.
const assert = require("node:assert/strict")
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    await context.addInitScript(() => {
      localStorage.setItem("hegeva:analytics-consent:v1", "denied")
      localStorage.setItem("hegeva.locale", "en")
    })

    const email = "verification-flow@example.invalid"
    const user = {
      id: "verification-flow",
      name: "Verification Test",
      email,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await context.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith("/sign-up/email")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ token: null, user }),
        })
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "null" })
    })

    const page = await context.newPage()
    const base = process.env.TEST_BASE_URL || "http://localhost:3010"
    await page.goto(`${base}/login?mode=register`, { waitUntil: "domcontentloaded" })
    await page.locator('input[autocomplete="name"]').fill(user.name)
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill("Fixture-password-123")
    await page.locator('button[type="submit"]').click()

    await page.getByRole("heading", { name: "Check your inbox" }).waitFor()
    assert.equal(await page.getByText(email, { exact: true }).innerText(), email)
    assert.match(await page.getByRole("button", { name: /Resend available in/ }).innerText(), /30s|29s/)
    assert.equal(await page.getByRole("button", { name: /Resend available in/ }).isDisabled(), true)
    assert.equal(await page.getByRole("button", { name: "Use a different email address" }).isVisible(), true)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)

    await page.getByRole("button", { name: "Use a different email address" }).click()
    assert.equal(await page.locator('input[type="email"]').inputValue(), email)
    console.log("Email verification browser test passed: dedicated state, address visibility, resend cooldown, correction path, and mobile fit")
  } finally {
    await browser.close()
  }
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
