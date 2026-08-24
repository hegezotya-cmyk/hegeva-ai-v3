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
      // Syntax-only compile. The generated application is not executed here.
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
    const x20ContractOk =
      /id=["']hx-form["']/i.test(source) &&
      /id=["']hx-name["']/i.test(source) &&
      /id=["']hx-list["']/i.test(source) &&
      /id=["']hx-count["']/i.test(source) &&
      /<button\b[^>]*type=["']submit["']/i.test(source)
    add(
      "x20-contract",
      x20ContractOk,
      "X20 customer form, list, count and submit control are present",
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
