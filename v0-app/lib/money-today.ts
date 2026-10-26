import type { CoreDecisionResponse, OpportunityRadarFinding } from "./use-core-decision"

export type MoneyTodayAction = {
  id: "overdue-invoices" | "stale-quotes" | "customer-followups"
  priority: number
  count: number
  amount?: number
  currency?: "GBP"
  href: string
}

export type MoneyTodayState = "loading" | "unauthenticated" | "unavailable" | "empty" | "ready"

const definitions: Record<MoneyTodayAction["id"], { priority: number; radarKind?: string }> = {
  "overdue-invoices": { priority: 3, radarKind: "payment-risk" },
  "stale-quotes": { priority: 2, radarKind: "quote-leakage" },
  "customer-followups": { priority: 1 },
}

const destinations: Record<MoneyTodayAction["id"], string> = {
  "overdue-invoices": "/business/invoices?focus=payment-followup",
  "stale-quotes": "/business/invoices?focus=quote-followup",
  "customer-followups": "/business/customers",
}

function validGbpAmount(finding: OpportunityRadarFinding | undefined) {
  return finding?.currency === "GBP" && Number.isFinite(finding.amount) && Number(finding.amount) >= 0
    ? Number(finding.amount)
    : undefined
}

export function selectMoneyTodayActions(response: CoreDecisionResponse): MoneyTodayAction[] {
  const seen = new Set<MoneyTodayAction["id"]>()
  const items: MoneyTodayAction[] = []
  for (const rule of response.businessRules) {
    if (rule.kind !== "overdue-invoices" && rule.kind !== "stale-quotes" && rule.kind !== "customer-followups") continue
    if (seen.has(rule.kind) || rule.count <= 0) continue
    seen.add(rule.kind)
    const definition = definitions[rule.kind]
    const amount = validGbpAmount(definition.radarKind
      ? response.opportunityRadar.find((candidate) => candidate.kind === definition.radarKind)
      : undefined)
    items.push({ id: rule.kind, priority: definition.priority, count: rule.count, ...(amount === undefined ? {} : { amount, currency: "GBP" }), href: destinations[rule.kind] })
  }
  return items.sort((left, right) => right.priority - left.priority).slice(0, 5)
}

export function getMoneyTodayState(status: "loading" | "ready" | "unauthenticated" | "unavailable", actions: MoneyTodayAction[]): MoneyTodayState {
  if (status !== "ready") return status
  return actions.length ? "ready" : "empty"
}
