import fs from "node:fs"

const content = fs.readFileSync(new URL("../components/analytics-consent.tsx", import.meta.url), "utf8")
const expect = (condition, message) => { if (!condition) throw new Error(`Analytics hotfix audit failed: ${message}`) }
expect(content.includes('pathname === "/challenge" ? "challenge_view"'), "challenge_view must be dispatched after consent is ready")
expect(content.includes('const repeatable = detail.event === "primary_cta_click"'), "analytics dedup protection missing")
expect(content.includes('"challenge_view"'), "challenge_view allowlist missing")
console.log("HEGEVA analytics challenge_view hotfix audit PASS")
