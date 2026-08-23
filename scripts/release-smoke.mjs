const baseUrl = (process.env.HEGEVA_BASE_URL || "https://hegevaai.co.uk").replace(/\/$/, "")

const checks = [
  { name: "homepage", path: "/", method: "GET", expected: [200] },
  { name: "plan auth guard", path: "/api/plan/status", method: "GET", expected: [401] },
  { name: "billing auth guard", path: "/api/billing/status", method: "GET", expected: [401] },
  { name: "workspace auth guard", path: "/api/workspace", method: "GET", expected: [401] },
  { name: "contact method guard", path: "/api/contact", method: "GET", expected: [405] },
]

let failed = false

for (const check of checks) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      method: check.method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "HEGEVA-release-smoke/1.0",
      },
    })

    const ok = check.expected.includes(response.status)
    console.log(`${ok ? "PASS" : "FAIL"} ${check.name}: ${response.status}`)

    if (!ok) failed = true
  } catch (error) {
    failed = true
    console.error(`FAIL ${check.name}: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    clearTimeout(timeout)
  }
}

if (failed) {
  process.exitCode = 1
} else {
  console.log(`Smoke test passed for ${baseUrl}`)
}
