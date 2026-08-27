import assert from "node:assert/strict"
import fs from "node:fs"
const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8")
const overview=read("components/command-center/workspace-overview.tsx")
const command=read("components/command-center/view.tsx")
assert(overview.includes("createOperatingCenterSnapshot"),"Operating Center UI must use the verified runtime")
assert(overview.includes("MetricCard"),"workspace values must use semantic metric surfaces")
for(const source of ["customers","documents","expenses","planner","invoice_documents"]) assert(overview.includes(`\"${source}\"`),`missing real workspace source ${source}`)
for(const locale of ["en","hu","de","fr","es"]) assert(overview.includes(`${locale}:{`),`Operating Center UI missing ${locale} copy`)
assert(!/99\.9|98%|1,247|128,540|35 automations|productivity score/i.test(overview+command),"fabricated metrics are prohibited")
assert(command.includes("<WorkspaceOverview"),"current v1 Command Center must retain the integrated workspace surface")
console.log("Operating Center UI audit passed: verified runtime, real workspace sources, semantic metrics, localized readiness state and no fabricated values")
