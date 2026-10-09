import assert from "node:assert/strict"
import fs from "node:fs"

const tracking = fs.readFileSync(new URL("../lib/conversion-tracking.ts", import.meta.url), "utf8")
const legal = fs.readFileSync(new URL("../lib/i18n/legal-copy.ts", import.meta.url), "utf8")
const allowed = tracking.match(/const allowed = (\{[\s\S]*?\}) as const/)?.[1]
const campaignAttribution = tracking.match(/export function campaignAttribution\(\): Record<string, string> \{[\s\S]*?\n\}/)?.[0]
assert.ok(allowed, "campaign allowlist must exist")
assert.ok(campaignAttribution, "campaignAttribution helper must exist")

const helperSource = campaignAttribution
  .replace("export function", "function")
  .replace(/\): Record<string, string>/, ")")
  .replace(/: Record<string, string>/g, "")
  .replace(/\(values as readonly string\[\]\)/g, "values")
const helper = new Function("window", "localStorage", "sessionStorage", "URLSearchParams", `const allowed = ${allowed}; const campaignKey = "hegeva:campaign:v1"; ${helperSource}; return campaignAttribution`)
const makeStorage = (values = {}) => ({
  values: new Map(Object.entries(values)),
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null },
  setItem(key, value) { this.values.set(key, String(value)) },
})
const localStorage = makeStorage({ "hegeva:analytics-consent:v1": "granted" })
const sessionStorage = makeStorage()
const window = { location: { search: "?utm_source=facebook&utm_medium=organic_social&utm_campaign=hegeva_8day_oct2026&utm_content=fb_day01&customer_email=private@example.com" } }
const track = helper(window, localStorage, sessionStorage, URLSearchParams)
const result = track()

assert.deepEqual(result, {
  campaign_source: "facebook",
  campaign_medium: "organic_social",
  campaign_name: "hegeva_8day_oct2026",
  campaign_content: "fb_day01",
}, "approved campaign UTM values must be retained without copying unrelated query parameters")

for (let day = 1; day <= 8; day++) {
  const dayLabel = String(day).padStart(2, "0")
  window.location.search = `?utm_source=instagram&utm_medium=organic_social&utm_campaign=hegeva_8day_oct2026&utm_content=ig_day${dayLabel}`
  assert.equal(track().campaign_content, `ig_day${dayLabel}`, `Instagram day ${dayLabel} content must be retained`)
  window.location.search = `?utm_source=facebook&utm_medium=organic_social&utm_campaign=hegeva_8day_oct2026&utm_content=fb_day${dayLabel}`
  assert.equal(track().campaign_content, `fb_day${dayLabel}`, `Facebook day ${dayLabel} content must be retained`)
}

window.location.search = "?utm_source=facebook&utm_medium=organic_social&utm_campaign=unknown&utm_content=fb_day01"
assert.equal(track().campaign_name, undefined, "unapproved campaign values must still be rejected")
assert.equal(track().campaign_content, "fb_day01", "valid content labels can be retained independently of a campaign label")

localStorage.setItem("hegeva:analytics-consent:v1", "denied")
assert.deepEqual(track(), {}, "campaign attribution must remain consent-gated")

assert.match(legal, /only approved UTM source, medium, campaign and content labels[\s\S]*?raw URL query strings/, "English privacy copy must explain the allowlisted campaign labels and raw-query filtering")
assert.match(legal, /csak az engedélyezett UTM-forrás[\s\S]*?teljes URL-lekérdezést/, "Hungarian privacy copy must explain the allowlisted campaign labels and raw-query filtering")
console.log("Campaign attribution GA4 audit: PASS")
