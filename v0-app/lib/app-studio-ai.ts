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
    html = /<\/html>/i.test(html)
      ? html.replace(/<\/html>/i, "</body>\n</html>")
      : `${html}\n</body>`
  }

  if (hasHtmlOpen && !/<\/html>/i.test(html)) html = `${html}\n</html>`

  return html.trim()
}

function isX20Request(message: string) {
  return /HEGEVA Build My App X20/i.test(message)
}

const X20_WOW_STYLE = `
<style data-hegeva-x20="wow-core">
:root{color-scheme:dark;--hx-bg:#06100c;--hx-panel:#0d1b16;--hx-line:rgba(82,231,179,.16);--hx-green:#27d99a;--hx-green2:#67edbd;--hx-text:#f3faf7;--hx-muted:#9eb1a9;--hx-shadow:0 24px 70px rgba(0,0,0,.28)}
*{box-sizing:border-box}html{background:var(--hx-bg);scroll-behavior:smooth}body{margin:0!important;min-height:100vh;background:radial-gradient(circle at 82% -10%,rgba(39,217,154,.18),transparent 34%),var(--hx-bg)!important;color:var(--hx-text)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;line-height:1.55!important}
.container,main,.app,.wrapper{width:min(1180px,calc(100% - 32px))!important;max-width:1180px!important;margin:24px auto!important;padding:0!important;position:relative}
header,.header,.hero{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(14,36,28,.98),rgba(8,24,18,.98))!important;border:1px solid rgba(39,217,154,.25)!important;border-radius:24px!important;padding:28px!important;box-shadow:var(--hx-shadow)!important;color:var(--hx-text)!important}
h1,h2,h3,h4{color:var(--hx-text)!important;letter-spacing:-.035em!important}small,.muted,.subtitle,.description{color:var(--hx-muted)!important}
nav,.nav,nav ul,.nav ul{display:flex!important;align-items:center!important;gap:9px!important;flex-wrap:wrap!important;list-style:none!important;margin:14px 0!important;padding:0!important;background:transparent!important}nav a,.nav a{display:inline-flex!important;align-items:center!important;min-height:40px!important;padding:8px 13px!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:999px!important;background:rgba(255,255,255,.04)!important;color:#e9f8f2!important;text-decoration:none!important}
section,.card,article,.panel,.widget,form{position:relative;background:linear-gradient(180deg,rgba(17,35,28,.96),rgba(10,24,18,.96))!important;border:1px solid var(--hx-line)!important;border-radius:18px!important;padding:20px!important;margin:16px 0!important;box-shadow:0 12px 34px rgba(0,0,0,.16)!important;color:var(--hx-text)!important}
button,input,select,textarea{font:inherit!important;border-radius:12px!important;min-height:44px!important;box-sizing:border-box!important}input,select,textarea{max-width:100%;padding:10px 12px!important;border:1px solid rgba(255,255,255,.12)!important;background:#081711!important;color:var(--hx-text)!important}button{padding:10px 15px!important;border:0!important;background:linear-gradient(135deg,var(--hx-green),var(--hx-green2))!important;color:#03130c!important;font-weight:800!important;cursor:pointer!important}
table{width:100%!important;border-collapse:collapse!important;background:#091711!important;color:var(--hx-text)!important}th,td{padding:12px!important;border-bottom:1px solid rgba(255,255,255,.07)!important;text-align:left!important}
:focus-visible{outline:3px solid rgba(103,237,189,.8)!important;outline-offset:3px!important}
@media(max-width:760px){.container,main,.app,.wrapper{width:min(100% - 20px,1180px)!important;margin:10px auto!important}header,.header,.hero,section,.card,article,.panel,.widget,form{padding:16px!important;border-radius:16px!important}nav,.nav,nav ul,.nav ul{overflow-x:auto!important;flex-wrap:nowrap!important}table{display:block!important;overflow-x:auto!important}input,select,textarea{width:100%!important}}
</style>`

function injectBefore(html: string, closing: "head" | "body", patch: string) {
  const marker = new RegExp(`</${closing}>`, "i")
  return marker.test(html) ? html.replace(marker, `${patch}\n</${closing}>`) : `${html}\n${patch}`
}

function applyX20WowLayer(value: string) {
  let html = closeSafeHtmlStructure(value)
  if (!html.includes('data-hegeva-x20="wow-core"')) html = injectBefore(html, "head", X20_WOW_STYLE)
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

async function repairHtml(
  html: string,
  originalMessage: string,
  language: StudioLocale,
  compact = false,
) {
  const verification = verifyBrowserPrototype(html)
  const issues = verificationIssues(verification)

  const repairInstruction = compact
    ? [
        "HEGEVA X20 emergency compact repair.",
        `Visible UI language: ${language}.`,
        "Return ONLY a COMPLETE self-contained HTML document that fits comfortably in the available response.",
        "Keep CSS and JavaScript very compact. Prefer a smaller working app over a larger truncated app.",
        "Must include doctype, html, head, body and all closing tags.",
        "Must contain meaningful app markup, at least one real form or button interaction, and valid inline JavaScript.",
        "No external images, no Markdown, no explanation.",
        `FAILED CHECKS: ${issues.join("; ")}`,
        `ORIGINAL TASK: ${originalMessage.slice(0, 700)}`,
      ].join("\n\n")
    : [
        "You are the HEGEVA App Studio automatic verification repair pass.",
        `Target language for visible UI text: ${language}.`,
        "Repair every listed issue while preserving working behaviour and the original application intent.",
        "Return ONLY one complete compact self-contained HTML document. No Markdown or explanation.",
        "Always finish with valid closing body and html tags. Inline JavaScript must parse.",
        "Keep the output compact enough to finish completely; completeness is more important than extra styling.",
        "Do not fake payments, subscriptions, email, authentication, cloud writes or external-service success.",
        `FAILED CHECKS:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
        `ORIGINAL TASK:\n${originalMessage.slice(0, 800)}`,
        `FAILED HTML:\n${html.slice(0, 700)}`,
      ].join("\n\n")

  return closeSafeHtmlStructure(stripCodeFence(await requestStudioAI(repairInstruction, language)))
}

export async function runStudioAI(message: string, language: StudioLocale) {
  const x20 = isX20Request(message)
  const firstAnswer = await requestStudioAI(message, language)

  if (!isHtmlBuildRequest(message)) return firstAnswer

  let html = closeSafeHtmlStructure(stripCodeFence(firstAnswer))
  let verification = verifyBrowserPrototype(html)

  if (!verification.ok) {
    html = await repairHtml(html, message, language, false)
    verification = verifyBrowserPrototype(html)
  }

  if (!verification.ok) {
    html = await repairHtml(html, message, language, true)
    verification = verifyBrowserPrototype(html)
  }

  if (!verification.ok) {
    throw new Error(`HEGEVA verification failed after recovery: ${verificationIssues(verification).join("; ")}`)
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
