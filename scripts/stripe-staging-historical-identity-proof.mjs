// Local-only historical TEST identity proof.
// Stripe GET only. No D1/Stripe writes. Raw tuple values never leave memory.
import { readFileSync } from "node:fs";

const EXPECTED_ACCOUNT = "acct_1U4YkEHECF9iDE3l";
const config = readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8");
const key = process.env.STRIPE_TEST_READONLY_KEY?.trim() || "";
const approval = process.env.HEGEVA_HISTORICAL_APPROVAL === "APPROVE-HISTORICAL-TEST";
const expected = {
  accountId: process.env.HEGEVA_HISTORICAL_ACCOUNT_ID?.trim() || "",
  subscriptionId: process.env.HEGEVA_HISTORICAL_SUBSCRIPTION_ID?.trim() || "",
  customerId: process.env.HEGEVA_HISTORICAL_CUSTOMER_ID?.trim() || "",
  userId: process.env.HEGEVA_HISTORICAL_USER_ID?.trim() || "",
  createdAt: process.env.HEGEVA_HISTORICAL_CREATED_AT?.trim() || "",
};

const mask = (value, prefix = "") => {
  if (typeof value !== "string" || (prefix && !value.startsWith(prefix)) || value.length < prefix.length + 8) return null;
  const tail = value.slice(prefix.length);
  return `${prefix}${tail.slice(0, 4)}…${tail.slice(-4)}`;
};
const maskOpaque = value => typeof value === "string" && value.length >= 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : null;
const fail = reason => { console.log(JSON.stringify({verified:false,status:"BLOCKED",reason,exactMatch:false,accountVerified:false,testModeVerified:false,approvalVerified:approval,paginationComplete:false})); process.exitCode = 2; };

if (!/"PAYMENT_MODE"\s*:\s*"test"/.test(config)) fail("staging-not-test-mode");
else if (!/^rk_test_/.test(key)) fail("stripe-test-restricted-key-unavailable");
else if (!approval) fail("historical-approval-missing");
else if (!Object.values(expected).every(Boolean)) fail("historical-tuple-incomplete");
else {
  try {
    const get = async path => {
      let response;
      try { response = await fetch(`https://api.stripe.com/v1/${path}`, { method:"GET", headers:{Authorization:`Bearer ${key}`,Accept:"application/json"}, cache:"no-store", signal:AbortSignal.timeout(30000) }); }
      catch { throw new Error("stripe-read-network"); }
      if (!response.ok) { const e = new Error(response.status === 403 ? "stripe-read-403" : "stripe-read-failed"); e.httpStatus=response.status; throw e; }
      try { return await response.json(); } catch { throw new Error("stripe-response-invalid"); }
    };
    const account = await get("account").catch(error => { if (error.message === "stripe-read-403") return null; throw error; });
    const prices = [...config.matchAll(/"(STRIPE_[A-Z_]+PRICE_ID)"\s*:\s*"(price_[^"]+)"/g)].map(([,name,id]) => ({name,id}));
    const priceResults = [];
    for (const price of prices) {
      const row = await get(`prices/${encodeURIComponent(price.id)}`);
      priceResults.push(row?.id === price.id && row?.livemode === false);
    }
    const accountVerified = account?.id === EXPECTED_ACCOUNT || (account === null && priceResults.length === 5 && priceResults.every(Boolean));
    const testModeVerified = account?.livemode === false || (account === null && priceResults.length === 5 && priceResults.every(Boolean));
    if (!accountVerified || !testModeVerified) { fail("account-identity-unverified"); process.exit(2); }
    const rows=[]; let cursor=null; let paginationComplete=false;
    for (let page=0; page<20; page+=1) {
      const query=new URLSearchParams({status:"all",limit:"100"}); if(cursor) query.set("starting_after",cursor);
      const result=await get(`subscriptions?${query}`);
      if(!Array.isArray(result?.data)||typeof result.has_more!=="boolean"||result.data.length>100) { fail("pagination-incomplete"); process.exit(2); }
      rows.push(...result.data);
      if(!result.has_more){paginationComplete=true;break;}
      const next=result.data.at(-1)?.id; if(!next||next===cursor){ fail("pagination-incomplete"); process.exit(2); } cursor=next;
    }
    if(!paginationComplete){ fail("pagination-incomplete"); process.exit(2); }
    const record=rows.find(row=>row?.id===expected.subscriptionId);
    const exactMatch=Boolean(record && record.livemode===false && record.id===expected.subscriptionId && record.customer===expected.customerId && record.metadata?.userId===expected.userId && new Date(Number(record.created)*1000).toISOString()===expected.createdAt && expected.accountId===EXPECTED_ACCOUNT && ["active","trialing","past_due"].includes(String(record.status||"").toLowerCase()));
    console.log(JSON.stringify({verified:true,status:exactMatch?"PASS":"BLOCKED",exactMatch,accountVerified,testModeVerified,approvalVerified:true,paginationComplete,maskedRecord:record?{subscription:mask(record.id,"sub_"),customer:mask(record.customer,"cus_"),user:maskOpaque(record.metadata?.userId),createdAt:new Date(Number(record.created)*1000).toISOString(),status:record.status,metadataUserIdPresent:Boolean(record.metadata?.userId)}:null}));
    if(!exactMatch)process.exitCode=2;
  } catch(error) { fail(error?.message?.startsWith("stripe-")?error.message:"identity-proof-failed"); }
}
