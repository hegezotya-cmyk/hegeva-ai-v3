import { verificationIssues, verifyBrowserPrototype } from "./app-studio-verify"

export type StudioLocale = "en" | "hu" | "de" | "fr" | "es"

const STUDIO_MESSAGE_LIMIT = 2400

function fitStudioMessage(message: string) {
  const value = message.trim()
  if (value.length <= STUDIO_MESSAGE_LIMIT) return value
  const marker = "\n\n[HEGEVA trimmed oversized context]\n\n"
  const headLength = 1700
  const tailLength = STUDIO_MESSAGE_LIMIT - headLength - marker.length
  return `${value.slice(0, headLength)}${marker}${value.slice(-tailLength)}`
}

function closeSafeHtmlStructure(value: string) {
  let html = value.trim()
  const hasHeadOpen = /<head(?:\s|>)/i.test(html)
  const hasBodyOpen = /<body(?:\s|>)/i.test(html)
  const hasHtmlOpen = /<html(?:\s|>)/i.test(html)
  if (hasHeadOpen && !/<\/head>/i.test(html) && hasBodyOpen) html = html.replace(/<body(?:\s|>)/i, (m) => `</head>\n${m}`)
  if (hasBodyOpen && !/<\/body>/i.test(html)) html = /<\/html>/i.test(html) ? html.replace(/<\/html>/i, "</body>\n</html>") : `${html}\n</body>`
  if (hasHtmlOpen && !/<\/html>/i.test(html)) html = `${html}\n</html>`
  return html.trim()
}

function isX20Request(message: string) { return /HEGEVA Build My App X20/i.test(message) }

const X20_WOW_STYLE = `
<style data-hegeva-x20="wow-core">
:root{color-scheme:dark;--hx-bg:#06100c;--hx-line:rgba(82,231,179,.16);--hx-green:#27d99a;--hx-green2:#67edbd;--hx-text:#f3faf7;--hx-muted:#9eb1a9;--hx-shadow:0 24px 70px rgba(0,0,0,.28)}
*{box-sizing:border-box}html{background:var(--hx-bg);scroll-behavior:smooth}body{margin:0!important;min-height:100vh;background:radial-gradient(circle at 82% -10%,rgba(39,217,154,.18),transparent 34%),var(--hx-bg)!important;color:var(--hx-text)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;line-height:1.55!important}
.container,main,.app,.wrapper{width:min(1180px,calc(100% - 32px))!important;max-width:1180px!important;margin:24px auto!important;padding:0!important;position:relative}header,.header,.hero{background:linear-gradient(135deg,rgba(14,36,28,.98),rgba(8,24,18,.98))!important;border:1px solid rgba(39,217,154,.25)!important;border-radius:24px!important;padding:28px!important;box-shadow:var(--hx-shadow)!important}h1,h2,h3,h4{color:var(--hx-text)!important}nav,.nav,nav ul,.nav ul{display:flex!important;gap:9px!important;flex-wrap:wrap!important;list-style:none!important;padding:0!important}nav a,.nav a{padding:8px 13px!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:999px!important;color:#e9f8f2!important;text-decoration:none!important}section,.card,article,.panel,.widget,form{background:linear-gradient(180deg,rgba(17,35,28,.96),rgba(10,24,18,.96))!important;border:1px solid var(--hx-line)!important;border-radius:18px!important;padding:20px!important;margin:16px 0!important;color:var(--hx-text)!important}button,input,select,textarea{font:inherit!important;border-radius:12px!important;min-height:44px!important}input,select,textarea{max-width:100%;padding:10px 12px!important;background:#081711!important;color:var(--hx-text)!important;border:1px solid rgba(255,255,255,.12)!important}button{padding:10px 15px!important;border:0!important;background:linear-gradient(135deg,var(--hx-green),var(--hx-green2))!important;color:#03130c!important;font-weight:800!important;cursor:pointer!important}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.muted{color:var(--hx-muted)!important}:focus-visible{outline:3px solid rgba(103,237,189,.8)!important;outline-offset:3px!important}@media(max-width:760px){.container,main,.app,.wrapper{width:calc(100% - 20px)!important;margin:10px auto!important}header,.header,.hero,section,.card,article,.panel,.widget,form{padding:16px!important}}
</style>`

function isHtmlBuildRequest(message: string) { return /return\s+only[\s\S]{0,80}html/i.test(message) && /(index\.html|html document|html code|self-contained html)/i.test(message) }

