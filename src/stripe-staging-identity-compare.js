// Local-only, read-only comparison of two already-acquired private snapshots.
// Input records (including IDs) must stay in the trusted local process.
// Never publish raw identifiers, per-user hashes, or complete snapshots.
const ACTIVE = new Set(["active","trialing","past_due"]);
const clean = (v,p) => typeof v==="string" && v.startsWith(p) && v.length>p.length ? v : null;

export function compareStripeTestAndStagingD1({d1Identities,stripeSubscriptions,stripeComplete,d1UserIds}={}) {
  const blocked = reason=>({verified:false,status:"BLOCKED",reason});
  if (stripeComplete!==true || !Array.isArray(d1Identities) ||
      !Array.isArray(stripeSubscriptions)) return blocked("incomplete-snapshot");
  if (d1UserIds!==undefined && (!Array.isArray(d1UserIds) ||
      d1UserIds.some(id=>typeof id!=="string" || id.length===0)))
    return blocked("invalid-d1-user-record");
  const users=new Map(), subs=new Set(), customerOwners=new Map();
  for(const row of stripeSubscriptions){
    const user=clean(row?.userId,"") || null;
    const sub=clean(row?.id,"sub_"), cust=clean(row?.customerId,"cus_");
    if(!user || !sub || !cust || typeof row.status!=="string" ||
       row.livemode!==false || subs.has(sub)) return blocked("invalid-stripe-record");
    subs.add(sub);
    if(customerOwners.has(cust) && customerOwners.get(cust)!==user)
      return blocked("cross-user-customer");
    customerOwners.set(cust,user);
    if(!users.has(user))users.set(user,[]);
    users.get(user).push(row);
  }
  const storedUsers=new Set(), rows=[];
  for(const row of d1Identities){
    const user=clean(row?.userId,"");
    const cust=clean(row?.stripeCustomerId,"cus_");
    const sub=clean(row?.stripeSubscriptionId,"sub_");
    if(!user || !cust || !sub || storedUsers.has(user))
      return blocked("invalid-d1-record");
    storedUsers.add(user);
    rows.push({user,cust,sub,status:String(row.subscriptionStatus||"").toLowerCase()});
  }
  let matched=0, unmatched=0, mismatch=0, extraActive=0;
  for(const row of rows){
    const mapped=users.get(row.user)||[];
    const found=mapped.find(s=>s.id===row.sub && s.customerId===row.cust);
    if(!found){unmatched++;continue;}
    matched++;
    if(String(found.status).toLowerCase()!==row.status)mismatch++;
  }
  for(const [user,records] of users){
    const represented=rows.find(r=>r.user===user);
    for(const s of records){
      if(ACTIVE.has(String(s.status).toLowerCase()) &&
         (!represented || represented.sub!==s.id || represented.cust!==s.customerId))
        extraActive++;
    }
  }
  const active=stripeSubscriptions.filter(s=>ACTIVE.has(s.status.toLowerCase()));
  const multiCustomerUsers=[...users.values()].filter(records=>
    new Set(records.filter(s=>ACTIVE.has(s.status.toLowerCase())).map(s=>s.customerId)).size>1).length;
  const orphanStatusCounts={};
  const knownStatuses=new Set(["active","trialing","past_due","canceled","incomplete","incomplete_expired","unpaid","paused"]);
  for(const [user,records] of users){
    if(storedUsers.has(user)) continue;
    for(const s of records){
      const status=String(s.status).toLowerCase();
      const label=knownStatuses.has(status)?status:"other";
      orphanStatusCounts[label]=(orphanStatusCounts[label]||0)+1;
    }
  }
  const consistent=unmatched===0 && mismatch===0 && extraActive===0 &&
    storedUsers.size===users.size;
  return {
    verified:true,status:consistent?"PASS":"REVIEW_REQUIRED",
    counts:{
      d1IdentityRows:rows.length,stripeSubscriptions:stripeSubscriptions.length,
      stripeActiveSubscriptions:active.length,mappedStripeUsers:users.size,
      matchedStoredIdentities:matched,unmatchedStoredIdentities:unmatched,
      matchingIdentityStatusDisagreements:mismatch,
      unrepresentedActiveSubscriptions:extraActive,
      multiCustomerActiveUsers:multiCustomerUsers,
      stripeUsersWithoutD1Identity:[...users.keys()].filter(u=>!storedUsers.has(u)).length,
      unrepresentedStripeSubscriptionStatuses:orphanStatusCounts,
      unrepresentedStripeUsersWithD1AuthRecord:Array.isArray(d1UserIds)
        ? [...users.keys()].filter(user=>!storedUsers.has(user) && d1UserIds.includes(user)).length
        : null,
      unrepresentedStripeUsersWithoutD1AuthRecord:Array.isArray(d1UserIds)
        ? [...users.keys()].filter(user=>!storedUsers.has(user) && !d1UserIds.includes(user)).length
        : null,
    },
    releaseSafe:consistent && multiCustomerUsers===0,
  };
}
