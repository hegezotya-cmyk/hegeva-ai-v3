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

  if (hasHeadOpen && !/<\/head>/i.test(html) && hasBodyOpen) {
    html = html.replace(/<body(?:\s|>)/i, (match) => `</head>\n${match}`)
  }

  if (hasBodyOpen && !/<\/body>/i.test(html)) {
    if (/<\/html>/i.test(html)) {
      html = html.replace(/<\/html>/i, "</body>\n</html>")
    } else {
      html = `${html}\n</body>`
    }
  }

  if (hasHtmlOpen && !/<\/html>/i.test(html)) {
    html = `${html}\n</html>`
  }

  return html.trim()
}

function isX20Request(message: string) {
  return /HEGEVA Build My App X20/i.test(message)
}

const X20_WOW_STYLE = `
<style data-hegeva-x20="wow-core">
:root{color-scheme:dark;--hx-bg:#06100c;--hx-panel:#0d1b16;--hx-panel2:#11231c;--hx-line:rgba(82,231,179,.16);--hx-green:#27d99a;--hx-green2:#67edbd;--hx-text:#f3faf7;--hx-muted:#9eb1a9;--hx-gold:#e8b84b;--hx-danger:#ff6b6b;--hx-shadow:0 24px 70px rgba(0,0,0,.28)}
*{box-sizing:border-box}html{background:var(--hx-bg);scroll-behavior:smooth}body{margin:0!important;min-height:100vh;background:radial-gradient(circle at 82% -10%,rgba(39,217,154,.18),transparent 34%),radial-gradient(circle at 0% 100%,rgba(25,100,77,.16),transparent 34%),var(--hx-bg)!important;color:var(--hx-text)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;line-height:1.55!important}
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.22;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:42px 42px}
.container,main,.app,.wrapper{width:min(1180px,calc(100% - 32px))!important;max-width:1180px!important;margin:24px auto!important;padding:0!important;position:relative}
header,.header,.hero{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(14,36,28,.98),rgba(8,24,18,.98))!important;border:1px solid rgba(39,217,154,.25)!important;border-radius:24px!important;padding:28px!important;box-shadow:var(--hx-shadow)!important;color:var(--hx-text)!important}
header::after,.header::after,.hero::after{content:"";position:absolute;width:240px;height:240px;border-radius:50%;right:-90px;top:-120px;background:rgba(39,217,154,.12);filter:blur(2px);pointer-events:none}
h1,h2,h3,h4{color:var(--hx-text)!important;letter-spacing:-.035em!important;margin-top:.25em}h1{font-size:clamp(2rem,5vw,3.35rem)!important;line-height:1.05!important}h2{font-size:clamp(1.35rem,3vw,2rem)!important}p,li,label{color:inherit}small,.muted,.subtitle,.description{color:var(--hx-muted)!important}
nav,.nav,nav ul,.nav ul{display:flex!important;align-items:center!important;gap:9px!important;flex-wrap:wrap!important;list-style:none!important;margin:14px 0!important;padding:0!important;background:transparent!important}nav li,.nav li{margin:0!important;padding:0!important}nav a,.nav a{display:inline-flex!important;align-items:center!important;min-height:40px!important;padding:8px 13px!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:999px!important;background:rgba(255,255,255,.04)!important;color:#e9f8f2!important;text-decoration:none!important;white-space:nowrap!important;transition:.18s ease!important}nav a:hover,.nav a:hover{border-color:rgba(39,217,154,.5)!important;background:rgba(39,217,154,.09)!important;transform:translateY(-1px)}
section,.card,article,.panel,.widget,form{position:relative;background:linear-gradient(180deg,rgba(17,35,28,.96),rgba(10,24,18,.96))!important;border:1px solid var(--hx-line)!important;border-radius:18px!important;padding:20px!important;margin:16px 0!important;box-shadow:0 12px 34px rgba(0,0,0,.16)!important;color:var(--hx-text)!important}
.dashboard,.grid,.cards,.stats,.metrics{gap:14px!important}.card:hover,article:hover,.panel:hover{border-color:rgba(39,217,154,.28)!important}
button,.button,[role="button"],input,select,textarea{font:inherit!important;border-radius:12px!important;min-height:44px!important;box-sizing:border-box!important}input,select,textarea{width:auto;max-width:100%;padding:10px 12px!important;border:1px solid rgba(255,255,255,.12)!important;background:#081711!important;color:var(--hx-text)!important;outline:none!important}input:focus,select:focus,textarea:focus{border-color:rgba(39,217,154,.65)!important;box-shadow:0 0 0 3px rgba(39,217,154,.10)!important}button,.button,[role="button"]{padding:10px 15px!important;border:0!important;background:linear-gradient(135deg,var(--hx-green),var(--hx-green2))!important;color:#03130c!important;font-weight:800!important;cursor:pointer!important;box-shadow:0 9px 26px rgba(39,217,154,.17)!important;transition:transform .16s ease,filter .16s ease!important}button:hover,.button:hover,[role="button"]:hover{transform:translateY(-1px)!important;filter:brightness(1.05)!important}button:active{transform:translateY(0)!important}button:disabled{opacity:.45!important;cursor:not-allowed!important;box-shadow:none!important}
table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;overflow:hidden!important;background:#091711!important;border:1px solid var(--hx-line)!important;border-radius:14px!important;color:var(--hx-text)!important}th{background:rgba(39,217,154,.07)!important;color:#c9f6e5!important;font-size:.78rem!important;text-transform:uppercase!important;letter-spacing:.06em!important}th,td{padding:12px 14px!important;border-bottom:1px solid rgba(255,255,255,.07)!important;text-align:left!important}tr:last-child td{border-bottom:0!important}
a{color:#67edbd}hr{border:0;border-top:1px solid rgba(255,255,255,.08)}
.badge,.tag,.status{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:5px 9px!important;border-radius:999px!important;background:rgba(39,217,154,.1)!important;border:1px solid rgba(39,217,154,.2)!important;color:#8af1ca!important;font-size:.78rem!important;font-weight:700!important}
:focus-visible{outline:3px solid rgba(103,237,189,.8)!important;outline-offset:3px!important}
@media(max-width:760px){.container,main,.app,.wrapper{width:min(100% - 20px,1180px)!important;margin:10px auto!important}header,.header,.hero,section,.card,article,.panel,.widget,form{padding:16px!important;border-radius:16px!important}nav,.nav,nav ul,.nav ul{overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:5px!important}h1{font-size:2rem!important}table{display:block!important;overflow-x:auto!important}input,select,textarea{width:100%!important}button{min-height:46px!important}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
</style>`

