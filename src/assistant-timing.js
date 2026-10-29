// Settle credits before the browser deadline; hold concurrency until then.
export const ADVANCED_ASSISTANT_TIMING = Object.freeze({ providerMs: 45_000, leaseMs: 65_000 })
export const assistantLeaseTimeout = tier => tier === "advanced" ? ADVANCED_ASSISTANT_TIMING.leaseMs : 35_000

export function assistantTimeoutResponse(error, operationId) {
  if (error?.name !== "HEGEVA_AI_TIMEOUT" || error?.creditsRefunded !== true) return null
  return Response.json({ error: "Assistant response timed out. Reserved credits were returned.", code: "ASSISTANT_TIMEOUT", creditsRefunded: true, assistantOperationId: operationId }, { status: 504, headers: { "Cache-Control": "no-store" } })
}

export function assistantRefundedFailureResponse(error, operationId) {
  const timeout = assistantTimeoutResponse(error, operationId)
  if (timeout) return timeout
  if (error?.name !== "HEGEVA_PROVIDER_UNAVAILABLE" || error?.creditsRefunded !== true) return null
  return Response.json({ error: "Assistant could not complete the answer. Reserved credits were returned.", code: "ASSISTANT_REQUEST_FAILED", creditsRefunded: true, assistantOperationId: operationId }, { status: 502, headers: { "Cache-Control": "no-store" } })
}
