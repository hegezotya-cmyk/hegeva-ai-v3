import { verificationIssues, verifyBrowserPrototype } from "./app-studio-verify"
import { buildPremiumFallbackHtml } from "./app-studio-premium-fallback"
import { applyHardcoreVisualPolish } from "./app-studio-hardcore-polish"
import { buildPawFlowFallbackHtml } from "./app-studio-pawflow-fallback"
import { auditStudioSpecMatch, isPawFlowRequest, requestsGenericBusinessWorkspace } from "./app-studio-spec-match"

export type StudioLocale = "en" | "hu" | "de" | "fr" | "es"
export type X20ActionContext = { startRequestId: string; actionId?: string }
export type AssistantOperationContext = { assistantOperationId: string; appStudioProfile?: "x10" }

function newRequestId() {
  const secureCrypto = globalThis.crypto
  if (secureCrypto?.randomUUID) return secureCrypto.randomUUID()
  if (!secureCrypto?.getRandomValues) throw new Error("Secure browser randomness is unavailable.")
  const bytes = new Uint8Array(16)
  secureCrypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return [...bytes].map((value, index) => `${value.toString(16).padStart(2, "0")}${[3, 5, 7, 9].includes(index) ? "-" : ""}`).join("")
}

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
function isPremiumStudioRequest(message: string) { return /HEGEVA premium app generation engine/i.test(message) }

const X20_WOW_STYLE = `
<style data-hegeva-x20="wow-core">
:root{color-scheme:dark;--hx-bg:#06100c;--hx-line:rgba(82,231,179,.16);--hx-green:#27d99a;--hx-green2:#67edbd;--hx-text:#f3faf7;--hx-muted:#9eb1a9;--hx-shadow:0 24px 70px rgba(0,0,0,.28)}
*{box-sizing:border-box}html{background:var(--hx-bg);scroll-behavior:smooth}body{margin:0!important;min-height:100vh;background:radial-gradient(circle at 82% -10%,rgba(39,217,154,.18),transparent 34%),var(--hx-bg)!important;color:var(--hx-text)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;line-height:1.55!important}
.container,main,.app,.wrapper{width:min(1180px,calc(100% - 32px))!important;max-width:1180px!important;margin:24px auto!important;padding:0!important;position:relative}header,.header,.hero{background:linear-gradient(135deg,rgba(14,36,28,.98),rgba(8,24,18,.98))!important;border:1px solid rgba(39,217,154,.25)!important;border-radius:24px!important;padding:28px!important;box-shadow:var(--hx-shadow)!important}h1,h2,h3,h4{color:var(--hx-text)!important}nav,.nav,nav ul,.nav ul{display:flex!important;gap:9px!important;flex-wrap:wrap!important;list-style:none!important;padding:0!important}nav a,.nav a{padding:8px 13px!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:999px!important;color:#e9f8f2!important;text-decoration:none!important}section,.card,article,.panel,.widget,form{background:linear-gradient(180deg,rgba(17,35,28,.96),rgba(10,24,18,.96))!important;border:1px solid var(--hx-line)!important;border-radius:18px!important;padding:20px!important;margin:16px 0!important;color:var(--hx-text)!important}button,input,select,textarea{font:inherit!important;border-radius:12px!important;min-height:44px!important}input,select,textarea{max-width:100%;padding:10px 12px!important;background:#081711!important;color:var(--hx-text)!important;border:1px solid rgba(255,255,255,.12)!important}button{padding:10px 15px!important;border:0!important;background:linear-gradient(135deg,var(--hx-green),var(--hx-green2))!important;color:#03130c!important;font-weight:800!important;cursor:pointer!important}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.muted{color:var(--hx-muted)!important}:focus-visible{outline:3px solid rgba(103,237,189,.8)!important;outline-offset:3px!important}@media(max-width:760px){.container,main,.app,.wrapper{width:calc(100% - 20px)!important;margin:10px auto!important}header,.header,.hero,section,.card,article,.panel,.widget,form{padding:16px!important}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
</style>`

