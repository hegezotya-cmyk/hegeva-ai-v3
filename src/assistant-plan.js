export const PLAN_LIMITS = Object.freeze({
  basic: 50,
  premium: 300,
  pro: 1000,
})

export function resolveAssistantPlan(row) {
  const requestedPlan = typeof row?.plan === "string" ? row.plan : "basic"
  if (requestedPlan === "enterprise") {
    return {
      plan: "enterprise",
      limit: null,
      assistantAvailable: false,
      reason: "custom-entitlement-required",
      createdAt: row?.createdAt || null,
      updatedAt: row?.updatedAt || null,
    }
  }

  const plan = Object.prototype.hasOwnProperty.call(PLAN_LIMITS, requestedPlan)
    ? requestedPlan
    : "basic"
  return {
    plan,
    limit: PLAN_LIMITS[plan],
    assistantAvailable: true,
    reason: null,
    createdAt: row?.createdAt || null,
    updatedAt: row?.updatedAt || null,
  }
}
