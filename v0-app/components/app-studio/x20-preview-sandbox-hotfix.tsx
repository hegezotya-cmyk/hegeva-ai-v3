"use client"

import { useEffect } from "react"

const PREVIEW_TITLE = "HEGEVA customer app preview"

export function X20PreviewSandboxHotfix() {
  useEffect(() => {
    const fixPreview = () => {
      document.querySelectorAll<HTMLIFrameElement>(`iframe[title="${PREVIEW_TITLE}"]`).forEach((frame) => {
        const tokens = new Set((frame.getAttribute("sandbox") || "").split(/\s+/).filter(Boolean))
        if (tokens.has("allow-forms")) return

        tokens.add("allow-scripts")
        tokens.add("allow-forms")
        frame.setAttribute("sandbox", Array.from(tokens).join(" "))

        // Sandbox flags are applied on navigation. Re-assign srcdoc once so the
        // already-rendered customer app reloads with form submission enabled.
        const srcdoc = frame.srcdoc
        if (srcdoc) frame.srcdoc = srcdoc
      })
    }

    fixPreview()
    const observer = new MutationObserver(fixPreview)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
