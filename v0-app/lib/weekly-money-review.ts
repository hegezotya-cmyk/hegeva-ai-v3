import type { CoreDecisionResponse, OpportunityRadarFinding } from "./use-core-decision"

export type WeeklyMoneyReviewAction = {
  id: "overdue-invoices" | "stale-quotes" | "customer-followups"
  priority: number
  count: number
  amount?: number
  currency?: "GBP"
  href: string
}

export type WeeklyMoneyReviewState = "loading" | "unauthenticated" | "unavailable" | "empty" | "ready"

const definitions: Record<WeeklyMoneyReviewAction["id"], { priority: number; radarKind?: string; href: string }> = {
  "overdue-invoices": { priority: 3, radarKind: "payment-risk", href: "/business/invoices?focus=payment-followup" },
  "stale-quotes": { priority: 2, radarKind: "quote-leakage", href: "/business/invoices?focus=quote-followup" },
  "customer-followups": { priority: 1, href: "/business/customers" },
}

function validGbpAmount(finding: OpportunityRadarFinding | undefined) {
  return finding?.currency === "GBP" && Number.isFinite(finding.amount) && Number(finding.amount) >= 0 ? Number(finding.amount) : undefined
}

export function selectWeeklyMoneyReview(response: CoreDecisionResponse): WeeklyMoneyReviewAction[] {
  const seen = new Set<WeeklyMoneyReviewAction["id"]>()
  const actions: WeeklyMoneyReviewAction[] = []
  for (const rule of response.businessRules) {
    if (rule.kind !== "overdue-invoices" && rule.kind !== "stale-quotes" && rule.kind !== "customer-followups") continue
    if (seen.has(rule.kind) || rule.count <= 0) continue
    seen.add(rule.kind)
    const definition = definitions[rule.kind]
    const amount = validGbpAmount(definition.radarKind ? response.opportunityRadar.find((finding) => finding.kind === definition.radarKind) : undefined)
    actions.push({ id: rule.kind, priority: definition.priority, count: rule.count, ...(amount === undefined ? {} : { amount, currency: "GBP" }), href: definition.href })
  }
  return actions.sort((left, right) => right.priority - left.priority).slice(0, 3)
}

export function getWeeklyMoneyReviewState(status: "loading" | "ready" | "unauthenticated" | "unavailable", actions: WeeklyMoneyReviewAction[]): WeeklyMoneyReviewState {
  return status === "ready" ? (actions.length ? "ready" : "empty") : status
}
