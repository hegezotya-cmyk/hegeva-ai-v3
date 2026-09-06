const PROVIDERS = Object.freeze({
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    mail: "https://gmail.googleapis.com/gmail/v1/users/me/messages",
    calendar: "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    scopes: ["openid", "email", "https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/calendar.readonly"],
    clientId: "GOOGLE_OAUTH_CLIENT_ID", clientSecret: "GOOGLE_OAUTH_CLIENT_SECRET"
  },
  microsoft: {
    auth: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    mail: "https://graph.microsoft.com/v1.0/me/mailFolders/inbox",
    calendar: "https://graph.microsoft.com/v1.0/me/calendarView",
    scopes: ["openid", "email", "offline_access", "Mail.Read", "Calendars.Read"],
    clientId: "MICROSOFT_OAUTH_CLIENT_ID", clientSecret: "MICROSOFT_OAUTH_CLIENT_SECRET"
  }
});
const enc = new TextEncoder(), dec = new TextDecoder();
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const random = size => b64url(crypto.getRandomValues(new Uint8Array(size)));
async function sha256(value){return new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(value)))}
async function hex(value){return [...await sha256(value)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function encryptionKey(env){
  const raw=String(env.OAUTH_TOKEN_ENCRYPTION_KEY||"");
  let bytes;try{bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0))}catch{return null}
  return bytes.length===32?crypto.subtle.importKey("raw",bytes,{name:"AES-GCM"},false,["encrypt","decrypt"]):null;
}
async function seal(env,value){const key=await encryptionKey(env);if(!key)throw new Error("oauth-encryption-unavailable");const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(value)));return `${b64url(iv)}.${b64url(cipher)}`}
function redirectUri(env){return `${String(env.PUBLIC_APP_URL||"").replace(/\/$/,"")}/api/integrations/oauth/callback`}
function configured(env,p){return Boolean(env[p.clientId]&&env[p.clientSecret]&&env.OAUTH_TOKEN_ENCRYPTION_KEY&&env.PUBLIC_APP_URL)}
export function integrationCapabilities(env){return Object.entries(PROVIDERS).map(([provider,p])=>({provider,configured:configured(env,p),access:"read-only",scopes:p.scopes}))}
export async function listConnections(db,env,userId){
  const rows=await db.prepare("SELECT provider,scopes,expiresAt,createdAt,updatedAt FROM integration_connections WHERE userId=?1 ORDER BY provider").bind(userId).all();
  const connected=new Map((rows.results||[]).map(x=>[x.provider,x]));
  return integrationCapabilities(env).map(x=>({...x,connected:connected.has(x.provider),connection:connected.get(x.provider)||null}));
}
export async function startOAuth(db,env,userId,provider){
  const p=PROVIDERS[provider];if(!p)return{status:400,error:"Unsupported integration provider."};
  if(!configured(env,p))return{status:503,error:"This integration is not configured yet."};
  const state=random(32),verifier=random(48),challenge=b64url(await sha256(verifier)),now=new Date(),expires=new Date(now.getTime()+10*60*1000);
  await db.prepare("DELETE FROM integration_oauth_states WHERE expiresAt<=?1 OR (userId=?2 AND provider=?3)").bind(now.toISOString(),userId,provider).run();
  await db.prepare("INSERT INTO integration_oauth_states(stateHash,userId,provider,encryptedVerifier,expiresAt,createdAt) VALUES(?1,?2,?3,?4,?5,?6)").bind(await hex(state),userId,provider,await seal(env,verifier),expires.toISOString(),now.toISOString()).run();
  const q=new URLSearchParams({client_id:String(env[p.clientId]),redirect_uri:redirectUri(env),response_type:"code",scope:p.scopes.join(" "),state,code_challenge:challenge,code_challenge_method:"S256",access_type:"offline",prompt:"consent"});
  return{status:200,data:{url:`${p.auth}?${q}`}};
}
function unb64url(value){const normalized=value.replaceAll("-","+").replaceAll("_","/");return Uint8Array.from(atob(normalized+"=".repeat((4-normalized.length%4)%4)),c=>c.charCodeAt(0))}
async function open(env,value){const key=await encryptionKey(env);if(!key)throw new Error("oauth-encryption-unavailable");const[iv,cipher]=value.split(".");return dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64url(iv)},key,unb64url(cipher)))}
export async function completeOAuth(db,env,userId,{state,code}){
  if(!/^[A-Za-z0-9_-]{40,80}$/.test(state||"")||!code)return{status:400,error:"Invalid OAuth callback."};
  const stateHash=await hex(state),row=await db.prepare("SELECT userId,provider,encryptedVerifier,expiresAt FROM integration_oauth_states WHERE stateHash=?1 LIMIT 1").bind(stateHash).first();
  if(!row||row.userId!==userId||Date.parse(row.expiresAt)<=Date.now())return{status:400,error:"OAuth state is invalid or expired."};
  await db.prepare("DELETE FROM integration_oauth_states WHERE stateHash=?1").bind(stateHash).run();
  const p=PROVIDERS[row.provider];if(!p||!configured(env,p))return{status:503,error:"This integration is not configured."};
  const verifier=await open(env,row.encryptedVerifier),body=new URLSearchParams({client_id:String(env[p.clientId]),client_secret:String(env[p.clientSecret]),code,code_verifier:verifier,grant_type:"authorization_code",redirect_uri:redirectUri(env)});
  const response=await fetch(p.token,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},body,signal:AbortSignal.timeout(10000)});
  if(!response.ok)return{status:502,error:"Provider token exchange failed."};
  const token=await response.json();if(typeof token.access_token!=="string")return{status:502,error:"Provider returned an invalid token response."};
  const now=new Date().toISOString(),expiresAt=Number(token.expires_in)>0?new Date(Date.now()+Number(token.expires_in)*1000).toISOString():null,scopes=typeof token.scope==="string"?token.scope:p.scopes.join(" ");
  await db.prepare("INSERT INTO integration_connections(id,userId,provider,encryptedAccessToken,encryptedRefreshToken,scopes,expiresAt,createdAt,updatedAt) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?8) ON CONFLICT(userId,provider) DO UPDATE SET encryptedAccessToken=excluded.encryptedAccessToken,encryptedRefreshToken=COALESCE(excluded.encryptedRefreshToken,integration_connections.encryptedRefreshToken),scopes=excluded.scopes,expiresAt=excluded.expiresAt,updatedAt=excluded.updatedAt").bind(crypto.randomUUID(),userId,row.provider,await seal(env,token.access_token),typeof token.refresh_token==="string"?await seal(env,token.refresh_token):null,scopes,expiresAt,now).run();
  return{status:200,data:{connected:true,provider:row.provider}};
}
export async function disconnectIntegration(db,userId,provider){if(!PROVIDERS[provider])return{status:400,error:"Unsupported integration provider."};const result=await db.prepare("DELETE FROM integration_connections WHERE userId=?1 AND provider=?2").bind(userId,provider).run();return{status:200,data:{disconnected:Number(result.meta?.changes||0)>0}}}

