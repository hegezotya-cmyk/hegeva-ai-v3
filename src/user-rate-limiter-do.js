import { DurableObject } from "cloudflare:workers"

export class UserRateLimiter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS rate_events (at INTEGER NOT NULL)")
      ctx.storage.sql.exec("CREATE INDEX IF NOT EXISTS rate_events_at ON rate_events(at)")
      ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS active_leases (id INTEGER PRIMARY KEY CHECK (id = 1), active_token TEXT, active_until INTEGER NOT NULL DEFAULT 0)")
      ctx.storage.sql.exec("INSERT OR IGNORE INTO active_leases (id, active_token, active_until) VALUES (1, NULL, 0)")
    })
  }

  admit(now = Date.now()) {
    const shortSince = now - 10_000
    const sustainedSince = now - 60_000
    this.ctx.storage.sql.exec("DELETE FROM rate_events WHERE at < ?", sustainedSince)
    const short = this.ctx.storage.sql.exec("SELECT COUNT(*) AS count FROM rate_events WHERE at >= ?", shortSince).one().count
    const sustained = this.ctx.storage.sql.exec("SELECT COUNT(*) AS count FROM rate_events WHERE at >= ?", sustainedSince).one().count
    const lease = this.ctx.storage.sql.exec("SELECT active_token, active_until FROM active_leases WHERE id = 1").one()
    if (Number(lease.active_until) > now) return { allowed: false, reason: "concurrent", retryAfterMs: Number(lease.active_until) - now }
    if (short >= 5) {
      const oldest = this.ctx.storage.sql.exec("SELECT MIN(at) AS oldest FROM rate_events WHERE at >= ?", shortSince).one().oldest
      return { allowed: false, reason: "burst", retryAfterMs: Math.max(1_000, Number(oldest) + 10_000 - now) }
    }
    if (sustained >= 12) {
      const oldest = this.ctx.storage.sql.exec("SELECT MIN(at) AS oldest FROM rate_events WHERE at >= ?", sustainedSince).one().oldest
      return { allowed: false, reason: "sustained", retryAfterMs: Math.max(1_000, Number(oldest) + 60_000 - now) }
    }
    this.ctx.storage.sql.exec("INSERT INTO rate_events (at) VALUES (?)", now)
    const token = crypto.randomUUID()
    this.ctx.storage.sql.exec("UPDATE active_leases SET active_token = ?, active_until = ? WHERE id = 1", token, now + 35_000)
    return { allowed: true, token, retryAfterMs: 0 }
  }

  release(token) {
    if (typeof token !== "string" || !token) return { released: false }
    const current = this.ctx.storage.sql.exec("SELECT active_token FROM active_leases WHERE id = 1").one()
    if (current?.active_token !== token) return { released: false }
    this.ctx.storage.sql.exec("UPDATE active_leases SET active_token = NULL, active_until = 0 WHERE id = 1")
    return { released: true }
  }
}
