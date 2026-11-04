// TEST-ONLY synthetic credentials for a disposable local Wrangler D1 fixture.
// Never execute against remote staging/production; this script writes a SQL file
// but does not run SQL or perform network requests.
import assert from "node:assert/strict"
import { writeFileSync } from "node:fs"
import { hashPassword } from "better-auth/crypto"

const output = process.env.HEGEVA_LOCAL_ACCOUNT_SEED_SQL || ""
assert.equal(process.env.HEGEVA_TEST_BASE_URL, "http://127.0.0.1:8788",
  "Only the isolated local Worker test may generate fixture credential SQL")
assert.ok(output.startsWith("/"), "The test output SQL must be an absolute temp path")
assert.ok(output.includes("hegeva-local-"), "Refuse non-fixture SQL destination")

const escapeSql = value => "'" + String(value).replaceAll("'", "''") + "'"
const records = [
  ["fixture-tenant-alpha", "Fixture-Only-Alpha-Password-2026!"],
  ["fixture-tenant-beta", "Fixture-Only-Beta-Password-2026!"],
]
const statements = ["-- Synthetic credential hashes. Apply with wrangler d1 execute --local ONLY."]
for (const [userId, password] of records) {
  const hash = await hashPassword(password)
  assert.ok(typeof hash === "string" && hash.length > 40, "Better Auth hashPassword failed")
  statements.push(`INSERT INTO "account" ("id","accountId","providerId","userId","password","issuer","createdAt","updatedAt")
VALUES (${escapeSql("account-" + userId)},${escapeSql(userId)},'credential',${escapeSql(userId)},
${escapeSql(hash)},'local:credential',CAST(strftime('%s','now') AS INTEGER)*1000,
CAST(strftime('%s','now') AS INTEGER)*1000);`)
}
writeFileSync(output, statements.join("\n") + "\n", { mode: 0o600 })
console.log("Generated two Better Auth credential hashes for isolated local D1. No credentials logged.")
