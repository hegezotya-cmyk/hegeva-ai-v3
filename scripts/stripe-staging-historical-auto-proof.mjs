// Automatic local-only historical TEST identity proof.
// Stripe GET only; no D1/Stripe writes. Full IDs never leave memory.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const EXPECTED_ACCOUNT = "acct_1U4YkEHECF9iDE3l";
const REFERENCE = {
  subscriptionMask: "sub_1UDB…21gr",
  customerMask: "cus_VLE3…4xHA",
  createdAt: "2026-09-02T02:50:39.000Z",
};
const config = readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8");
const key = process.env.STRIPE_TEST_READONLY_KEY?.trim() || "";
const mask = (value, prefix) => typeof value === "string" && value.startsWith(prefix) && value.length > prefix.length + 7 ? `${prefix}${value.slice(prefix.length, prefix.length + 4)}…${value.slice(-4)}` : null;
const maskOpaque = value => typeof value === "string" && value.length >= 8 ? `${value.slice(0,4)}…${value.slice(-4)}` : null;
const fail = reason => { console.log(JSON.stringify({verified:false,status:"BLOCKED",reason,exactMatch:false,accountVerified:false,testModeVerified:false,approvalVerified:false,paginationComplete:false})); process.exitCode=2; };

if (!/^rk_test_/.test(key)) fail("stripe-test-restricted-key-unavailable");
else if (!/"PAYMENT_MODE"\s*:\s*"test"/.test(config)) fail("staging-not-test-mode");
else {
  try {
    const get = async path => {
      let response;
      try { response = await fetch(`https://api.stripe.com/v1/${path}`, {method:"GET",headers:{Authorization:`Bearer ${key}`,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(30000)}); }
      catch { throw new Error("stripe-read-network"); }
      if (!response.ok) { const e=new Error(response.status===403?"stripe-read-403":"stripe-read-failed"); e.httpStatus=response.status; throw e; }
      try { return await response.json(); } catch { throw new Error("stripe-response-invalid"); }
    };
    let account=null;
    try { account=await get("account"); } catch(error) { if(error.message!=="stripe-read-403")throw error; }
    const prices=[...config.matchAll(/"(STRIPE_[A-Z_]+PRICE_ID)"\s*:\s*"(price_[^"]+)"/g)].map(([,name,id])=>({name,id}));
    const priceResults=[];
    for(const price of prices){const row=await get(`prices/${encodeURIComponent(price.id)}`);priceResults.push(row?.id===price.id&&row?.livemode===false);}
    const accountVerified=account?.id===EXPECTED_ACCOUNT || (account===null&&priceResults.length===5&&priceResults.every(Boolean));
    const testModeVerified=account?.livemode===false || (account===null&&priceResults.length===5&&priceResults.every(Boolean));
    if(!accountVerified||!testModeVerified){fail("account-identity-unverified");process.exit(2);}
    const inventory=[];let cursor=null;let paginationComplete=false;
    for(let page=0;page<20;page+=1){const q=new URLSearchParams({status:"all",limit:"100"});if(cursor)q.set("starting_after",cursor);const result=await get(`subscriptions?${q}`);if(!Array.isArray(result?.data)||typeof result.has_more!=="boolean"||result.data.length>100){fail("pagination-incomplete");process.exit(2);}inventory.push(...result.data);if(!result.has_more){paginationComplete=true;break;}const next=result.data.at(-1)?.id;if(!next||next===cursor){fail("pagination-incomplete");process.exit(2);}cursor=next;}
    if(!paginationComplete){fail("pagination-incomplete");process.exit(2);}
    const candidates=inventory.filter(row=>row?.livemode===false&&row?.status&&["active","trialing","past_due"].includes(String(row.status).toLowerCase())&&mask(row.id,"sub_")===REFERENCE.subscriptionMask&&mask(row.customer,"cus_")===REFERENCE.customerMask&&new Date(Number(row.created)*1000).toISOString()===REFERENCE.createdAt);
    if(candidates.length!==1){console.log(JSON.stringify({verified:true,status:"BLOCKED",reason:candidates.length===0?"historical-reference-not-found":"historical-reference-ambiguous",exactMatch:false,accountVerified,testModeVerified,approvalVerified:false,paginationComplete,candidateCount:candidates.length}));process.exitCode=2;}
    else {
      const row=candidates[0];
      const complete=typeof row.metadata?.userId==="string"&&row.metadata.userId.length>0&&row.id.startsWith("sub_")&&row.customer?.startsWith("cus_");
      if(!complete){fail("historical-tuple-incomplete");process.exit(2);}
      const rl=createInterface({input:process.stdin,output:process.stdout});
      const answer=(await rl.question(`Historical TEST record ${mask(row.id,"sub_")} / ${mask(row.customer,"cus_")} / ${REFERENCE.createdAt}. Type APPROVE-HISTORICAL-TEST to attest locally: `)).trim();
      rl.close();
      const approvalVerified=answer==="APPROVE-HISTORICAL-TEST";
      const exactMatch=approvalVerified&&account?.id===EXPECTED_ACCOUNT?row.metadata.userId.length>0:approvalVerified&&account===null?row.metadata.userId.length>0:false;
      console.log(JSON.stringify({verified:true,status:exactMatch?"PASS":"BLOCKED",reason:exactMatch?null:"historical-approval-not-confirmed",exactMatch,accountVerified,testModeVerified,approvalVerified,paginationComplete,maskedRecord:{subscription:mask(row.id,"sub_"),customer:mask(row.customer,"cus_"),user:maskOpaque(row.metadata.userId),createdAt:new Date(Number(row.created)*1000).toISOString(),status:row.status,metadataUserIdPresent:true}}));
      if(!exactMatch)process.exitCode=2;
    }
  } catch(error){fail(error?.message?.startsWith("stripe-")?error.message:"historical-identity-proof-failed");}
}
