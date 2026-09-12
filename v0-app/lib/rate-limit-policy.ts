export type RateLimitCategory = "auth" | "chat" | "studio" | "billing" | "workspace" | "admin" | "contact"
export type RateLimitPolicy = { category: RateLimitCategory; limit: number; windowMs: number; key: "user" | "workspace" | "ip" }

export const RATE_LIMIT_POLICIES: Record<RateLimitCategory, RateLimitPolicy> = {
  auth: { category: "auth", limit: 10, windowMs: 15 * 60_000, key: "ip" },
  chat: { category: "chat", limit: 30, windowMs: 60_000, key: "user" },
  studio: { category: "studio", limit: 10, windowMs: 60_000, key: "user" },
  billing: { category: "billing", limit: 12, windowMs: 60_000, key: "user" },
  workspace: { category: "workspace", limit: 120, windowMs: 60_000, key: "workspace" },
  admin: { category: "admin", limit: 30, windowMs: 60_000, key: "user" },
  contact: { category: "contact", limit: 5, windowMs: 60 * 60_000, key: "ip" },
}

export function getRateLimitPolicy(category: RateLimitCategory) { return RATE_LIMIT_POLICIES[category] }
/** Policy and headers only; distributed enforcement requires a remote store. */
export function rateLimitHeaders(limit: RateLimitPolicy, remaining: number, resetAt: number) {
  return { "X-RateLimit-Limit": String(limit.limit), "X-RateLimit-Remaining": String(Math.max(0, remaining)), "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)) }
}
