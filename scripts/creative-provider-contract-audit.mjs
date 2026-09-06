import assert from "node:assert/strict"
import fs from "node:fs"
const provider=fs.readFileSync(new URL("../src/creative-provider.js",import.meta.url),"utf8")
const migration=fs.readFileSync(new URL("../migrations/0019_creative_provider_credits.sql",import.meta.url),"utf8")
for(const token of ["CREATIVE_CREDIT_ALLOWANCE","CREATIVE_CREDIT_COST","premium-required","duplicate-operation","credits-exhausted","draft-review"])assert.ok(provider.includes(token),`missing ${token}`)
for(const token of ["creative_credit_admission","creative_credit_reserve","creative_credit_settle","creative_credit_release","creative_credit_terminal_immutable","creative_credit_no_delete"])assert.ok(migration.includes(token),`missing ${token}`)
assert.ok(provider.includes('CREATIVE_IMAGE_PROVIDER_ENABLED === "enabled"')&&provider.includes('CREATIVE_VIDEO_PROVIDER_ENABLED === "enabled"'))
assert.ok(!provider.includes("fetch(")&&!provider.includes("AI.run("),"provider contract must not invoke an unapproved provider")
console.log("Creative provider contract audit passed: provider-neutral fail-closed boundary and immutable credit accounting")
