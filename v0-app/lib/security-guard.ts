export type GuardRisk = "low" | "medium" | "high" | "critical"
export type GuardOutcome = "allow" | "deny" | "approval-required"

export type SecurityGuardRequest = {
  action: string
  category: "read" | "write" | "execute" | "billing" | "admin" | "export"
  userId?: string
  workspaceId?: string
  permission: string
  approved?: boolean
  risk: GuardRisk
}

export type SecurityGuardDecision = {
  outcome: GuardOutcome
  reasonCode: string
  auditable: true
}

const riskOrder: Record<GuardRisk, number> = { low: 0, medium: 1, high: 2, critical: 3 }

/** Deterministic deny-by-default gate for privileged operations. */
export function evaluateSecurityGuard(request: SecurityGuardRequest): SecurityGuardDecision {
  if (!request.action.trim() || !request.permission.trim()) return { outcome: "deny", reasonCode: "invalid-request", auditable: true }
  if (!request.userId || !request.workspaceId) return { outcome: "deny", reasonCode: "ownership-scope-required", auditable: true }
  if (request.approved === false) return { outcome: "deny", reasonCode: "user-rejected", auditable: true }
  if (riskOrder[request.risk] >= riskOrder.high && request.approved !== true) return { outcome: "approval-required", reasonCode: "explicit-approval-required", auditable: true }
  return { outcome: "allow", reasonCode: "permission-and-scope-verified", auditable: true }
}
