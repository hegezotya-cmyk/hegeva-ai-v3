import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const [sitemap, config] = await Promise.all([
  readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
  readFile(new URL("../next.config.mjs", import.meta.url), "utf8"),
])

assert.match(sitemap, /'\/enterprise'/, "public Enterprise page must be listed in the sitemap")
for (const directive of [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
]) {
  assert.ok(config.includes(directive), `CSP must include ${directive}`)
}
assert.match(config, /https:\/\/www\.googletagmanager\.com/, "CSP must preserve consented analytics loading")
assert.match(config, /https:\/\/www\.clarity\.ms/, "CSP must preserve optional consented Clarity loading")
assert.match(config, /https:\/\/checkout\.stripe\.com/, "CSP must preserve Stripe Checkout framing")
assert.match(config, /connect-src[^"]*https:\/\/hegevaai\.co\.uk/, "CSP must preserve the public auth client origin")

console.log("Production surface audit passed: Enterprise sitemap and CSP contract")