function isHtmlBuildRequest(message: string) { return /return\s+only[\s\S]{0,80}html/i.test(message) && /(index\.html|html document|html code|self-contained html)/i.test(message) }

function x20FragmentInstruction(message: string, language: StudioLocale) {
  return [
    "HEGEVA Build My App X20 compact application fragment generator.",
    `Visible UI language: ${language}.`,
    "Return ONLY compact semantic HTML markup for inside BODY.",
    "IMPORTANT: start immediately with <main class=\"app\">.",
    "For the working customer/data entry area use EXACTLY ONE of each: <form id=\"hx-form\">, an input id=\"hx-name\", a result container id=\"hx-list\", and a count element id=\"hx-count\">.",
    "The hx-name input must be inside hx-form. The form must contain at least one button for adding the item.",
    "Any extra Add Customer/Add Client action button may only navigate or focus the required hx-name form; do not invent unwired action buttons.",
    "Do not output doctype, html, head, body, style, script, Markdown or explanation.",
    "Do not return plain text. Every visible sentence must be inside HTML elements.",
    "Build an application interface, not a landing page. Keep it under about 1400 characters so it finishes completely.",
    "HEGEVA attaches verified local add/delete behaviour to the required hx-* elements.",
    `APP REQUEST:\n${message.slice(0, 1000)}`,
  ].join("\n\n")
}

function cleanX20Fragment(value: string) {
  let fragment = stripCodeFence(value).trim()
  const bodyMatch = fragment.match(/<body(?:\s[^>]*)?>([\s\S]*?)(?:<\/body>|$)/i)
  if (bodyMatch) fragment = bodyMatch[1].trim()
  fragment = fragment
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<\/?html(?:\s[^>]*)?>/gi, "")
    .replace(/<head(?:\s[^>]*)?>[\s\S]*?<\/head>/gi, "")
    .replace(/<\/?body(?:\s[^>]*)?>/gi, "")
    .replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, "")
    .trim()
  return fragment
}

function countId(fragment: string, id: string) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return (fragment.match(new RegExp(`id=["']${escaped}["']`, "gi")) || []).length
}