async function refreshAccessToken(db,env,userId,row,p){
  if(!row.encryptedRefreshToken)throw new Error("oauth-refresh-unavailable");
  const body=new URLSearchParams({client_id:String(env[p.clientId]),client_secret:String(env[p.clientSecret]),refresh_token:await open(env,row.encryptedRefreshToken),grant_type:"refresh_token"});
  const response=await fetch(p.token,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},body,signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error("oauth-refresh-failed");
  const token=await response.json();if(typeof token.access_token!=="string")throw new Error("oauth-refresh-invalid");
  const now=new Date().toISOString(),expiresAt=Number(token.expires_in)>0?new Date(Date.now()+Number(token.expires_in)*1000).toISOString():null;
  await db.prepare("UPDATE integration_connections SET encryptedAccessToken=?1,encryptedRefreshToken=COALESCE(?2,encryptedRefreshToken),expiresAt=?3,updatedAt=?4 WHERE userId=?5 AND provider=?6").bind(await seal(env,token.access_token),typeof token.refresh_token==="string"?await seal(env,token.refresh_token):null,expiresAt,now,userId,row.provider).run();
  return token.access_token;
}
async function accessToken(db,env,userId,row,p){
  if(row.expiresAt&&Date.parse(row.expiresAt)<=Date.now()+60_000)return refreshAccessToken(db,env,userId,row,p);
  return open(env,row.encryptedAccessToken);
}
async function providerSignal(db,env,userId,row,now){
  const p=PROVIDERS[row.provider];if(!p)return null;
  try{
    const token=await accessToken(db,env,userId,row,p),end=new Date(now.getTime()+7*24*60*60*1000);
    const mailUrl=row.provider==="google"?`${p.mail}?maxResults=1&q=${encodeURIComponent("is:unread in:inbox newer_than:7d")}`:`${p.mail}?$select=unreadItemCount`;
    const calendarUrl=row.provider==="google"?`${p.calendar}?timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&singleEvents=true&maxResults=10&orderBy=startTime&fields=items(id),nextPageToken`:`${p.calendar}?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=10&$select=id`;
    const headers={Authorization:`Bearer ${token}`,Accept:"application/json"};
    const[mailResponse,calendarResponse]=await Promise.all([fetch(mailUrl,{headers,signal:AbortSignal.timeout(8000)}),fetch(calendarUrl,{headers,signal:AbortSignal.timeout(8000)})]);
    if(!mailResponse.ok||!calendarResponse.ok)throw new Error("provider-signal-failed");
    const[mail,calendar]=await Promise.all([mailResponse.json(),calendarResponse.json()]);
    const unread=row.provider==="google"?Math.max(0,Number(mail.resultSizeEstimate)||0):Math.max(0,Number(mail.unreadItemCount)||0);
    const events=row.provider==="google"?(Array.isArray(calendar.items)?calendar.items:[]):(Array.isArray(calendar.value)?calendar.value:[]);
    const capped=events.length>=10&&Boolean(row.provider==="google"?calendar.nextPageToken:calendar["@odata.nextLink"]);
    return{provider:row.provider,available:true,access:"read-only",unreadInbox:unread,upcomingSevenDays:events.length,upcomingCapped:capped,checkedAt:now.toISOString()};
  }catch{return{provider:row.provider,available:false,access:"read-only",unreadInbox:null,upcomingSevenDays:null,upcomingCapped:false,checkedAt:now.toISOString()}}
}
export async function readIntegrationSignals(db,env,userId){
  const rows=await db.prepare("SELECT provider,encryptedAccessToken,encryptedRefreshToken,expiresAt FROM integration_connections WHERE userId=?1 ORDER BY provider").bind(userId).all();
  const now=new Date(),signals=await Promise.all((rows.results||[]).map(row=>providerSignal(db,env,userId,row,now)));
  return{signals:signals.filter(Boolean),window:{calendarDays:7,mail:"unread inbox from the last 7 days"},contentStored:false,externalActions:false};
}
