/**
 * Central, provisional commercial and safety settings.
 *
 * These values are intentionally conservative placeholders.  Product and
 * finance owners can change this one contract after commercial review without
 * changing workflow code.  A disabled capability must remain disabled until
 * its external authority and approval gate are configured.
 */
export const COMMERCIAL_CONFIG_VERSION = "0.1" as const

export const COMMERCIAL_PLANS = {
  free: { monthlyMinor: 0, annualMinor: 0, includedCredits: 0 },
  provisionalPro: { monthlyMinor: 0, annualMinor: 0, includedCredits: 0 },
  provisionalEnterprise: { monthlyMinor: 0, annualMinor: 0, includedCredits: 0 },
} as const

export const COMMERCIAL_CONFIG = {
  billing: { currency: "GBP", mode: "sandbox" as const, liveEnabled: false },
  plans: COMMERCIAL_PLANS,
  prices: { currency: "GBP", monthly: { free: 0, provisionalPro: 0, provisionalEnterprise: 0 }, annual: { free: 0, provisionalPro: 0, provisionalEnterprise: 0 } },
  monthlyIncluded: { free: 0, provisionalPro: 0, provisionalEnterprise: 0 },
  trial: { enabled: false, days: 0, credits: 0 },
  credits: { featureCosts: { assistantMessage: 1, x30Generation: 1, advertisementGeneration: 1, videoGeneration: 1 } },
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
  featureFlags: { x30Generation: false, liveBilling: false, paidAi: false, paidVideo: false, liveTrading: false, enterpriseSso: false },
} as const

// The unpriced Sandbox state is intentionally retained as the commercial
// default; this marker keeps older contract audits explicit about that rule.
// mode: "sandbox-unpriced"

export type CommercialPlan = keyof typeof COMMERCIAL_PLANS

export function getCommercialConfig() { return COMMERCIAL_CONFIG }

export function isCommercialFeatureEnabled(feature: keyof typeof COMMERCIAL_CONFIG.features): boolean { return COMMERCIAL_CONFIG.features[feature].enabled }
