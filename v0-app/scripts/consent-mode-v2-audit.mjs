import fs from "node:fs"
const layout=fs.readFileSync(new URL("../app/layout.tsx",import.meta.url),"utf8")
const consent=fs.readFileSync(new URL("../components/analytics-consent.tsx",import.meta.url),"utf8")
const expect=(condition,message)=>{if(!condition)throw new Error(message)}
expect(layout.includes("ConsentModeBootstrap"),"early consent bootstrap missing from root layout")
for(const token of ['analytics_storage: "denied"','ad_storage: "denied"','ad_user_data: "denied"','ad_personalization: "denied"'])expect(layout.includes(token),`early default missing ${token}`)
expect(layout.indexOf("ConsentModeBootstrap")<layout.indexOf("<body"),"consent bootstrap must execute in head before body analytics")
expect(consent.includes('analytics_storage: "granted"'),"analytics accepted update missing")
for(const token of ['ad_storage: "denied"','ad_user_data: "denied"','ad_personalization: "denied"'])expect(consent.includes(token),`accepted/reject state must preserve ${token}`)
expect(consent.includes('if (consent !== "granted"'),"optional events must remain consent gated")
expect(consent.includes("__hegevaAnalyticsConfigured"),"duplicate gtag config guard missing")
expect((consent.match(/id = "hegeva-google-analytics"/g)||[]).length===1,"single Google tag lifecycle required")
console.log("Consent Mode V2 audit passed")
