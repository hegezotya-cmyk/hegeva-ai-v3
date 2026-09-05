const PROVIDERS = Object.freeze({
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/calendar.readonly"],
    clientId: "GOOGLE_OAUTH_CLIENT_ID", clientSecret: "GOOGLE_OAUTH_CLIENT_SECRET"
  },
  microsoft: {
    auth: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
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
