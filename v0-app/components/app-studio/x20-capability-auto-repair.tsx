"use client"

import { useEffect, useRef } from "react"
import { looksLikeHtmlDocument, runStudioAI, stripCodeFence, type StudioLocale } from "@/lib/app-studio-ai"
import { buildX20RetryInstruction, chooseX20Candidate, evaluateX20BuildCandidate } from "@/lib/app-studio-capability-gate"
import type { X20BuildMode } from "@/lib/app-studio-capability-engine"

const HTML_KEY = "hegeva:x20:studio:html"
const IDEA_KEY = "hegeva:x20:studio:idea"
const BUILD_KEY = "hegeva:x20:studio:build-mode"
const MODE_KEY = "hegeva:x20:studio:mode"
const REPAIR_KEY = "hegeva:x20:capability-repair-key"

function quality(html: string) {
  const controls = (html.match(/<(button|input|select|textarea)\b/gi) || []).length
  const sections = (html.match(/<(section|article|form|table)\b/gi) || []).length
  const script = /<script\b/i.test(html)
  const storage = /localStorage/i.test(html)
  const responsive = /@media|viewport/i.test(html)
  const nav = /<(nav|aside)\b/i.test(html)
  const forms = /<form\b/i.test(html)
  return Math.min(100, controls * 4 + sections * 4 + (script ? 15 : 0) + (storage ? 15 : 0) + (responsive ? 10 : 0) + (nav ? 10 : 0) + (forms ? 10 : 0))
}

function selectedMode(value: string | null): X20BuildMode {
  return value === "starter" || value === "growth" ? value : "premium"
}

function localeFromDocument(): StudioLocale {
  const value = document.documentElement.lang.toLowerCase().slice(0, 2)
  return value === "hu" || value === "de" || value === "fr" || value === "es" ? value : "en"
}

function fingerprint(mode: X20BuildMode, html: string) {
  let hash = 2166136261
  for (let i = 0; i < html.length; i += 1) {
    hash ^= html.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `${mode}:${html.length}:${hash >>> 0}`
}

export function X20CapabilityAutoRepair() {
  const running = useRef(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      if (running.current || cancelled) return
      try {
        const html = localStorage.getItem(HTML_KEY) || ""
        const idea = (localStorage.getItem(IDEA_KEY) || "").trim()
        const mode = selectedMode(localStorage.getItem(BUILD_KEY))
        if (!idea || !looksLikeHtmlDocument(html)) return

        const firstQuality = quality(html)
        const firstGate = evaluateX20BuildCandidate({ html, quality: firstQuality }, mode)
        if (firstGate.accepted) return

        const key = fingerprint(mode, html)
        if (localStorage.getItem(REPAIR_KEY) === key) return
        localStorage.setItem(REPAIR_KEY, key)
        running.current = true

        const instruction = buildX20RetryInstruction(mode, idea, html, firstQuality)
        const retryHtml = stripCodeFence(await runStudioAI(instruction, localeFromDocument()))
        if (!looksLikeHtmlDocument(retryHtml)) return

        const chosen = chooseX20Candidate(
          { html, quality: firstQuality },
          { html: retryHtml, quality: quality(retryHtml) },
          mode,
        )

        if (chosen.candidate.html !== html && chosen.gate.capabilityScore >= firstGate.capabilityScore) {
          localStorage.setItem(HTML_KEY, chosen.candidate.html)
          localStorage.setItem(MODE_KEY, `${mode} capability repair`)
          localStorage.removeItem(REPAIR_KEY)
          if (!cancelled) window.location.reload()
        }
      } catch {
        // The normal Studio build remains usable even if the optional repair pass fails.
      } finally {
        running.current = false
      }
    }

    const timer = window.setInterval(() => { void check() }, 1400)
    void check()
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return null
}
