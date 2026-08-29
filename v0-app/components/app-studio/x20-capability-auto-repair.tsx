"use client"

import { useEffect, useRef } from "react"
import { looksLikeHtmlDocument, runStudioAI, stripCodeFence, type StudioLocale, type X20ActionContext } from "@/lib/app-studio-ai"
import { buildX20RetryInstruction, evaluateX20BuildCandidate } from "@/lib/app-studio-capability-gate"
import type { X20BuildMode } from "@/lib/app-studio-capability-engine"
import { auditStudioSpecMatch, buildStudioSpecRepairInstruction } from "@/lib/app-studio-spec-match"

const HTML_KEY = "hegeva:x20:studio:html"
const IDEA_KEY = "hegeva:x20:studio:idea"
const BUILD_KEY = "hegeva:x20:studio:build-mode"
const MODE_KEY = "hegeva:x20:studio:mode"
const REPAIR_KEY = "hegeva:x20:capability-repair-key"
const REPAIR_ATTEMPTS_KEY = "hegeva:x20:capability-repair-attempts"
const MAX_REPAIR_ATTEMPTS = 3
const MIN_REQUEST_MATCH = 80
const BUILD_INTENT_KEY = "hegeva:x20:studio:build-intent"

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
  } catch { return 0 }
}

function writeAttempts(key: string, attempts: number) {
  try { localStorage.setItem(REPAIR_ATTEMPTS_KEY, JSON.stringify({ key, attempts })) } catch {}
}

function resetAttempts() {
  try {
    localStorage.removeItem(REPAIR_KEY)
    localStorage.removeItem(REPAIR_ATTEMPTS_KEY)
  } catch {}
}

function candidateRank(html: string, idea: string, mode: X20BuildMode) {
  const q = quality(html)
  const gate = evaluateX20BuildCandidate({ html, quality: q }, mode)
  const spec = auditStudioSpecMatch(html, idea)
  const acceptedBonus = gate.accepted && spec.score >= MIN_REQUEST_MATCH && !spec.severeMismatch ? 100000 : 0
  return {
    q,
    gate,
    spec,
    rank: acceptedBonus + spec.score * 1000 + gate.capabilityScore * 10 + q - gate.missingRequired.length * 250,
  }
}

export function X20CapabilityAutoRepair() {
  const running = useRef(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      if (running.current || cancelled) return
      try {
        if (localStorage.getItem(BUILD_INTENT_KEY) !== "explicit") return
        const html = localStorage.getItem(HTML_KEY) || ""
        const idea = (localStorage.getItem(IDEA_KEY) || "").trim()
        const mode = selectedMode(localStorage.getItem(BUILD_KEY))
        if (!idea || !looksLikeHtmlDocument(html)) return

        const base = candidateRank(html, idea, mode)
        if (base.gate.accepted && base.spec.score >= MIN_REQUEST_MATCH && !base.spec.severeMismatch) {
          resetAttempts()
          return
        }

        const key = fingerprint(mode, html, idea)
        const attempts = readAttempts(key)
        if (attempts >= MAX_REPAIR_ATTEMPTS) return
        if (localStorage.getItem(REPAIR_KEY) === key) return

        localStorage.setItem(REPAIR_KEY, key)
        running.current = true

        let bestHtml = html
        let best = base
        let usedAttempts = attempts
        const action: X20ActionContext = { startRequestId: crypto.randomUUID() }

        while (usedAttempts < MAX_REPAIR_ATTEMPTS && !cancelled) {
          usedAttempts += 1
          writeAttempts(key, usedAttempts)
          const instruction = [
            !best.gate.accepted
              ? buildX20RetryInstruction(mode, idea, bestHtml, best.q)
              : "HEGEVA X20 capability contract passes. Preserve all working capabilities while repairing request fidelity.",
            best.spec.score < MIN_REQUEST_MATCH || best.spec.severeMismatch ? buildStudioSpecRepairInstruction(idea, best.spec) : "",
            "X20 PRO FIDELITY RULE: the app must visibly implement the customer's requested domain, records, fields, navigation and workflows. Generic CRM, Business OS, invoicing or unrelated modules are forbidden unless explicitly requested.",
            `TARGET REQUEST MATCH: at least ${MIN_REQUEST_MATCH}%. Current best: ${best.spec.score}%.`,
            best.gate.missingRequired.length ? `MANDATORY WORKING CAPABILITIES STILL MISSING: ${best.gate.missingRequired.join(", ")}.` : "",
            `MISSING REQUEST CONCEPTS: ${best.spec.missing.slice(0, 14).join(", ") || "none"}.`,
            "Do not merely mention missing concepts. Represent them in the actual data model, form fields, navigation and working interactions where the request requires them.",
            "Return ONLY one complete self-contained index.html with inline CSS and vanilla JavaScript.",
          ].filter(Boolean).join("\n\n")

          const retryHtml = stripCodeFence(await runStudioAI(instruction, localeFromDocument(), action))
          if (!looksLikeHtmlDocument(retryHtml)) continue
          const retry = candidateRank(retryHtml, idea, mode)
          if (retry.rank > best.rank) {
            bestHtml = retryHtml
            best = retry
          }
          if (best.gate.accepted && best.spec.score >= MIN_REQUEST_MATCH && !best.spec.severeMismatch) break
        }

        if (bestHtml !== html && best.rank > base.rank) {
          localStorage.setItem(HTML_KEY, bestHtml)
          localStorage.setItem(MODE_KEY, `${mode} best-of-${usedAttempts} capability/spec repair`)
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
