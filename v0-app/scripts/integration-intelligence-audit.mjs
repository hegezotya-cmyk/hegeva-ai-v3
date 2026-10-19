import assert from "node:assert/strict"
import fs from "node:fs"
import { buildIntegrationFindings } from "../../src/integrations.js"
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8")
const worker=read("../src/integrations.js"),entry=read("../src/index.js"),ui=read("components/command-center/external-intelligence-layer.tsx"),view=read("components/command-center/view.tsx")
for(const token of ["readIntegrationIntelligence","customer-email-attention","overdue-customer-contact","meeting-quote-followup","opportunity-conversation","workspaceEvidenceIds","externalEvidenceIds"])assert(worker.includes(token),`Missing intelligence contract: ${token}`)
for(const token of ["format=metadata","metadataHeaders=From","isRead eq false","organizer","attendees","maxResults=10","$top=20"])assert(worker.includes(token),`Missing bounded provider evidence: ${token}`)
assert(!/bodyPreview|payload\.body|format=full|sendMail|sendEmail|Calendars\.ReadWrite|Mail\.ReadWrite/.test(worker),"Intelligence layer must not read message bodies or request/perform writes")
assert(worker.includes('contentStored:false')&&worker.includes('externalActions:false')&&worker.includes('access:"read-only"'),"Read-only privacy boundary must be explicit")
assert(entry.includes('/api/integrations/intelligence')&&entry.includes('"Cache-Control":"private, no-store"'),"Authenticated private endpoint missing")
assert(ui.includes('en:')&&ui.includes('hu:')&&ui.includes('de:')&&ui.includes('fr:')&&ui.includes('es:'),"Five-locale UI missing")
assert(ui.includes('integration-intelligence:${finding.id}')&&ui.includes('tasks.some(task=>task.sourceId===source(finding))'),"Planner preparation must be duplicate-safe")
assert(ui.includes('credentials:"include"')&&ui.includes('Owner approval remains required'),"Owner-controlled live UI missing")
assert(view.includes("<ExternalIntelligenceLayer />"),"Command Center integration missing")
const findings=buildIntegrationFindings("google",{messages:[{id:"mail-1",threadId:"thread-1",email:"buyer@example.com",at:"2026-09-06T09:00:00Z"}],events:[{id:"event-1",at:"2026-09-07T10:00:00Z",emails:["buyer@example.com"]}]},{customers:[{id:"customer-1",title:"Buyer Ltd",meta:"buyer@example.com",customerStatus:"lead"}],documents:[{id:"invoice-1",type:"invoice",status:"sent",dueDate:"2026-09-01",clientName:"Buyer Ltd",clientDetails:"buyer@example.com"},{id:"quote-1",type:"quote",status:"sent",dueDate:"2026-09-10",clientName:"Buyer Ltd",clientDetails:"buyer@example.com"}],goals:[]},"2026-09-06")
assert.deepEqual(findings.map(x=>x.kind),["customer-email-attention","overdue-customer-contact","meeting-quote-followup","opportunity-conversation"],"Real cross-source relationships must produce the four supported findings")
assert.equal(buildIntegrationFindings("google",{messages:[],events:[]},{customers:[],documents:[{id:"no-date",type:"invoice",status:"sent"}],goals:[]},"2026-09-06").length,0,"Missing due dates must never become overdue evidence")
console.log("Google/Microsoft Intelligence Layer audit passed: bounded read-only metadata, real workspace matching, evidence-backed findings, duplicate-safe Planner preparation, five locales and no external actions")
