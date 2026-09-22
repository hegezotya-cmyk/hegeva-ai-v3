import assert from "node:assert/strict";
import { deriveBusinessScoreShare, normalizeShareExpiry, BUSINESS_SCORE_METHODOLOGY } from "../../src/business-score-share.js";
const base={type:"invoice",status:"open",dueDate:"2026-09-01",items:[{quantity:1,unitPrice:100}]};const quote={type:"quote",status:"open",dueDate:"2026-09-01"};const customer={followUp:"2026-09-01"};const task={due:"2026-09-01",done:false};
for(const input of [{invoices:[base,quote],customers:[],tasks:[]},{invoices:[base],customers:[customer],tasks:[]},{invoices:[base],customers:[],tasks:[task]},{invoices:[quote],customers:[customer],tasks:[]},{invoices:[quote],customers:[],tasks:[task]},{invoices:[],customers:[customer],tasks:[task]}]){const r=deriveBusinessScoreShare(input);assert.equal(r.state,"ready");assert.ok(r.scoreBand)}
assert.equal(deriveBusinessScoreShare({invoices:[base],customers:[],tasks:[]}).state,"incomplete");
const now=Date.parse("2026-09-22T12:00:00Z");assert.equal(normalizeShareExpiry(null,now),"2026-09-23T12:00:00.000Z");assert.equal(normalizeShareExpiry("2030-01-01T00:00:00Z",now),"2026-09-29T12:00:00.000Z");
assert.equal(BUSINESS_SCORE_METHODOLOGY,"business-score-v1");
const source=await import("node:fs").then(fs=>fs.readFileSync(new URL("../../src/business-score-share.js",import.meta.url),"utf8"));for(const forbidden of ["customerName","workspaceId","prompt","response"])assert.equal(source.includes(forbidden),false,`forbidden field ${forbidden}`);
console.log("business score phase 2 audit: PASS");
