import assert from "node:assert/strict"
import { loadTypeScriptModule } from "./x20-test-loader.mjs"

const spec = loadTypeScriptModule(new URL("../lib/app-studio-spec-match.ts", import.meta.url))
const request = "Create a simple customer follow-up tracker. Include customer name, company, follow-up date, status: New, In Progress, Completed; add, edit and delete demo customers locally; search and status filtering; mobile-friendly layout. Use a premium dark HEGEVA-style interface. Clearly label all records as demo data. Do not use PawFlow or pet-grooming content. Do not claim cloud synchronization."
const valid = "Customer client followup tracker next contact due date responsive mobile layout localStorage browser storage add create edit update delete remove search query filter status filter demo data sample data customer company organisation organization new in progress completed premium dark hegeva-style"
const styleOnly = "premium dark hegeva-style interface polished modern responsive"
const missingDelete = "Customer followup tracker responsive localStorage add create edit update search filter demo data company status new in progress completed"

const validResult = spec.auditStudioSpecMatch(valid, request)
assert(validResult.score >= 75, `semantic tracker aliases should pass, received ${validResult.score}%`)
assert(!validResult.terms.includes("pawflow") && !validResult.terms.includes("grooming"), "negated PawFlow terms must not be positive requirements")
assert.equal(spec.isPawFlowRequest(request), false)
assert(spec.isPawFlowRequest("Build PawFlow for pet grooming appointments."), "explicit PawFlow request must remain positive")
assert(spec.auditStudioSpecMatch(styleOnly, request).score < 75, "style-only output must fail")
const missingDeleteResult = spec.auditStudioSpecMatch(missingDelete, request)
assert(missingDeleteResult.missingCapabilities.includes("delete"), "missing delete capability must remain visible as missing")
assert(spec.auditStudioSpecMatch("responsive local storage filter organisation", "mobile-friendly localStorage status filtering company").score >= 75, "bounded aliases must match legitimate variants")
console.log("Semantic fidelity audit passed: negation boundaries, bounded aliases, weighted capabilities and fail-closed core coverage")
