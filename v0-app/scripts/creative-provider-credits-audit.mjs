import assert from "node:assert/strict"
import fs from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { creativeProviderCapability, invokeCreativeProvider, readCreativeCredits, reserveCreativeCredits, settleCreativeCredits, validateCreativeGeneration, CREATIVE_CREDIT_COST } from "../../src/creative-provider.js"

const database=new DatabaseSync(":memory:")
database.exec(fs.readFileSync(new URL("../../migrations/0019_creative_provider_credits.sql",import.meta.url),"utf8"))
const db={prepare(sql){return{bind(...values){return{run(){const r=database.prepare(sql).run(...values);return{meta:{changes:Number(r.changes)}}},first(){return database.prepare(sql).get(...values)||null}}}}}}
const id=(n)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`
const period="2026-09",userId="owner"
assert.deepEqual(creativeProviderCapability({},"premium").providers,{text:false,image:false,video:false})
assert.equal(creativeProviderCapability({CREATIVE_CANARY_ENABLED:"enabled",CREATIVE_TEXT_PROVIDER_ENABLED:"enabled",AI:{}},"premium").providers.text,true)
assert.equal((await readCreativeCredits(db,userId,period,"premium")).remaining,100)
const brief={operationId:id(90),requestId:id(190),operationType:"copy",locale:"en",channel:"linkedin",productOrService:"Secure booking",targetAudience:"Small businesses",objective:"Qualified enquiries",currentAd:"",sourceUrl:"",offer:"",cta:"",benefits:"Trusted setup",visualDirection:"Premium"}
assert.equal(validateCreativeGeneration(brief).ok,true)
assert.equal(validateCreativeGeneration({...brief,sourceUrl:"https://127.0.0.1/private"}).reason,"unsafe-source-url")
assert.equal(validateCreativeGeneration({...brief,sourceUrl:"http://example.com"}).reason,"unsafe-source-url")
assert.equal((await invokeCreativeProvider({CREATIVE_CANARY_ENABLED:"disabled",AI:{}},brief)).reason,"provider-disabled")
const generated=await invokeCreativeProvider({CREATIVE_CANARY_ENABLED:"enabled",CREATIVE_TEXT_PROVIDER_ENABLED:"enabled",AI:{run:async()=>({response:"DRAFT FOR REVIEW"})}},brief)
assert.equal(generated.state,"ready-for-review");assert.equal(generated.text,"DRAFT FOR REVIEW")
assert.equal((await reserveCreativeCredits(db,{operationId:id(1),requestId:id(101),userId,period,plan:"basic",operationType:"image"})).reason,"premium-required")
assert.equal((await reserveCreativeCredits(db,{operationId:id(2),requestId:id(102),userId,period,plan:"premium",operationType:"image"})).reserved,true)
assert.equal((await readCreativeCredits(db,userId,period,"premium")).reserved,CREATIVE_CREDIT_COST.image)
assert.equal((await reserveCreativeCredits(db,{operationId:id(3),requestId:id(102),userId,period,plan:"premium",operationType:"image"})).reason,"duplicate-operation")
assert.equal((await settleCreativeCredits(db,{operationId:id(2),userId,success:false,failureCode:"provider-failure"})).status,"failed")
assert.equal((await readCreativeCredits(db,userId,period,"premium")).remaining,100)
assert.equal((await reserveCreativeCredits(db,{operationId:id(4),requestId:id(104),userId,period,plan:"premium",operationType:"copy"})).reserved,true)
assert.equal((await settleCreativeCredits(db,{operationId:id(4),userId,success:true,settledCredits:1})).credits,1)
assert.equal((await readCreativeCredits(db,userId,period,"premium")).remaining,99)
assert.throws(()=>database.prepare("DELETE FROM creative_credit_operations").run(),/append-only/)
console.log("Creative Provider V1 + AI Credits audit passed: Premium/Pro entitlement, atomic reservation, duplicate guard, failure release, settlement and fail-closed providers")
