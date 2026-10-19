export const AI_QUOTA_RESERVATION_SQL = `
  INSERT INTO ai_usage (
    userId,
    period,
    aiMessages,
    createdAt,
    updatedAt
  )
  VALUES (
    ?1,
    ?2,
    1,
    ?3,
    ?3
  )
  ON CONFLICT(userId, period)
  DO UPDATE SET
    aiMessages = aiMessages + 1,
    updatedAt = excluded.updatedAt
  WHERE aiMessages < ?4
`

export async function reserveAIUsage(env, userId, period, limit) {
  const now = new Date().toISOString()
  const result = await env.DB
    .prepare(AI_QUOTA_RESERVATION_SQL)
    .bind(userId, period, now, limit)
    .run()

  return {
    reserved: Number(result?.meta?.changes || 0) === 1,
    result,
  }
}
