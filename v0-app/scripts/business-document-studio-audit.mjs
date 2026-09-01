import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
const root=path.resolve(new URL("..",import.meta.url).pathname)
const read=f=>fs.readFileSync(path.join(root,f),"utf8")
for(const route of ["contracts","receipts","tax-summaries"]) assert(fs.existsSync(path.join(root,"app/business",route,"page.tsx")),`${route} route missing`)
const ui=read("components/business/document-studio.tsx")
for(const token of ["useWorkspaceData","setItems","duplicate","remove","print","disclaimer","role=\"status\""]) assert(ui.includes(token),`missing ${token}`)
for(const locale of ["en","hu","de","fr","es"]) assert(ui.includes(`${locale}:{`),`missing locale ${locale}`)
for(const key of ["parties","paymentTerms","sellerCustomer","receiptNumber","lineItems","taxCategories","period"]) assert(ui.includes(`\"${key}\"`),`missing canonical field key ${key}`)
assert(ui.includes("FIELD_KEYS"),"document fields must use stable keys rather than translated labels")
assert(ui.includes("keys[index]"),"localized labels must map to stable persisted field keys")
assert(!ui.includes("fetch("),"must reuse workspace persistence")
console.log("Business document studio audit passed")