const X20_WOW_SCRIPT = `
<script data-hegeva-x20="wow-core">(()=>{const d=document;d.documentElement.dataset.hegevaX20='ready';d.querySelectorAll('input,select,textarea').forEach((el,i)=>{if(!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby'))el.setAttribute('aria-label',el.getAttribute('placeholder')||el.getAttribute('name')||('Field '+(i+1)))});d.querySelectorAll('button').forEach((b,i)=>{if(!b.textContent.trim()&&!b.getAttribute('aria-label'))b.setAttribute('aria-label','Action '+(i+1))});d.querySelectorAll('a[href="#"]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));})();</script>`

function injectBefore(html: string, closing: "head" | "body", patch: string) {
  const marker = new RegExp(`</${closing}>`, "i")
  return marker.test(html) ? html.replace(marker, `${patch}\n</${closing}>`) : `${html}\n${patch}`
}

function applyX20WowLayer(value: string) {
  let html = closeSafeHtmlStructure(value)
  if (!html.includes('data-hegeva-x20="wow-core"')) html = injectBefore(html, "head", X20_WOW_STYLE)
  if (!html.includes('<script data-hegeva-x20="wow-core"')) html = injectBefore(html, "body", X20_WOW_SCRIPT)
  return closeSafeHtmlStructure(html)
}

async function requestStudioAI(message: string, language: StudioLocale) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30000)
  const safeMessage = fitStudioMessage(message)

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: safeMessage, history: [], language, mode: "general" }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(typeof data?.error === "string" && data.error.trim() ? data.error.trim() : "HEGEVA AI is temporarily unavailable.")
    }

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

function isHtmlBuildRequest(message: string) {
  return /return\s+only[\s\S]{0,80}html/i.test(message) && /(index\.html|html document|html code|self-contained html)/i.test(message)
}

export async function runStudioAI(message: string, language: StudioLocale) {
  const x20 = isX20Request(message)
  const firstAnswer = await requestStudioAI(message, language)

  if (!isHtmlBuildRequest(message)) return firstAnswer

  let html = closeSafeHtmlStructure(stripCodeFence(firstAnswer))
  let verification = verifyBrowserPrototype(html)

  if (!verification.ok) {
    const issues = verificationIssues(verification)
    const repairInstruction = [
      "You are the HEGEVA App Studio automatic verification repair pass.",
      `Target language for visible UI text: ${language}.`,
      "The previous HTML output failed mandatory integrity or trust checks.",
      "Repair every listed issue while preserving working behaviour and the original application intent.",
      "Return ONLY one complete compact self-contained HTML document. No Markdown or explanation.",
      "Always finish with valid closing body and html tags. Inline JavaScript must parse.",
      "Do not fake payments, subscriptions, email, authentication, cloud writes or external-service success.",
      `FAILED CHECKS:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
      `ORIGINAL TASK:\n${message.slice(0, 900)}`,
      `FAILED HTML:\n${html.slice(0, 1050)}`,
    ].join("\n\n")

    const repairedAnswer = await requestStudioAI(repairInstruction, language)
    html = closeSafeHtmlStructure(stripCodeFence(repairedAnswer))
    verification = verifyBrowserPrototype(html)

    if (!verification.ok) {
      const remaining = verificationIssues(verification)
      throw new Error(`HEGEVA verification failed after automatic repair: ${remaining.join("; ")}`)
    }
  }

  if (x20) {
    html = applyX20WowLayer(html)
    verification = verifyBrowserPrototype(html)
    if (!verification.ok) throw new Error(`HEGEVA X20 WOW verification failed: ${verificationIssues(verification).join("; ")}`)
  }

  return html
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