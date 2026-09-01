import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const scriptDir=dirname(fileURLToPath(import.meta.url)); const appRoot=resolve(scriptDir,".."); const repositoryRoot=resolve(appRoot,".."); const sourceRoot=join(repositoryRoot,"src"); const migrationsRoot=join(repositoryRoot,"migrations")
const page=await readFile(join(appRoot,"app/business/financial-guard/page.tsx"),"utf8")
const component=await readFile(join(appRoot,"components/business/financial-guard.tsx"),"utf8")
const config=await readFile(join(appRoot,"lib/commercial-config.ts"),"utf8")
const domain=await readFile(join(appRoot,"lib/financial-guard.ts"),"utf8")
const assert=(v,m)=>{if(!v)throw new Error(m)}
assert(page.includes("FinancialGuard"),"route must render FinancialGuard")
for(const token of ["invoice_documents","financial_guard_monthly_closes","ready-for-review","data-incomplete","ownerNotes","revenue","costs","contribution","forecast","ceiling"])assert(component.includes(token),`missing ${token}`)
for(const locale of ["en","hu","de","fr","es"])assert(component.includes(`${locale}:`),`missing locale ${locale}`)
assert(component.includes("useSession")&&component.includes("useWorkspaceData"),"auth and workspace persistence required")
assert(component.includes("slice(0,2000)"),"notes must be bounded")
assert(config.includes("featureFlags")&&config.includes("liveBilling: false"),"external controls must remain disabled")
for(const token of ["reserveGuardCost","expectedRevision","emergencyShutdown","prepaidCreditsRequired","creditsAvailable","creditsReserved","isStale","unavailableFinancialSource"])assert(domain.includes(token),`missing financial guard control ${token}`)
assert(domain.includes("next.revision += 1")&&domain.includes("next.creditsAvailable -= cost"),"reservation must advance atomically")
assert(domain.includes("return { decision: { allowed: false")&&domain.includes("nextState: next"),"rejections must not expose partial state")
assert(!/sk_live_|pk_live_|password\s*[:=]/i.test(component),"no secrets")
console.log("Financial Guard audit passed")
