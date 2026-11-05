import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("./stripe-staging-historical-auto-proof.mjs",import.meta.url),"utf8");
for(const gate of ["historical-reference-not-found","historical-reference-ambiguous","historical-tuple-incomplete","APPROVE-HISTORICAL-TEST","pagination-incomplete","livemode===false"]){assert.match(source,new RegExp(gate.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));}
console.log("Automatic historical identity proof safety gates PASS (static, no network or secrets).");
