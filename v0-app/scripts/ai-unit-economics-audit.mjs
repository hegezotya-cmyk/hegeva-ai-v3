import assert from "node:assert/strict"
import fs from "node:fs"

const configSource = fs.readFileSync(new URL("../lib/commercial-config.ts", import.meta.url), "utf8")
const workerSource = fs.readFileSync(new URL("../../src/cloudflare-ai-provider.js", import.meta.url), "utf8")
const indexSource = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")

const assumptions = Object.freeze({
  inputTokens: 4000,
  outputTokens: 1200,
  inputUsdPerMillion: 0.282,
  outputUsdPerMillion: 0.827,
  minimumMarginPct: 80,
  stripeCardAndFxPct: 5.15,
  stripeBillingPct: 0.7,
  stripeFixedGbp: 0.20,
  vatPct: 20,
})

const plans = Object.freeze({
  basic: { monthlyGbp: 0, operations: 50 },
  premium: { monthlyGbp: 14.99, operations: 300 },
  pro: { monthlyGbp: 29.99, operations: 1000 },
  studio: { monthlyGbp: 59.99, operations: 2500 },
})

const costPerOperation =
  assumptions.inputTokens / 1_000_000 * assumptions.inputUsdPerMillion +
  assumptions.outputTokens / 1_000_000 * assumptions.outputUsdPerMillion

assert(workerSource.includes("4_000") && workerSource.includes("1_200"), "provider token ceilings changed; review unit economics")
assert(indexSource.includes("basic: 50") && indexSource.includes("premium: 300") && indexSource.includes("pro: 1000"), "runtime plan limits changed; review unit economics")
for (const token of ["pricingVerifiedOn", "pricingSource", "stripeWorstCaseCardAndFxPct", "stripeBillingPct", "vatStressTestPct", "minimumPaidPlanContributionMarginPctAfterStressCosts"]) {
  assert(configSource.includes(token), `commercial cost guard missing ${token}`)
}

const results = Object.entries(plans).map(([plan, values]) => {
  const maximumAiCostGbp = values.operations * costPerOperation
  const marginPct = values.monthlyGbp > 0 ? (values.monthlyGbp - maximumAiCostGbp) / values.monthlyGbp * 100 : null
  const netRevenueAfterVat = values.monthlyGbp / (1 + assumptions.vatPct / 100)
  const stripeCostGbp = values.monthlyGbp * (assumptions.stripeCardAndFxPct + assumptions.stripeBillingPct) / 100 + assumptions.stripeFixedGbp
  const stressContributionMarginPct = values.monthlyGbp > 0 ? (netRevenueAfterVat - stripeCostGbp - maximumAiCostGbp) / netRevenueAfterVat * 100 : null
  if (marginPct !== null) assert(marginPct >= assumptions.minimumMarginPct, `${plan} AI margin below launch floor`)
  if (stressContributionMarginPct !== null) assert(stressContributionMarginPct >= assumptions.minimumMarginPct, `${plan} stress contribution margin below launch floor`)
  return { plan, maximumAiCostGbp: Number(maximumAiCostGbp.toFixed(3)), marginPct: marginPct === null ? null : Number(marginPct.toFixed(1)), stressContributionMarginPct: stressContributionMarginPct === null ? null : Number(stressContributionMarginPct.toFixed(1)) }
})

console.log("AI unit economics audit passed (free allocation excluded; USD treated as GBP):")
for (const result of results) console.log(`- ${result.plan}: max £${result.maximumAiCostGbp.toFixed(3)} AI/month${result.marginPct === null ? "" : `, ${result.marginPct.toFixed(1)}% pre-fee; ${result.stressContributionMarginPct.toFixed(1)}% after 20% VAT + worst listed card/FX + Billing stress`}`)
