export async function handleAiChatAdmission({
  request,
  user,
  planInfo,
  period,
  body,
  runtime,
  reserve,
  readUsage,
  execute,
  distributed,
  now = Date.now,
  cooldownMs = 1500,
}) {
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 })
  }

  const input = body || await request.json()
  const message = typeof input.message === "string" ? input.message.trim() : ""
  if (!message) return Response.json({ error: "Please enter a message." }, { status: 400 })
  if (message.length > 2500) return Response.json({ error: "Message is too long." }, { status: 400 })

  const rawHistory = Array.isArray(input.history) ? input.history.slice(-10) : []
  let totalChars = 0
  const safeHistory = []
  for (const item of rawHistory) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") continue
    const content = item.content.slice(0, 1200)
    if (totalChars + content.length > 7000) break
    totalChars += content.length
    safeHistory.push({ role: item.role, content })
  }

  const aiUserKey = String(user.id)
  const current = now()

  const lastRequest = Number(runtime.lastRequest.get(aiUserKey) || 0)
  const retryAfterMs = cooldownMs - (current - lastRequest)
  if (retryAfterMs > 0) {
    return Response.json(
      { error: "Please wait a moment before sending another AI request.", retryAfterMs },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) } },
    )
  }

  if (runtime.inFlight.has(aiUserKey)) {
    return Response.json({ error: "An AI request is already running. Please wait for it to finish." }, { status: 429 })
  }

  runtime.inFlight.add(aiUserKey)
  let distributedAcquired = false
  let distributedToken = null
  try {
    if (!distributed) {
      return Response.json({ error: "AI service is temporarily unavailable." }, { status: 503 })
    }
    let distributedResult
    try {
      distributedResult = await distributed.admit(current)
    } catch {
      return Response.json({ error: "AI service is temporarily unavailable." }, { status: 503 })
    }
    if (!distributedResult?.allowed) {
      return Response.json(
        { error: "Too many AI requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(Number(distributedResult?.retryAfterMs || 1_000) / 1000))) } },
      )
    }
    if (typeof distributedResult.token !== "string" || !distributedResult.token) {
      return Response.json({ error: "AI service is temporarily unavailable." }, { status: 503 })
    }
    distributedToken = distributedResult.token
    distributedAcquired = true
    const reservation = await reserve(user.id, period, planInfo.limit)
    if (!reservation.reserved) {
      if (reservation.reason === "duplicate_attempt") {
        return Response.json({ error: "This X20 attempt was already received." }, { status: 409 })
      }
      if (reservation.reason === "duplicate_assistant_operation") {
        return Response.json({ error: "This Assistant request was already received." }, { status: 409 })
      }
      if (reservation.reason === "invalid_assistant_operation") {
        return Response.json({ error: "A valid Assistant operation is required." }, { status: 400 })
      }
      if (reservation.reason === "expired_assistant_operation") {
        return Response.json({ error: "This Assistant request has expired. Please start a new request." }, { status: 409 })
      }
      if (reservation.reason === "invalid_assistant_plan_limit") {
        return Response.json({ error: "AI service is temporarily unavailable." }, { status: 503 })
      }
      const used = await readUsage(user.id, period)
      return Response.json(
        { error: "Monthly AI message limit reached.", plan: planInfo.plan, limit: planInfo.limit, used },
        { status: 429 },
      )
    }
    runtime.lastRequest.set(aiUserKey, current)
    return await execute({ input, message, safeHistory, user, planInfo, period })
  } finally {
    if (distributed && distributedAcquired) {
      try { await distributed.release(distributedToken) } catch {}
    }
    runtime.inFlight.delete(aiUserKey)
  }
}
