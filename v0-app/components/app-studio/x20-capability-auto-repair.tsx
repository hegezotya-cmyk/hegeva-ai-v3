"use client"

import { useEffect, useRef } from "react"
import { looksLikeHtmlDocument, runStudioAI, stripCodeFence, type StudioLocale } from "@/lib/app-studio-ai"
import { buildX20RetryInstruction, chooseX20Candidate, evaluateX20BuildCandidate } from "@/lib/app-studio-capability-gate"
import type { X20BuildMode } from "@/lib/app-studio-capability-engine"
import { auditStudioSpecMatch, buildStudioSpecRepairInstruction } from "@/lib/app-studio-spec-match"

const HTML_KEY = "hegeva:x20:studio:html"
const IDEA_KEY = "hegeva:x20:studio:idea"
const BUILD_KEY = "hegeva:x20:studio:build-mode"
const MODE_KEY = "hegeva:x20:studio:mode"
const REPAIR_KEY = "hegeva:x20:capability-repair-key"
const REPAIR_ATTEMPTS_KEY = "hegeva:x20:capability-repair-attempts"
const MAX_REPAIR_ATTEMPTS = 2

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

function fingerprint(mode: X20BuildMode, html: string, idea: string) {
  let hash = 2166136261
  const source = `${idea}\n${html}`
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `${mode}:${html.length}:${hash >>> 0}`
}

function readAttempts(key: string) {
  try {
    const raw = localStorage.getItem(REPAIR_ATTEMPTS_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { key?: string; attempts?: number }
    return parsed.key === key && Number.isFinite(parsed.attempts) ? Math.max(0, parsed.attempts || 0) : 0
  } catch {
    return 0
  }
}

function writeAttempts(key: string, attempts: number) {
  try {
    localStorage.setItem(REPAIR_ATTEMPTS_KEY, JSON.stringify({ key, attempts }))
  } catch {}
}

function resetAttempts() {
  try {
    localStorage.removeItem(REPAIR_KEY)
    localStorage.removeItem(REPAIR_ATTEMPTS_KEY)
  } catch {}
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
        const firstMatch = auditStudioSpecMatch(html, idea)
        const specNeedsRepair = firstMatch.severeMismatch || firstMatch.score < 65

        if (firstGate.accepted && !specNeedsRepair) {
          resetAttempts()
          return
        }

        const key = fingerprint(mode, html, idea)
        const attempts = readAttempts(key)
        if (attempts >= MAX_REPAIR_ATTEMPTS) return
        if (localStorage.getItem(REPAIR_KEY) === key && attempts > 0) return

        localStorage.setItem(REPAIR_KEY, key)
        writeAttempts(key, attempts + 1)
        running.current = true

        const instruction = [
          !firstGate.accepted ? buildX20RetryInstruction(mode, idea, html, firstQuality) : "HEGEVA X20 build-level contract is currently acceptable; preserve its working capabilities while repairing request fidelity.",
          specNeedsRepair ? buildStudioSpecRepairInstruction(idea, firstMatch) : "",
          firstGate.missingRequired.length
            ? `CRITICAL: implement these missing capabilities as REAL WORKING FLOWS, not labels or decorative controls: ${firstGate.missingRequired.join(", ")}.`
            : "",
          "If edit is missing, add a real edit/update action that lets the user modify an existing saved record and persists the updated value.",
          "Do not remove working modules merely to satisfy the repair. Preserve useful CRUD, persistence, calculations and navigation that belong to the customer's actual request.",
          `REQUEST MATCH BEFORE REPAIR: ${firstMatch.score}%. Missing concepts: ${firstMatch.missing.slice(0, 8).join(", ") || "none"}.`,
        ].filter(Boolean).join("\n\n")

        const retryHtml = stripCodeFence(await runStudioAI(instruction, localeFromDocument()))
        if (!looksLikeHtmlDocument(retryHtml)) {
          localStorage.removeItem(REPAIR_KEY)
          return
        }

        const retryQuality = quality(retryHtml)
        const retryGate = evaluateX20BuildCandidate({ html: retryHtml, quality: retryQuality }, mode)
        const retryMatch = auditStudioSpecMatch(retryHtml, idea)
        const capabilityChoice = chooseX20Candidate(
          { html, quality: firstQuality },
          { html: retryHtml, quality: retryQuality },
          mode,
        )

        const specImproved = retryMatch.score >= firstMatch.score + 10 && retryGate.missingRequired.length <= firstGate.missingRequired.length
        const capabilityImproved = capabilityChoice.candidate.html === retryHtml && (
          retryGate.accepted ||
          retryGate.capabilityScore > firstGate.capabilityScore ||
          retryGate.missingRequired.length < firstGate.missingRequired.length
        )
        const retryIsSafe = retryGate.capabilityScore >= Math.max(55, firstGate.capabilityScore - 5)
        const improved = retryIsSafe && (capabilityImproved || specImproved)

        if (improved) {
          localStorage.setItem(HTML_KEY, retryHtml)
          localStorage.setItem(MODE_KEY, `${mode} capability/spec repair`)
          resetAttempts()
          if (!cancelled) window.location.reload()
          return
        }

        localStorage.removeItem(REPAIR_KEY)
      } catch {
        try { localStorage.removeItem(REPAIR_KEY) } catch {}
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
