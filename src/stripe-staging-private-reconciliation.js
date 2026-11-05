// Local-only orchestrator. No raw IDs or credentials are returned to callers.
// Readers are injected so CI can validate behavior using synthetic fixtures.
import { compareStripeTestAndStagingD1 } from "./stripe-staging-identity-compare.js";

export async function reconcilePrivateStagingIdentity({
  readD1, readStripePage, maxPages=20,
}={}) {
  const blocked=reason=>({verified:false,status:"BLOCKED",reason});
  if(typeof readD1!=="function" || typeof readStripePage!=="function" ||
     !Number.isInteger(maxPages) || maxPages<1 || maxPages>20)
    return blocked("invalid-readers");
  let identities;
  try {identities=await readD1();}
  catch{return blocked("staging-read-unavailable");}
  if(!Array.isArray(identities)) return blocked("staging-response-incomplete");
  let cursor=null;
  const seen=new Set(),all=[];
  for(let i=0;i<maxPages;i++){
    let page;
    try{page=await readStripePage(cursor);}
    catch{return blocked("stripe-read-unavailable");}
    if(!page || !Array.isArray(page.data) ||
       typeof page.has_more!=="boolean" || page.data.length>100 ||
       (page.has_more && page.data.length===0))
      return blocked("stripe-response-incomplete");
    for(const item of page.data){
      if(typeof item?.id!=="string" || seen.has(item.id))
        return blocked("duplicate-or-invalid-subscription");
      seen.add(item.id);
      if(item.livemode!==false) return blocked("live-mode-subscription");
      if(!item?.metadata?.userId || !item?.customer || !item?.status)
        return blocked("unmapped-subscription");
      all.push({id:item.id,customerId:item.customer,
        userId:item.metadata.userId,status:item.status,livemode:false});
    }
    if(!page.has_more) {
      return compareStripeTestAndStagingD1({
        d1Identities:identities,stripeSubscriptions:all,stripeComplete:true,
      });
    }
    const last=page.data.at(-1)?.id;
    if(!last || last===cursor) return blocked("invalid-pagination");
    cursor=last;
  }
  return blocked("pagination-limit");
}
