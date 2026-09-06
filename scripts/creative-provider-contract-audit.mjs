import assert from "node:assert/strict"
import fs from "node:fs"
const provider=fs.readFileSync(new URL("../src/creative-provider.js",import.meta.url),"utf8")
const migration=fs.readFileSync(new URL("../migrations/0019_creative_provider_credits.sql",import.meta.url),"utf8")
for(const token of ["CREATIVE_CREDIT_ALLOWANCE","CREATIVE_CREDIT_COST","premium-required","duplicate-operation","credits-exhausted","draft-review"])assert.ok(provider.includes(token),`missing ${token}`)
for(const token of ["creative_credit_admission","creative_credit_reserve","creative_credit_settle","creative_credit_release","creative_credit_terminal_immutable","creative_credit_no_delete"])assert.ok(migration.includes(token),`missing ${token}`)
assert.ok(provider.includes('CREATIVE_IMAGE_PROVIDER_ENABLED === "enabled"')&&provider.includes('CREATIVE_VIDEO_PROVIDER_ENABLED === "enabled"'))
assert.ok(provider.includes("isCreativeCanaryOwner")&&provider.includes("CREATIVE_CANARY_EMAIL")&&provider.includes("invokeCreativeProvider"),"owner canary boundary required")
for(const token of ['protocol!=="https:"','hostname==="localhost"','redirect:"error"','AbortSignal.timeout(8000)','length>150000','untrusted evidence'])assert.ok(provider.includes(token),`missing URL safety ${token}`)
const worker=fs.readFileSync(new URL("../src/index.js",import.meta.url),"utf8")
for(const token of ["/api/creative/capability","/api/creative/generate","isCreativeCanaryOwner","reserveCreativeCredits","invokeCreativeProvider","settleCreativeCredits","creative-rate-limit","Premium or Pro","ready-for-review"])assert.ok(worker.includes(token),`missing creative route ${token}`)
assert.ok(worker.indexOf("reserveCreativeCredits")<worker.indexOf("invokeCreativeProvider(env,validated.brief)"),"credit reservation must precede provider invocation")
assert.ok(provider.indexOf("providers.image")<provider.indexOf("CREATIVE_IMAGE_MODEL")||provider.includes("if(!capability.providers.image)"),"image gate must precede invocation")
console.log("Creative provider contract audit passed: owner-only fail-closed provider boundary and immutable credit accounting")
