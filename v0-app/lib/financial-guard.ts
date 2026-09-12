/**
 * Financial Guard v0.1: bounded, provider-neutral cost and profitability
 * contracts. External adapters intentionally return unavailable until an
 * owner-configured source is approved; no financial values are fabricated.
 */
import { COMMERCIAL_CONFIG } from "./commercial-config"

export const FINANCIAL_GUARD_VERSION = "0.1" as const
export const FINANCIAL_PROVENANCE = ["verified", "estimated", "unavailable", "stale"] as const
export type FinancialProvenance = (typeof FINANCIAL_PROVENANCE)[number]
export type Money = { currency: "GBP"; minor: number }

export type FinancialPeriod = { start: string; end: string; timezone: "UTC" }
export type FinancialSource = { provenance: FinancialProvenance; source: string; observedAt?: string }
export type RevenueRecord = FinancialSource & { kind: "subscription" | "prepaid-credit"; amount: Money; count: number }
export type CostRecord = FinancialSource & { kind: "stripe-fee" | "cloudflare" | "database" | "email" | "ai" | "image" | "video" | "market-data" | "support" | "refund" | "failed-payment"; amount: Money; units: number }
export type UsageRecord = FinancialSource & { scope: "customer" | "workspace" | "plan" | "provider"; scopeHash: string; feature: string; units: number; cost: Money }

export interface FinancialSnapshot {
  schemaVersion: typeof FINANCIAL_GUARD_VERSION
  kind: "financial-guard-snapshot"
  period: FinancialPeriod
  revenue: readonly RevenueRecord[]
  costs: readonly CostRecord[]
  usage: readonly UsageRecord[]
  activeSubscriptions: number
  creditsSold: number
  creditsUsed: number
  forecastRevenue: Money
  forecastCost: Money
  source: FinancialSource
}

export type MarginStatus = "green" | "yellow" | "red" | "emergency"
export interface MarginSummary { revenue: Money; cost: Money; grossMarginPct: number | null; contributionMarginPct: number | null; status: MarginStatus; provenance: FinancialProvenance }
export interface GuardLimits { customerDailyMinor: number; customerMonthlyMinor: number; workspaceDailyMinor: number; workspaceMonthlyMinor: number; planDailyMinor: number; planMonthlyMinor: number; providerDailyMinor: number; providerMonthlyMinor: number; companyDailyMinor: number; companyMonthlyMinor: number; prepaidCreditsRequired: boolean; }
export type GuardDecision = { allowed: true; reservationId: string } | { allowed: false; code: "insufficient-credit" | "customer-ceiling" | "workspace-ceiling" | "plan-ceiling" | "provider-ceiling" | "company-ceiling" | "rate-limited" | "kill-switch" | "invalid-request"; refundable: false }

export interface GuardUsage { dailyMinor: number; monthlyMinor: number }
export interface FinancialGuardState {
  revision: number
  creditsAvailable: number
  creditsReserved: number
  customer: GuardUsage
  workspace: GuardUsage
  plan: GuardUsage
  provider: GuardUsage
  company: GuardUsage
}
export interface GuardReservationRequest { costMinor: number; expectedRevision?: number }

/**
 * Pure, compare-and-swap reservation contract. A persistence adapter must
 * commit `nextState` only when the revision still matches; rejected requests
 * return no partial state, so concurrent callers cannot overspend.
 */
export function reserveGuardCost(state: FinancialGuardState, request: GuardReservationRequest, config: FinancialGuardConfig = getFinancialGuardConfig()): { decision: GuardDecision; nextState?: FinancialGuardState } {
  const cost = request.costMinor
  if (!Number.isSafeInteger(cost) || cost <= 0 || !Number.isSafeInteger(state.revision) || state.revision < 0 || request.expectedRevision !== undefined && request.expectedRevision !== state.revision) return { decision: { allowed: false, code: "invalid-request", refundable: false } }
  if (config.controls.emergencyShutdown || !config.controls.providerEnabled) return { decision: { allowed: false, code: "kill-switch", refundable: false } }
  if (config.controls.prepaidCreditsRequired && (!Number.isSafeInteger(state.creditsAvailable) || state.creditsAvailable - cost < 0)) return { decision: { allowed: false, code: "insufficient-credit", refundable: false } }
  const checks: Array<[keyof FinancialGuardState, keyof GuardLimits]> = [["customer", "customerDailyMinor"], ["workspace", "workspaceDailyMinor"], ["plan", "planDailyMinor"], ["provider", "providerDailyMinor"], ["company", "companyDailyMinor"]]
  for (const [scope, dailyKey] of checks) {
    const usage = state[scope] as GuardUsage
    const monthlyKey = dailyKey.replace("Daily", "Monthly") as keyof GuardLimits
    if (!usage || !Number.isSafeInteger(usage.dailyMinor) || !Number.isSafeInteger(usage.monthlyMinor) || usage.dailyMinor < 0 || usage.monthlyMinor < 0 || usage.dailyMinor + cost > Number(config.limits[dailyKey]) || usage.monthlyMinor + cost > Number(config.limits[monthlyKey])) return { decision: { allowed: false, code: `${scope}-ceiling` as GuardDecision extends { allowed: false; code: infer C } ? C : never, refundable: false } }
  }
  const next = structuredClone(state)
  next.revision += 1
  next.creditsAvailable -= cost
  next.creditsReserved += cost
  for (const scope of ["customer", "workspace", "plan", "provider", "company"] as const) { next[scope].dailyMinor += cost; next[scope].monthlyMinor += cost }
  return { decision: { allowed: true, reservationId: `fg-${next.revision}` }, nextState: next }
}

