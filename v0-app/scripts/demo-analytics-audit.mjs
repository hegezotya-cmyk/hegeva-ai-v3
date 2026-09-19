import fs from "node:fs"
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8")
const attribution=read("components/acquisition/acquisition-attribution.tsx")
const consent=read("components/analytics-consent.tsx")
const demo=read("components/demo-workspace.tsx")
const home=read("app/page.tsx")
const auth=read("components/auth/auth-panel.tsx")
const expect=(condition,message)=>{if(!condition)throw new Error(message)}
for(const event of ["demo_entry_click","demo_workspace_view","demo_business_switch","demo_signup_click"]){expect(attribution.includes(event)||demo.includes(event)||home.includes(event),`${event} missing`);expect(consent.includes(event),`${event} missing from consent allowlist`)}
expect(home.includes('data-demo-analytics="entry"'),"homepage demo entry hook missing")
expect(demo.includes("demo_workspace_view")&&demo.includes("demo_business_switch")&&demo.includes("demo_signup_click"),"demo event dispatch missing")
expect(attribution.includes("hegeva:demo-registration:v1"),"demo registration carryover missing")
expect(auth.includes("registration_start"),"registration_start missing at actual registration action")
expect(consent.includes("detail.params")&&consent.includes("analytics_storage"),"consent-aware event parameters missing")
expect(!demo.includes("window.gtag"),"demo must not call gtag directly")
console.log("Demo analytics audit passed")
