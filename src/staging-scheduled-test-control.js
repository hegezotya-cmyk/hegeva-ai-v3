// Offline staging test-control contract. NEVER imported by Worker entrypoints.
// Runtime integration remains disabled; adapters and fixtures are tested separately.
const scenarios = new Set(["retry-recovery","lease-fencing"]);
const states = new Set(["completed","retry-scheduled","blocked","lease-lost"]);
const result=(status,code,cleanupVerified=false)=>({status,code,cleanupVerified});
function tokenEqual(a,b) {
  if(typeof a!=="string"||typeof b!=="string"||a.length<32||b.length<32)return false;
  const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);
  let difference=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)difference|=(x[i]??0)^(y[i]??0);
  return difference===0;
}
export function createStagingScheduledTestController({
 adapter,isStagingBuild=false,enabled=false,paymentMode="",authorizationSecret="",
 now=()=>Date.now(),generateNonce=()=>crypto.randomUUID(),maxDurationMs=15000
}={}){
 if(!Number.isInteger(maxDurationMs)||maxDurationMs<1000||maxDurationMs>30000)throw Error("invalid-timeout");
 return async request=>{
   if(isStagingBuild!==true||enabled!==true||paymentMode!=="test")return result("denied","disabled");
   if(!tokenEqual(request?.authorization,authorizationSecret))return result("denied","unauthorized");
   const keys=request&&typeof request==="object"&&!Array.isArray(request)?Object.keys(request).sort():[];
   if(keys.join(",")!=="authorization,scenario"||!scenarios.has(request.scenario))return result("denied","invalid-request");
   if(!adapter||!["acquire","release","runSynthetic","cleanup","verifyCleanup"].every(k=>typeof adapter[k]==="function"))
     return result("blocked","adapter-unavailable");
   const nonce=generateNonce();
   if(typeof nonce!=="string"||!/^[0-9a-f-]{32,36}$/i.test(nonce))return result("blocked","nonce-invalid");
   const scenario=request.scenario,started=now();
   let acquired=false,verified=false,status="blocked",code="test-not-run";
   try{
     // Adapter contract: atomic durable single-flight, rate-limit and replay rejection.
     acquired=await adapter.acquire({scenario,nonce,deadline:started+maxDurationMs})===true;
     if(!acquired)return result("blocked","single-flight-or-rate-limited");
     const execution=await adapter.runSynthetic({scenario,nonce,deadline:started+maxDurationMs});
     if(now()-started>maxDurationMs)code="deadline-exceeded";
     else if(execution&&states.has(execution.status)){status=execution.status;code="scenario-executed";}
     else code="scenario-invalid-result";
   }catch{code="scenario-exception";}
   finally{
     if(acquired){
       try{await adapter.cleanup({scenario,nonce});verified=await adapter.verifyCleanup({scenario,nonce})===true;}
       catch{verified=false;}
       try{await adapter.release({scenario,nonce});}catch{verified=false;}
     }
   }
   return verified?result(status,code,true):result("blocked","cleanup-unverified");
 };
}