export function isStale(source: FinancialSource, now = Date.now(), staleAfterHours = FINANCIAL_GUARD_DEFAULTS.staleAfterHours): boolean {
  if (source.provenance === "unavailable" || !source.observedAt) return source.provenance === "unavailable"
  const observed = Date.parse(source.observedAt)
  return !Number.isFinite(observed) || now - observed > staleAfterHours * 60 * 60 * 1000
}

export const FINANCIAL_GUARD_DEFAULTS = {
  thresholds: { greenMinPct: 80, yellowMinPct: 60 },
  staleAfterHours: 24 * 7,
  reviewCadence: { launch: "weekly-summary-monthly-close", growth: "monthly", stable: "quarterly", mature: "annual" },
  controls: { providerEnabled: false, emergencyShutdown: false, postpaidOverage: false, prepaidCreditsRequired: true },
  limits: { customerDailyMinor: 500, customerMonthlyMinor: 5_000, workspaceDailyMinor: 1_000, workspaceMonthlyMinor: 10_000, planDailyMinor: 10_000, planMonthlyMinor: 100_000, providerDailyMinor: 25_000, providerMonthlyMinor: 250_000, companyDailyMinor: 50_000, companyMonthlyMinor: 500_000, prepaidCreditsRequired: true },
  safeInitialCustomers: 100,
} as const

export interface FinancialGuardConfig { schemaVersion: typeof FINANCIAL_GUARD_VERSION; thresholds: typeof FINANCIAL_GUARD_DEFAULTS.thresholds; limits: GuardLimits; reviewCadence: typeof FINANCIAL_GUARD_DEFAULTS.reviewCadence; controls: typeof FINANCIAL_GUARD_DEFAULTS.controls; }
export const getFinancialGuardConfig = (): FinancialGuardConfig => ({ schemaVersion: FINANCIAL_GUARD_VERSION, thresholds: FINANCIAL_GUARD_DEFAULTS.thresholds, limits: FINANCIAL_GUARD_DEFAULTS.limits, reviewCadence: FINANCIAL_GUARD_DEFAULTS.reviewCadence, controls: FINANCIAL_GUARD_DEFAULTS.controls })

const money = (minor: number): Money => ({ currency: "GBP", minor: Number.isSafeInteger(minor) ? minor : 0 })
export function calculateMargin(revenueMinor: number, costMinor: number, provenance: FinancialProvenance = "verified"): MarginSummary {
  const valid = Number.isSafeInteger(revenueMinor) && Number.isSafeInteger(costMinor) && revenueMinor >= 0 && costMinor >= 0
  if (!valid || revenueMinor === 0) return { revenue: money(Math.max(0, revenueMinor)), cost: money(Math.max(0, costMinor)), grossMarginPct: null, contributionMarginPct: null, status: "red", provenance: valid ? provenance : "unavailable" }
  const pct = Math.max(-100, Math.min(100, ((revenueMinor - costMinor) / revenueMinor) * 100))
  const status: MarginStatus = pct < 0 ? "emergency" : pct >= FINANCIAL_GUARD_DEFAULTS.thresholds.greenMinPct ? "green" : pct >= FINANCIAL_GUARD_DEFAULTS.thresholds.yellowMinPct ? "yellow" : "red"
  return { revenue: money(revenueMinor), cost: money(costMinor), grossMarginPct: pct, contributionMarginPct: pct, status, provenance }
}

export function unavailableFinancialSource(source: string): FinancialSource { return { provenance: "unavailable", source } }
export const stripeAdapter = () => unavailableFinancialSource("stripe-not-configured")
export const cloudflareAdapter = () => unavailableFinancialSource("cloudflare-cost-source-not-configured")
export const workersAiAdapter = () => unavailableFinancialSource("workers-ai-usage-not-configured")
export const emailAdapter = () => unavailableFinancialSource("email-cost-source-not-configured")
export const mediaAdapter = () => unavailableFinancialSource("media-provider-not-configured")
export const marketDataAdapter = () => unavailableFinancialSource("market-data-not-configured")

export type MonthlyCloseState = "draft" | "data-incomplete" | "ready-for-review" | "owner-approved" | "locked" | "reopened"
export interface MonthlyClose { id?: string; schemaVersion: typeof FINANCIAL_GUARD_VERSION; kind: "monthly-close"; period: FinancialPeriod; state: MonthlyCloseState; snapshot: FinancialSnapshot; recommendations: readonly string[]; ownerNotes?: string; approval?: { approvedAt: string; actorHash: string }; reopenReason?: string; createdAt: string; updatedAt: string; }
export function assertNoNegativeBalances(credits: number, reserved: number): boolean { return Number.isSafeInteger(credits) && Number.isSafeInteger(reserved) && credits >= 0 && reserved >= 0 && reserved <= credits }
export function classifyMargin(summary: MarginSummary, ceilingExceeded = false): MarginStatus { return ceilingExceeded ? "emergency" : summary.status }
export function commercialFeatureCost(feature: string): number { const costs = COMMERCIAL_CONFIG.credits.featureCosts as Record<string, number>; return Number.isSafeInteger(costs[feature]) ? costs[feature] : 0 }
