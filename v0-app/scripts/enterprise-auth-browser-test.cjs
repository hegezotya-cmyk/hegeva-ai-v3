const assert = require("node:assert/strict")
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3108"
const user = {
  id: "enterprise-browser-fixture",
  name: "Enterprise fixture",
  email: "enterprise-fixture@example.invalid",
  emailVerified: true,
}

async function configureApi(context, signedIn) {
  await context.route("**/api/auth/get-session", async route => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: signedIn
      ? JSON.stringify({
          user,
          session: {
            id: "enterprise-browser-session",
            userId: user.id,
            token: "fixture-only",
            expiresAt: "2099-01-01T00:00:00.000Z",
          },
        })
      : "null",
    })
  })

  await context.route("**/api/workspace/enterprise_organizations", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: [] }),
  }))
}

async function verifyGuest(browser) {
  const context = await browser.newContext()
  try {
    await configureApi(context, false)
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", error => errors.push(error.message))
    await page.goto(`${baseUrl}/enterprise`, { waitUntil: "domcontentloaded" })
    await page.getByRole("link", { name: "Contact us" }).waitFor()
    await page.getByRole("link", { name: "View pricing" }).waitFor()
    assert.equal(await page.locator("input, select").count(), 0)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

async function verifySignedIn(browser) {
  const context = await browser.newContext()
  try {
    await configureApi(context, true)
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", error => errors.push(error.message))
    await page.goto(`${baseUrl}/enterprise`, { waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: "Save changes" }).waitFor()
    assert(await page.locator("input").count() > 0)
    assert(await page.locator("select").count() > 0)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

;(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
    headless: true,
  })
  try {
    await verifyGuest(browser)
    await verifySignedIn(browser)
    console.log("PASS: browser guest isolation and signed-in Enterprise controls")
  } finally {
    await browser.close()
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
