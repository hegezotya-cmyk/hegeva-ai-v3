import { verificationIssues, verifyBrowserPrototype } from "./app-studio-verify"

export type StudioLocale = "en" | "hu" | "de" | "fr" | "es"

export async function runStudioAI(message: string, language: StudioLocale) {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history: [],
      language,
      mode: "general",
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" && data.error.trim()
        ? data.error.trim()
        : "HEGEVA AI is temporarily unavailable.",
    )
  }

  const answer = typeof data?.response === "string" ? data.response.trim() : ""
  if (!answer) {
    throw new Error("HEGEVA AI returned an empty response.")
  }

  return answer
}

export function stripCodeFence(value: string) {
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i)
  return (fenced?.[1] || trimmed).trim()
}

export function looksLikeHtmlDocument(value: string) {
  return verifyBrowserPrototype(value).ok
}

export type VerifiedHtmlResult = {
  html: string
  attempts: number
  autoRepaired: boolean
}

/**
 * Generate HTML, verify it, and automatically run one focused repair pass
 * when the first result fails the HEGEVA integrity/trust checks.
 * Nothing is returned as a successful build until verification passes.
 */
export async function runVerifiedStudioHtml(
  instruction: string,
  language: StudioLocale,
): Promise<VerifiedHtmlResult> {
  let answer = await runStudioAI(instruction, language)
  let html = stripCodeFence(answer)
  let verification = verifyBrowserPrototype(html)

  if (verification.ok) {
    return { html, attempts: 1, autoRepaired: false }
  }

  const issues = verificationIssues(verification)
  const repairInstruction = [
    "You are the HEGEVA App Studio automatic verification repair pass.",
    `Target language for visible UI text: ${language}.`,
    "The previous HTML output failed mandatory integrity or trust checks.",
    "Repair the document so every listed verification issue is resolved while preserving working behaviour and the original application intent.",
    "Return ONLY one complete self-contained HTML document. No Markdown fences, explanation, preface or commentary.",
    "The result must contain <!doctype html>, html, head and body with correct closing tags.",
    "Inline JavaScript must parse without syntax errors.",
    "Do not fake successful payments, subscriptions, email delivery, account creation, cloud database writes, authentication or other external-service success when no real integration exists.",
    `FAILED CHECKS:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
    `ORIGINAL TASK:\n${instruction.slice(0, 6000)}`,
    `FAILED HTML:\n${html.slice(0, 9000)}`,
  ].join("\n\n")

  answer = await runStudioAI(repairInstruction, language)
  html = stripCodeFence(answer)
  verification = verifyBrowserPrototype(html)

  if (!verification.ok) {
    const remaining = verificationIssues(verification)
    throw new Error(
      `HEGEVA verification failed after automatic repair: ${remaining.join("; ")}`,
    )
  }

  return { html, attempts: 2, autoRepaired: true }
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
