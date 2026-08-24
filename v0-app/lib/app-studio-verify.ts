export type PrototypeCheck = {
  key: string
  ok: boolean
  detail: string
}

export type PrototypeVerification = {
  ok: boolean
  checks: PrototypeCheck[]
}

function inlineScripts(html: string) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/data-hegeva-x20=["']wow-core["']/i.test(match[0]))
    .map((match) => match[1].trim())
    .filter(Boolean)
}

function countId(source: string, id: string) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return (source.match(new RegExp(`id=["']${escaped}["']`, "gi")) || []).length
}

export function verifyBrowserPrototype(html: string): PrototypeVerification {
  const source = html.trim()
  const checks: PrototypeCheck[] = []

  const add = (key: string, ok: boolean, detail: string) => {
    checks.push({ key, ok, detail })
  }

  add(
    "document",
    /<!doctype html/i.test(source) && /<html(?:\s|>)/i.test(source),
    "Complete HTML document",
  )
  add(
    "structure",
    /<head(?:\s|>)/i.test(source) && /<\/head>/i.test(source) && /<body(?:\s|>)/i.test(source) && /<\/body>/i.test(source) && /<\/html>/i.test(source),
    "Required closing structure",
  )
  add(
    "no-markdown",
    !source.includes("```") && !/^\s*(here is|here's|sure[,!:])/i.test(source),
    "No Markdown wrapper or assistant preface",
  )
  add(
    "content",
    source.length >= 800 && /<(main|section|form|button|input|textarea|nav|article)(?:\s|>)/i.test(source),
    "Meaningful application markup",
  )

  const scripts = inlineScripts(source)
  let scriptSyntaxOk = true
  for (const script of scripts) {
    try {
      // Syntax-only compile. Generated code is never executed by the verifier.
      // eslint-disable-next-line no-new-func
      new Function(script)
    } catch {
      scriptSyntaxOk = false
      break
    }
  }
  add(
    "javascript",
    scriptSyntaxOk,
    scripts.length ? "Inline JavaScript parses" : "No inline JavaScript syntax errors",
  )

  const buttonCount = (source.match(/<button\b/gi) || []).length
  const formCount = (source.match(/<form\b/gi) || []).length
  const hasInlineHandlers = /\bon(click|submit|change|input)\s*=/i.test(source)
  const scriptText = scripts.join("\n")
  const hasScriptHandlers = /(addEventListener\s*\(|querySelector\s*\(|querySelectorAll\s*\(|getElementById\s*\(|\.onclick\s*=|\.onsubmit\s*=)/i.test(scriptText)
  const hasInteractionLogic = hasInlineHandlers || hasScriptHandlers
  add(
    "interactions",
    buttonCount === 0 || (scripts.length > 0 && hasInteractionLogic) || (formCount > 0 && hasInlineHandlers),
    "Visible buttons must be wired to real local interactions",
  )

  const hasX20Runtime = /data-hegeva-x20=["']safe-interactions["']/i.test(source)
  if (hasX20Runtime) {
    const ids = ["hx-form", "hx-name", "hx-list", "hx-count"]
    const singleIds = ids.every((id) => countId(source, id) === 1)
    const formMatch = source.match(/<form\b[^>]*id=["']hx-form["'][^>]*>([\s\S]*?)<\/form>/i)
    const formBody = formMatch?.[1] || ""
    const formHasInput = /id=["']hx-name["']/i.test(formBody)
    const formHasButton = /<button\b/i.test(formBody)
    const runtimeHasSubmit = /f\.addEventListener\(['"]submit['"]/i.test(scriptText)
    const runtimeHasFormClick = /f\.addEventListener\(['"]click['"]/i.test(scriptText)
    const runtimeHasDelete = /data-del/i.test(scriptText) && /splice\s*\(/i.test(scriptText)
    const runtimeHasFallback = /let\s+memory\s*=\s*\[\]/i.test(scriptText)

    add(
      "x20-contract",
      singleIds && Boolean(formMatch) && formHasInput && formHasButton,
      "Exactly one X20 form, input, list and count are wired together",
    )
    add(
      "x20-runtime",
      runtimeHasSubmit && runtimeHasFormClick && runtimeHasDelete && runtimeHasFallback,
      "X20 add, delete and sandbox-safe fallback handlers are present",
    )
  }

  const hasBrokenImageRisk = /<img\b[^>]*\bsrc\s*=\s*["'](?:\s*|https?:\/\/|\/\/|#)[^"']*["']/i.test(source)
  add(
    "assets",
    !hasBrokenImageRisk,
    "No missing or external placeholder images in the self-contained build",
  )

  const fakeSuccessPatterns = [
    /payment\s+(successful|succeeded|complete)/i,
    /subscription\s+(activated|active)/i,
    /email\s+(sent|delivered)/i,
    /account\s+(created|registered)\s+successfully/i,
  ]
  const hasExternalIntegration = /fetch\s*\(|XMLHttpRequest|stripe|paypal|resend|supabase|firebase/i.test(source)
  const hasFakeSuccess = fakeSuccessPatterns.some((pattern) => pattern.test(source)) && !hasExternalIntegration
  add(
    "trust",
    !hasFakeSuccess,
    "No obvious fake external-service success state",
  )

  return {
    ok: checks.every((check) => check.ok),
    checks,
  }
}

export function verificationIssues(result: PrototypeVerification) {
  return result.checks
    .filter((check) => !check.ok)
    .map((check) => `${check.key}: ${check.detail}`)
}
