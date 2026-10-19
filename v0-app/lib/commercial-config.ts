/**
 * Central, provisional commercial and safety settings.
 *
 * These values are intentionally conservative placeholders.  Product and
 * finance owners can change this one contract after commercial review without
 * changing workflow code.  A disabled capability must remain disabled until
 * its external authority and approval gate are configured.
 */
export const COMMERCIAL_CONFIG_VERSION = "1.0" as const

export const COMMERCIAL_PLANS = {
  free: { monthlyMinor: 0, annualMinor: 0, includedCredits: 50 },
  premium: { monthlyMinor: 1499, annualMinor: 14990, includedCredits: 300 },
  pro: { monthlyMinor: 2999, annualMinor: 29990, includedCredits: 1000 },
  studio: { monthlyMinor: 5999, annualMinor: 59990, includedCredits: 2500 },
  enterprise: { monthlyMinor: 14900, annualMinor: 0, includedCredits: 0 },
} as const

export const COMMERCIAL_CONFIG = {
  billing: { currency: "GBP", mode: "live" as const, liveEnabled: true },
  plans: COMMERCIAL_PLANS,
  prices: { currency: "GBP", monthly: { free: 0, premium: 1499, pro: 2999, studio: 5999, enterprise: 14900 }, annual: { free: 0, premium: 14990, pro: 29990, studio: 59990, enterprise: 0 } },
  monthlyIncluded: { free: 50, premium: 300, pro: 1000, studio: 2500, enterprise: 0 },
  overage: { enabled: false, behavior: "hard-stop" as const },
  trial: { enabled: false, days: 0, credits: 0 },
  credits: { featureCosts: { assistantMessage: 1, x30Generation: 1, advertisementGeneration: 1, videoGeneration: 1 } },
  unitEconomics: {
    // Conservative launch guard: the calculation intentionally ignores the
    // daily free allocation and treats USD provider cost as GBP cost.
    pricingVerifiedOn: "2026-09-03",
    pricingSource: "https://developers.cloudflare.com/workers-ai/platform/pricing/",
    maxInputTokensPerOperation: 4000,
    maxOutputTokensPerOperation: 1200,
    usdPerMillionInputTokens: 0.282,
    usdPerMillionOutputTokens: 0.827,
    stripeWorstCaseCardAndFxPct: 5.15,
    stripeBillingPct: 0.7,
    stripeFixedFeeMinor: 20,
    vatStressTestPct: 20,
    minimumPaidPlanGrossMarginPctBeforePaymentFeesAndTax: 80,
    minimumPaidPlanContributionMarginPctAfterStressCosts: 80,
  },
  quotas: { x30GenerationsPerDay: 3, x30GenerationsPerBillingPeriod: 20, x30OwnerWorkspacePerBillingPeriod: 50, tradingSimulationsPerDay: 100, perDay: 3, perBillingPeriod: 20 },
  enterprise: { maxSeats: 1, maxWorkspaces: 1, invitationsEnabled: false, commercialCeiling: { maxSeats: 100, maxWorkspaces: 24 } },
  tradingRisk: { maxRiskLimitPct: 25, maxStopLossPct: 20, maxTakeProfitPct: 100, maxPositionSizingPct: 25 },
  trading: { maximumRiskPercent: 25, maximumStopLossPercent: 20, maximumTakeProfitPercent: 100, maximumPositionSizingPercent: 25, liveTradingEnabled: false, liveOrders: false },
  providers: {
    ai: { enabled: false, approvalRequired: true, model: "none" },
    advertising: { enabled: false, approvalRequired: true },
    video: { enabled: false, approvalRequired: true },
    marketData: { enabled: false, approvalRequired: true, source: "repository-sample" },
  },
  features: { x30Generation: { enabled: false, approvalRequired: true }, enterpriseSso: { enabled: false, approvalRequired: true } },
  featureFlags: { x30Generation: false, liveBilling: true, paidAi: false, paidVideo: false, liveTrading: false, enterpriseSso: false },
} as const

// Published catalogue values and live monthly billing are active. Annual
// billing and paid provider capabilities remain fail-closed until separately approved.

export type CommercialPlan = keyof typeof COMMERCIAL_PLANS

export function getCommercialConfig() { return COMMERCIAL_CONFIG }

export function isCommercialFeatureEnabled(feature: keyof typeof COMMERCIAL_CONFIG.features): boolean { return COMMERCIAL_CONFIG.features[feature].enabled }
