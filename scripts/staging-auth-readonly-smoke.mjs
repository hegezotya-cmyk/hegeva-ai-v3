import assert from "node:assert/strict";

// Staging-only unauthenticated GET probes. Does not register users, read private
// records, issue Stripe requests, or send email.
const base = "https://staging.hegevaai.co.uk";
const checks = [
  { name: "registration page", path: "/login?mode=register", status: 200, html: true },
  { name: "email recovery readiness", path: "/api/system/email-status", status: 200, json: true },
  { name: "billing authentication guard", path: "/api/billing/status", status: 401 },
  { name: "plan authentication guard", path: "/api/plan/status", status: 401 },
  { name: "workspace authentication guard", path: "/api/workspace/customers", status: 401 },
];

let failed = false;
for (const check of checks) {
  const url = new URL(check.path, base);
  assert.equal(url.origin, base, "Never probe a non-staging host");
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: { Accept: check.json ? "application/json" : "*/*", "User-Agent": "HEGEVA-staging-readonly-auth-smoke/1.0" },
    });
    assert.equal(response.status, check.status, `${check.name} returned unexpected HTTP status`);
    if (check.json) {
      assert.match(response.headers.get("content-type") || "", /application\/json/i);
      const payload = await response.json();
      assert.equal(typeof payload?.passwordRecovery, "boolean", "Email readiness must return a boolean");
    }
    if (check.html) {
      assert.match(response.headers.get("content-type") || "", /text\/html/i);
    }
    console.log(`PASS ${check.name}: HTTP ${response.status}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failed) process.exitCode = 1;
else console.log("Staging anonymous auth-readiness smoke: PASS (not a full user E2E)");
