const baseUrl = (process.env.HEGEVA_BASE_URL || "https://hegevaai.co.uk").replace(/\/$/, "")

const checks = [
  { name: "homepage", path: "/", method: "GET", expected: [200] },
  { name: "get started page", path: "/get-started", method: "GET", expected: [200] },
  { name: "command center page", path: "/command-center", method: "GET", expected: [200] },
  { name: "assistant page", path: "/assistant", method: "GET", expected: [200] },
  { name: "app studio page", path: "/app-studio", method: "GET", expected: [200] },
  { name: "prompt my app page", path: "/app-studio/prompt-my-app", method: "GET", expected: [200] },
  { name: "build my app page", path: "/app-studio/build-my-app", method: "GET", expected: [200] },
  { name: "fix my app page", path: "/app-studio/fix-my-app", method: "GET", expected: [200] },
  { name: "business page", path: "/business", method: "GET", expected: [200] },
  { name: "customers page", path: "/business/customers", method: "GET", expected: [200] },
  { name: "documents page", path: "/business/documents", method: "GET", expected: [200] },
  { name: "expenses page", path: "/business/expenses", method: "GET", expected: [200] },
  { name: "planner page", path: "/business/planner", method: "GET", expected: [200] },
  { name: "reports page", path: "/business/reports", method: "GET", expected: [200] },
  { name: "messages page", path: "/business/messages", method: "GET", expected: [200] },
  { name: "invoices page", path: "/business/invoices", method: "GET", expected: [200] },
  { name: "vault page", path: "/business/vault", method: "GET", expected: [200] },
  { name: "tools page", path: "/business/tools", method: "GET", expected: [200] },
  { name: "pricing page", path: "/pricing", method: "GET", expected: [200] },
  { name: "contact page", path: "/contact", method: "GET", expected: [200] },
  { name: "login page", path: "/login", method: "GET", expected: [200] },
  { name: "reset password page", path: "/reset-password", method: "GET", expected: [200] },
  { name: "account page", path: "/account", method: "GET", expected: [200] },
  { name: "email status endpoint", path: "/api/system/email-status", method: "GET", expected: [200] },
  { name: "plan auth guard", path: "/api/plan/status", method: "GET", expected: [401] },
  { name: "billing auth guard", path: "/api/billing/status", method: "GET", expected: [401] },
  { name: "workspace auth guard", path: "/api/workspace", method: "GET", expected: [401] },
  { name: "typed workspace auth guard", path: "/api/workspace/customers", method: "GET", expected: [401] },
  { name: "chat method guard", path: "/api/chat", method: "GET", expected: [405] },
  { name: "contact method guard", path: "/api/contact", method: "GET", expected: [405] },
  { name: "billing confirm retired", path: "/api/billing/confirm", method: "POST", expected: [410] },
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
        "user-agent": "HEGEVA-release-smoke/1.2",
        ...(check.method === "POST" ? { "content-type": "application/json" } : {}),
      },
      ...(check.method === "POST" ? { body: "{}" } : {}),
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