function x20FragmentInstruction(message: string, language: StudioLocale) {
  return ["HEGEVA Build My App X20 compact application fragment generator.",`Visible UI language: ${language}.`,"Return ONLY compact semantic HTML markup for inside BODY.","IMPORTANT: start immediately with <main class=\"app\">.","For the working customer/data entry area you MUST use exactly: <form id=\"hx-form\">, an input id=\"hx-name\", a result container id=\"hx-list\", and a count element id=\"hx-count\".","Include at least one <section>, the required form, input and submit button.","Do not output doctype, html, head, body, style, script, Markdown or explanation.","Do not return plain text. Every visible sentence must be inside HTML elements.","Build an application interface, not a landing page. Keep it under about 1400 characters so it finishes completely.","HEGEVA attaches verified localStorage add/delete behaviour to the required hx-* elements.",`APP REQUEST:\n${message.slice(0, 1000)}`].join("\n\n")
}

function cleanX20Fragment(value: string) {
  let fragment = stripCodeFence(value).trim()
  const bodyMatch = fragment.match(/<body(?:\s[^>]*)?>([\s\S]*?)(?:<\/body>|$)/i)
  if (bodyMatch) fragment = bodyMatch[1].trim()
  fragment = fragment.replace(/<!doctype[^>]*>/gi, "").replace(/<\/?html(?:\s[^>]*)?>/gi, "").replace(/<head(?:\s[^>]*)?>[\s\S]*?<\/head>/gi, "").replace(/<\/?body(?:\s[^>]*)?>/gi, "").replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, "").trim()
  return fragment
}

function meaningfulFragment(fragment: string) {
  const semantic = fragment.length >= 180 && /<(main|section|article|form)(?:\s|>)/i.test(fragment) && /<(button|input|textarea|select)(?:\s|>)/i.test(fragment)
  const wiredContract = /id=["']hx-form["']/i.test(fragment) && /id=["']hx-name["']/i.test(fragment) && /id=["']hx-list["']/i.test(fragment) && /id=["']hx-count["']/i.test(fragment)
  return semantic && wiredContract
}

function fallbackX20Fragment(language: StudioLocale) {
  const t = language === "hu" ? {title:"Üzleti irányítópult",sub:"Kezeld a legfontosabb üzleti adatokat egy helyen.",dash:"Áttekintés",customers:"Ügyfelek",docs:"Dokumentumok",tasks:"Feladatok",name:"Név",add:"Hozzáadás",empty:"Még nincs mentett adat."} : {title:"Business dashboard",sub:"Manage your essential business data in one place.",dash:"Overview",customers:"Customers",docs:"Documents",tasks:"Tasks",name:"Name",add:"Add",empty:"No saved data yet."}
  return `<main class="app"><header><h1>${t.title}</h1><p class="muted">${t.sub}</p></header><nav><a href="#overview">${t.dash}</a><a href="#customers">${t.customers}</a><a href="#documents">${t.docs}</a><a href="#tasks">${t.tasks}</a></nav><section id="overview"><h2>${t.dash}</h2><div class="grid"><article class="card"><h3>${t.customers}</h3><strong id="hx-count">0</strong></article><article class="card"><h3>${t.docs}</h3><strong>0</strong></article><article class="card"><h3>${t.tasks}</h3><strong>0</strong></article></div></section><section id="customers"><h2>${t.customers}</h2><form id="hx-form"><label>${t.name}<br><input id="hx-name" required></label> <button type="submit">${t.add}</button></form><div id="hx-list" class="card">${t.empty}</div></section></main>`
}

const X20_SAFE_SCRIPT = `<script data-hegeva-x20="safe-interactions">(()=>{const k='hegeva-x20-items',f=document.getElementById('hx-form'),i=document.getElementById('hx-name'),l=document.getElementById('hx-list'),c=document.getElementById('hx-count'),lang=document.documentElement.lang,empty=lang==='hu'?'Még nincs mentett adat.':'No saved data yet.';if(!f||!i||!l)return;const esc=x=>String(x).replace(/[&<>]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[s])),read=()=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch{return[]}},draw=()=>{const a=read();if(c)c.textContent=String(a.length);l.innerHTML=a.length?a.map((x,n)=>'<p>'+esc(x)+' <button type="button" data-del="'+n+'">×</button></p>').join(''):empty};f.addEventListener('submit',e=>{e.preventDefault();const v=i.value.trim();if(!v)return;const a=read();a.push(v);localStorage.setItem(k,JSON.stringify(a));i.value='';draw()});l.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('[data-del]'):null;if(!b)return;const a=read();a.splice(Number(b.dataset.del),1);localStorage.setItem(k,JSON.stringify(a));draw()});draw()})()</script>`

function wrapX20Fragment(fragment: string, language: StudioLocale) {
  const safeLang = ["en","hu","de","fr","es"].includes(language) ? language : "en"
  return `<!doctype html>\n<html lang="${safeLang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>HEGEVA X20 App</title>\n${X20_WOW_STYLE}\n</head>\n<body>\n${fragment}\n${X20_SAFE_SCRIPT}\n</body>\n</html>`
}

async function buildCompactX20(message: string, language: StudioLocale) {
  let fragment = cleanX20Fragment(await requestStudioAI(x20FragmentInstruction(message, language), language))
  if (!meaningfulFragment(fragment)) fragment = fallbackX20Fragment(language)
  return closeSafeHtmlStructure(wrapX20Fragment(fragment, language))
}

async function requestStudioAI(message: string, language: StudioLocale) {
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 30000); const safeMessage = fitStudioMessage(message)
  try { const response = await fetch("/api/chat",{method:"POST",credentials:"include",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({message:safeMessage,history:[],language,mode:"general"})}); const data=await response.json().catch(()=>null); if(!response.ok) throw new Error(typeof data?.error==="string"&&data.error.trim()?data.error.trim():"HEGEVA AI is temporarily unavailable."); const answer=typeof data?.response==="string"?data.response.trim():""; if(!answer) throw new Error("HEGEVA AI returned an empty response."); return answer } catch(error){if(controller.signal.aborted) throw new Error("HEGEVA AI took too long to respond. Please try again."); throw error} finally {window.clearTimeout(timeout)}
}

