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
  const text = value.trim().toLowerCase()
  const hasStart = text.includes("<!doctype html") || text.includes("<html")
  return hasStart && text.includes("</html>")
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
