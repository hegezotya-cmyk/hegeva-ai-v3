import assert from "node:assert/strict"
import fs from "node:fs"
import { loadTypeScriptModule } from "./x20-test-loader.mjs"

const verifier = loadTypeScriptModule(new URL("../lib/app-studio-verify.ts", import.meta.url))
const spec = loadTypeScriptModule(new URL("../lib/app-studio-spec-match.ts", import.meta.url))
const x10Source = fs.readFileSync(new URL("../components/app-studio/build-my-app-x10-tuned.tsx", import.meta.url), "utf8")
const aiSource = fs.readFileSync(new URL("../lib/app-studio-ai.ts", import.meta.url), "utf8")
const request = "Create a simple customer follow-up tracker with customer name, company, follow-up date, New/In Progress/Completed status, local CRUD, search, filtering, mobile layout, premium dark HEGEVA styling, explicit demo-data labelling, no PawFlow/pet content, and no cloud-sync claim."
const complete = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Customer Follow-up Tracker</title><style>body{font-family:system-ui;background:#07100d;color:#f3faf7;margin:0;padding:24px}main{max-width:900px;margin:auto}form{display:grid;gap:10px}input,select,button{min-height:44px;padding:8px}table{width:100%}@media(max-width:700px){table{display:block;overflow:auto}}</style></head><body><main><h1>Customer Follow-up Tracker</h1><p>Demo data only · stored locally in this browser · no cloud sync.</p><form id="followup-form"><label for="customer">Customer name</label><input id="customer" required><label for="company">Company</label><input id="company"><label for="date">Follow-up date</label><input id="date" type="date"><label for="status">Status</label><select id="status"><option>New</option><option>In Progress</option><option>Completed</option></select><button type="submit">Add follow-up</button></form><label for="search">Search</label><input id="search"><select id="filter"><option>All</option><option>New</option><option>In Progress</option><option>Completed</option></select><ul id="list" aria-live="polite"></ul><script>const key='followups-local-demo';let rows=JSON.parse(localStorage.getItem(key)||'[]');const form=document.getElementById('followup-form'),list=document.getElementById('list'),search=document.getElementById('search'),filter=document.getElementById('filter');function draw(){const q=search.value.toLowerCase(),f=filter.value;list.innerHTML=rows.filter(r=>(f==='All'||r.status===f)&&((r.customer+' '+r.company).toLowerCase().includes(q))).map((r,i)=>'<li>'+r.customer+' · '+r.company+' · '+r.date+' · '+r.status+' <button type="button" data-delete="'+i+'">Delete</button></li>').join('')||'<li>No follow-ups yet.</li>'}form.addEventListener('submit',e=>{e.preventDefault();rows.push({customer:customer.value,company:company.value,date:date.value,status:status.value});localStorage.setItem(key,JSON.stringify(rows));form.reset();draw()});search.addEventListener('input',draw);filter.addEventListener('change',draw);list.addEventListener('click',e=>{if(e.target.dataset.delete){rows.splice(Number(e.target.dataset.delete),1);localStorage.setItem(key,JSON.stringify(rows));draw()}});draw();</script></main></body></html>`
const truncated = complete.slice(0, -120)
const malformed = complete.replace("draw();</script>", "draw(; </script>")
const markdown = `Here is your app:\n\`\`\`html\n${complete}\n\`\`\``
const generic = complete.replace(/Customer Follow-up Tracker/g, "HEGEVA Business OS").replace(/customer|company|follow-up|status/gi, "invoice")
const unsafe = complete.replace("Demo data only", "Payment successful")

const check = (html) => verifier.verifyBrowserPrototype(html)
assert.equal(check(complete).ok, true, "complete tracker fixture must pass technical verification")
assert.equal(check(truncated).ok, false, "truncated output must fail")
assert.equal(check(truncated).checks.find((item) => item.key === "structure")?.ok, false)
assert.equal(check(malformed).checks.find((item) => item.key === "javascript")?.ok, false)
assert.equal(check(markdown).checks.find((item) => item.key === "no-markdown")?.ok, false)
assert.equal(spec.auditStudioSpecMatch(generic, request).severeMismatch, true, "generic output must fail request fidelity")
assert.equal(spec.isPawFlowRequest("Create a tracker. Do not use PawFlow or pet grooming content."), false, "negative PawFlow wording is not positive intent")
assert.equal(check(unsafe).checks.find((item) => item.key === "trust")?.ok, false, "fake payment success must fail trust verification")
assert(/appStudioProfile === "x10"/.test(aiSource), "X10 profile must be explicitly allowlisted")
assert(/selectAiOutputTokens\(\{ isX20Action, appStudioProfile: isX10StudioProfile \? body\.appStudioProfile : undefined \}\)/.test(fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")), "backend budget split must remain scoped")
assert(/setHtml\(bestHtml\)/.test(x10Source) && /verifyGeneratedHtml\(bestHtml\)/.test(x10Source), "X10 must validate before rendering")
for (const code of ["incomplete_output", "invalid_javascript", "request_mismatch", "unsafe_output", "invalid_document"]) assert(aiSource.includes(code), `missing failure code ${code}`)
console.log("X10 first-pass quality audit passed: realistic tracker, truncation, syntax, Markdown, fidelity, PawFlow exclusion and unsafe-output gates")