async function repairHtml(html:string, originalMessage:string, language:StudioLocale, compact=false){const verification=verifyBrowserPrototype(html),issues=verificationIssues(verification);const instruction=[compact?"HEGEVA emergency compact repair.":"HEGEVA App Studio verification repair.",`Visible UI language: ${language}.`,"Return ONLY one complete compact self-contained HTML document.","Include meaningful application markup and real local button/form interaction. Inline JavaScript must parse. No external assets or fake external-service success.",`FAILED CHECKS: ${issues.join("; ")}`,`ORIGINAL TASK: ${originalMessage.slice(0,700)}`].join("\n\n");return closeSafeHtmlStructure(stripCodeFence(await requestStudioAI(instruction,language)))}

export async function runStudioAI(message:string, language:StudioLocale){const x20=isX20Request(message),htmlRequest=isHtmlBuildRequest(message);if(x20&&htmlRequest){let html=await buildCompactX20(message,language);let verification=verifyBrowserPrototype(html);if(!verification.ok){html=closeSafeHtmlStructure(wrapX20Fragment(fallbackX20Fragment(language),language));verification=verifyBrowserPrototype(html)}if(!verification.ok)throw new Error(`HEGEVA X20 compact build failed: ${verificationIssues(verification).join("; ")}`);return html}const firstAnswer=await requestStudioAI(message,language);if(!htmlRequest)return firstAnswer;let html=closeSafeHtmlStructure(stripCodeFence(firstAnswer));let verification=verifyBrowserPrototype(html);if(!verification.ok){html=await repairHtml(html,message,language,false);verification=verifyBrowserPrototype(html)}if(!verification.ok){html=await repairHtml(html,message,language,true);verification=verifyBrowserPrototype(html)}if(!verification.ok)throw new Error(`HEGEVA verification failed after recovery: ${verificationIssues(verification).join("; ")}`);return html}

export function stripCodeFence(value:string){const trimmed=value.trim();const fenced=trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);return(fenced?.[1]||trimmed).trim()}
export function looksLikeHtmlDocument(value:string){return verifyBrowserPrototype(closeSafeHtmlStructure(value)).ok}
export type VerifiedHtmlResult={html:string;attempts:number;autoRepaired:boolean}
export async function runVerifiedStudioHtml(instruction:string,language:StudioLocale):Promise<VerifiedHtmlResult>{const html=closeSafeHtmlStructure(stripCodeFence(await runStudioAI(instruction,language)));const verification=verifyBrowserPrototype(html);if(!verification.ok)throw new Error(`HEGEVA verification failed: ${verificationIssues(verification).join("; ")}`);return{html,attempts:1,autoRepaired:false}}
export function downloadTextFile(filename:string,content:string,type="text/plain;charset=utf-8"){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),anchor=document.createElement("a");anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url)}
