import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
const root=process.cwd(); const files=["components/app-studio/advertising-studio.tsx","lib/advertising-workflows.ts"]
for(const file of files)if(!existsSync(join(root,file)))throw new Error(`missing ${file}`)
const source=readFileSync(join(root,files[0]),"utf8")
const checks=[[source.includes('useWorkspaceData<Saved>("advertising_drafts")'),"workspace persistence"],[source.includes("validateAdvertisingBrief")&&source.includes("prepareAdvertisingWorkflow"),"validated workflow"],[source.includes("setItems")&&source.includes("crypto.randomUUID"),"CRUD persistence"],[source.includes('role="alert"')&&source.includes('role="status"'),"accessible status"],[source.includes("Provider approval required")||source.includes("provider approval"),"provider honesty"],[source.includes("en:")&&source.includes("hu:")&&source.includes("de:")&&source.includes("fr:")&&source.includes("es:"),"five locales"],[source.includes("min-w-0")&&source.includes("min-h-11"),"responsive safeguards"]]
for(const [ok,label]of checks)if(!ok)throw new Error(`advertising studio audit failed: ${label}`)
if(source.includes("fetch(")||source.includes("localStorage"))throw new Error("second persistence/provider path detected")
console.log("Advertising Studio audit passed")