function meaningfulFragment(fragment: string) {
  const semantic = fragment.length >= 180 && /<(main|section|article|form)(?:\s|>)/i.test(fragment) && /<(button|input|textarea|select)(?:\s|>)/i.test(fragment)
  const singleContract = ["hx-form", "hx-name", "hx-list", "hx-count"].every((id) => countId(fragment, id) === 1)
  const formMatch = fragment.match(/<form\b[^>]*id=["']hx-form["'][^>]*>([\s\S]*?)<\/form>/i)
  const formBody = formMatch?.[1] || ""
  const wiredForm = /id=["']hx-name["']/i.test(formBody) && /<button\b/i.test(formBody)
  return semantic && singleContract && wiredForm
}

const X20_COPY: Record<StudioLocale, { title: string; sub: string; dash: string; customers: string; docs: string; tasks: string; name: string; add: string; empty: string }> = {
  en: { title: "Business dashboard", sub: "Manage your essential business data in one place.", dash: "Overview", customers: "Customers", docs: "Documents", tasks: "Tasks", name: "Name", add: "Add", empty: "No saved data yet." },
  hu: { title: "Üzleti irányítópult", sub: "Kezeld a legfontosabb üzleti adatokat egy helyen.", dash: "Áttekintés", customers: "Ügyfelek", docs: "Dokumentumok", tasks: "Feladatok", name: "Név", add: "Hozzáadás", empty: "Még nincs mentett adat." },
  de: { title: "Geschäftsübersicht", sub: "Verwalte deine wichtigsten Geschäftsdaten an einem Ort.", dash: "Übersicht", customers: "Kunden", docs: "Dokumente", tasks: "Aufgaben", name: "Name", add: "Hinzufügen", empty: "Noch keine Daten gespeichert." },
  fr: { title: "Tableau de bord", sub: "Gérez vos données professionnelles essentielles au même endroit.", dash: "Aperçu", customers: "Clients", docs: "Documents", tasks: "Tâches", name: "Nom", add: "Ajouter", empty: "Aucune donnée enregistrée." },
  es: { title: "Panel de negocio", sub: "Gestiona los datos esenciales de tu negocio en un solo lugar.", dash: "Resumen", customers: "Clientes", docs: "Documentos", tasks: "Tareas", name: "Nombre", add: "Añadir", empty: "Todavía no hay datos guardados." },
}

function fallbackX20Fragment(language: StudioLocale) {
  const t = X20_COPY[language] || X20_COPY.en
  return `<main class="app"><header><h1>${t.title}</h1><p class="muted">${t.sub}</p></header><nav aria-label="Primary"><a href="#overview">${t.dash}</a><a href="#customers">${t.customers}</a><a href="#documents">${t.docs}</a><a href="#tasks">${t.tasks}</a></nav><section id="overview"><h2>${t.dash}</h2><div class="grid"><article class="card"><h3>${t.customers}</h3><strong id="hx-count" aria-live="polite">0</strong></article><article class="card"><h3>${t.docs}</h3><strong>0</strong></article><article class="card"><h3>${t.tasks}</h3><strong>0</strong></article></div></section><section id="customers"><h2>${t.customers}</h2><form id="hx-form"><label for="hx-name">${t.name}</label><br><input id="hx-name" required autocomplete="off"> <button type="submit">${t.add}</button></form><div id="hx-list" class="card" aria-live="polite">${t.empty}</div></section></main>`
}

const X20_SAFE_SCRIPT = `<script data-hegeva-x20="safe-interactions">(()=>{const k='hegeva-x20-items',f=document.getElementById('hx-form'),i=document.getElementById('hx-name'),l=document.getElementById('hx-list'),c=document.getElementById('hx-count'),lang=document.documentElement.lang,copy={en:{empty:'No saved data yet.',del:'Delete'},hu:{empty:'Még nincs mentett adat.',del:'Törlés'},de:{empty:'Noch keine Daten gespeichert.',del:'Löschen'},fr:{empty:'Aucune donnée enregistrée.',del:'Supprimer'},es:{empty:'Todavía no hay datos guardados.',del:'Eliminar'}},t=copy[lang]||copy.en;if(!f||!i||!l||!c)return;let memory=[];const esc=x=>String(x).replace(/[&<>]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[s])),readName=()=>{try{const p='hegeva-x20:';if(!window.name.startsWith(p))return[];const v=JSON.parse(window.name.slice(p.length));return Array.isArray(v)?v:[]}catch{return[]}},writeName=a=>{try{window.name='hegeva-x20:'+JSON.stringify(a)}catch{}},read=()=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');if(Array.isArray(v)){memory=v.slice();writeName(v);return v.slice()}}catch{}const named=readName();if(named.length||window.name.startsWith('hegeva-x20:')){memory=named.slice();return named.slice()}return memory.slice()},write=a=>{memory=a.slice();writeName(a);try{localStorage.setItem(k,JSON.stringify(a))}catch{}},draw=()=>{const a=read();c.textContent=String(a.length);l.innerHTML=a.length?a.map((x,n)=>'<p>'+esc(x)+' <button type="button" data-del="'+n+'" aria-label="'+t.del+'">×</button></p>').join(''):t.empty},add=()=>{const v=i.value.trim();if(!v){i.focus();return}const a=read();a.push(v);write(a);i.value='';draw();i.focus()};f.addEventListener('submit',e=>{e.preventDefault();add()});f.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b||!f.contains(b))return;e.preventDefault();add()});l.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('[data-del]'):null;if(!b)return;e.preventDefault();const a=read();const n=Number(b.getAttribute('data-del'));if(!Number.isInteger(n)||n<0||n>=a.length)return;a.splice(n,1);write(a);draw()});document.querySelectorAll('button').forEach(b=>{if(b.closest('#hx-form')||b.hasAttribute('data-del'))return;const txt=(b.textContent||'').trim().toLowerCase();if(/add customer|add client|new customer|new client|ügyfél hozzáadás|új ügyfél|kunde hinzufügen|neuer kunde|ajouter un client|nouveau client|añadir cliente|nuevo cliente/.test(txt))b.addEventListener('click',e=>{e.preventDefault();f.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>i.focus(),180)})});draw()})()</script>`

function wrapX20Fragment(fragment: string, language: StudioLocale) {
  const safeLang = ["en", "hu", "de", "fr", "es"].includes(language) ? language : "en"
  return `<!doctype html>\n<html lang="${safeLang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>HEGEVA X20 App</title>\n${X20_WOW_STYLE}\n</head>\n<body>\n${fragment}\n${X20_SAFE_SCRIPT}\n</body>\n</html>`
}

async function buildCompactX20(message: string, language: StudioLocale, action?: X20ActionContext) {
  let fragment = cleanX20Fragment(await requestStudioAI(x20FragmentInstruction(message, language), language, action))
  if (!meaningfulFragment(fragment)) fragment = fallbackX20Fragment(language)
  return closeSafeHtmlStructure(wrapX20Fragment(fragment, language))
}

function withPremiumEditContract(message: string) {
  if (!isPremiumStudioRequest(message)) return message
  if (!/edit\s*\/\s*delete flows|add\s*\/\s*edit\s*\/\s*delete flows|create\s*\/\s*edit\s*\/\s*delete flows/i.test(message)) return message
  const contract = [
    "HEGEVA STRUCTURAL CRUD CONTRACT — IMPLEMENT THIS IN THE FIRST GENERATION, NOT AS A LATER REPAIR.",
    "At least one core saved-record module MUST support complete Add → Edit → Save changes → Delete behaviour.",
    "Render a visible Edit control on each saved record using a record-bound attribute such as data-edit=\"record-id\".",
    "Wire a real JavaScript edit handler (for example dataset.edit / closest('[data-edit]')) that loads the selected record's current values into editable fields.",
    "When Save changes is submitted, locate the SAME existing record by id/index using findIndex or equivalent, mutate/replace that record instead of appending a duplicate, call localStorage.setItem with the updated collection, then re-render immediately.",
    "The edited value MUST still be present after reload. Delete must keep working after an edit.",
    "Do not satisfy Edit with a label, comment, dead button, unused function, or a second Create action.",
    "Mentally test this exact flow before returning HTML: create record → edit record → save → reload → edited value remains → delete record.",
  ].join("\n")
  return `${contract}\n\n${message}`
}

async function requestStudioAI(message: string, language: StudioLocale, action?: X20ActionContext, assistantOperationId?: string, appStudioProfile?: "x10") {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30000)
  const safeMessage = fitStudioMessage(withPremiumEditContract(message))
  try {
    const metadata = action
      ? { actionKind: "x20", startRequestId: action.startRequestId, ...(action.actionId ? { actionId: action.actionId } : {}), attemptRequestId: newRequestId() }
      : { assistantOperationId: assistantOperationId || newRequestId(), ...(appStudioProfile === "x10" ? { appStudioProfile } : {}) }
    const response = await fetch("/api/chat", { method: "POST", credentials: "include", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: safeMessage, history: [], language, mode: "general", ...metadata }) })
    const data = await response.json().catch(() => null)
    if (action && typeof data?.actionId === "string") action.actionId = data.actionId
    if (!response.ok) throw new Error(typeof data?.error === "string" && data.error.trim() ? data.error.trim() : "HEGEVA AI is temporarily unavailable.")
    const answer = typeof data?.response === "string" ? data.response.trim() : ""
    if (!answer) throw new Error("HEGEVA AI returned an empty response.")
    return answer
  } catch (error) {
    if (controller.signal.aborted) throw new Error("HEGEVA AI took too long to respond. Please try again.")
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

function tryHardcorePolish(html: string, message: string) {
  if (!isPremiumStudioRequest(message)) return html
  const polished = closeSafeHtmlStructure(applyHardcoreVisualPolish(html))
  return verifyBrowserPrototype(polished).ok ? polished : html
}

function passesRequestFidelity(html: string, message: string) {
  const match = auditStudioSpecMatch(html, fidelityRequest(message))
  return !match.severeMismatch && match.score >= 80
}

function studioFailureCode(html: string, message: string, verification: ReturnType<typeof verifyBrowserPrototype>) {
  if (!verifyBrowserPrototype(html).checks.find((check) => check.key === "document")?.ok || !verification.checks.find((check) => check.key === "structure")?.ok) return "incomplete_output"
  if (!verification.checks.find((check) => check.key === "javascript")?.ok) return "invalid_javascript"
  if (!passesRequestFidelity(html, message)) return "request_mismatch"
  if (!verification.checks.find((check) => check.key === "trust")?.ok) return "unsafe_output"
  return "invalid_document"
}

function fidelityRequest(message: string) {
  const parts = message.split(/(?:CUSTOMER APP REQUEST|APP IDEA|APP REQUEST|ORIGINAL CUSTOMER REQUEST):\s*/i)
  return (parts.at(-1) || message).trim()
}

function verifiedDomainFallback(message: string, language: StudioLocale) {
  if (isPawFlowRequest(message)) return buildPawFlowFallbackHtml(message)
  if (requestsGenericBusinessWorkspace(message)) return buildPremiumFallbackHtml(message, language)
  return ""
}

export async function runStudioAI(message: string, language: StudioLocale, action?: X20ActionContext, assistantContext?: AssistantOperationContext) {
  const x20 = Boolean(action) || isX20Request(message)
  const htmlRequest = isHtmlBuildRequest(message)
  const x20Action = x20 ? (action || { startRequestId: newRequestId() }) : undefined
  const assistantOperationId = x20 ? undefined : (assistantContext?.assistantOperationId || newRequestId())
  if (x20 && htmlRequest) {
    let html = await buildCompactX20(message, language, x20Action)
    let verification = verifyBrowserPrototype(html)
    if (!verification.ok || !passesRequestFidelity(html, message)) {
      const fallback = verifiedDomainFallback(fidelityRequest(message), language)
      if (!fallback) throw new Error("HEGEVA refused an unrelated generic fallback for this specific app request. Please retry.")
      html = closeSafeHtmlStructure(fallback)
      verification = verifyBrowserPrototype(html)
    }
    if (!verification.ok || !passesRequestFidelity(html, message)) throw new Error(`HEGEVA X20 request-fidelity build failed: ${verificationIssues(verification).join("; ")}`)
    return html
  }

  const firstAnswer = await requestStudioAI(message, language, x20Action, assistantOperationId, assistantContext?.appStudioProfile)
  if (!htmlRequest) return firstAnswer
  let html = closeSafeHtmlStructure(stripCodeFence(firstAnswer))
  let verification = verifyBrowserPrototype(html)
  if (!verification.ok || !passesRequestFidelity(html, message)) {
    throw new Error(`HEGEVA could not verify this App Studio build (${studioFailureCode(html, message, verification)}). Start a new build when you are ready to retry.`)
  }
  if (!verification.ok || !passesRequestFidelity(html, message)) throw new Error(`HEGEVA request-fidelity verification failed after recovery: ${verificationIssues(verification).join("; ")}`)
  return tryHardcorePolish(html, message)
}

export function stripCodeFence(value: string) {
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i)
  return (fenced?.[1] || trimmed).trim()
}

export function looksLikeHtmlDocument(value: string) {
  return verifyBrowserPrototype(closeSafeHtmlStructure(value)).ok
}

export type VerifiedHtmlResult = { html: string; attempts: number; autoRepaired: boolean }

export async function runVerifiedStudioHtml(instruction: string, language: StudioLocale): Promise<VerifiedHtmlResult> {
  const html = closeSafeHtmlStructure(stripCodeFence(await runStudioAI(instruction, language)))
  const verification = verifyBrowserPrototype(html)
  if (!verification.ok) throw new Error(`HEGEVA verification failed: ${verificationIssues(verification).join("; ")}`)
  return { html, attempts: 1, autoRepaired: false }
}

export function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
