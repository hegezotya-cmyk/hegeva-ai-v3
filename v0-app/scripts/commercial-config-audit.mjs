import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const source = await readFile(new URL("../lib/commercial-config.ts", import.meta.url), "utf8")

for (const token of [
  "COMMERCIAL_CONFIG_VERSION",
  "plans:",
  "monthlyMinor:",
  "annualMinor:",
  "includedCredits:",
  "trial:",
  "credits:",
  "quotas:",
  "enterprise:",
  "trading:",
  "providers:",
  "features:",
  "getCommercialConfig",
]) assert(source.includes(token), `central commercial contract must define ${token}`)

assert(/mode: "sandbox"/.test(source), "billing must default to Sandbox")
assert(/liveEnabled: false/.test(source), "live billing must remain disabled")
assert(/liveTradingEnabled: false/.test(source), "live trading must remain disabled")
assert(/enabled: false/.test(source), "external providers and gated features must fail closed")
assert(/x30GenerationsPerDay: 3/.test(source) && /x30GenerationsPerBillingPeriod: 20/.test(source) && /x30OwnerWorkspacePerBillingPeriod: 50/.test(source), "X30 quota policy must remain bounded")
assert(/maximumRiskPercent: 25/.test(source), "paper trading risk policy must be bounded")
assert(/maxSeats: 100/.test(source) && /maxWorkspaces: 24/.test(source), "enterprise defaults must be bounded")
assert(/liveTradingEnabled: false/.test(source) && /enabled: false/.test(source), "provider capabilities must require explicit approval")
assert(!/sk_live_|pk_live_|secret|password/i.test(source), "commercial defaults must not contain live secrets")
assert(!/fetch\(|stripe|WorkersAI|AI\.run|wrangler/i.test(source), "config audit must not invoke external services")

console.log("COMMERCIAL CONFIG AUDIT PASS: centralized provisional plans, credits, quotas, provider gates, trading limits and enterprise limits are fail-closed")
