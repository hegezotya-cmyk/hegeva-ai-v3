"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, TriangleAlert } from "lucide-react"
import { evaluateX20BuildCandidate } from "@/lib/app-studio-capability-gate"
import type { X20BuildMode } from "@/lib/app-studio-capability-engine"
import { auditStudioSpecMatch } from "@/lib/app-studio-spec-match"

const HTML_KEY = "hegeva:x20:studio:html"
const IDEA_KEY = "hegeva:x20:studio:idea"
const BUILD_KEY = "hegeva:x20:studio:build-mode"

function estimateQuality(html: string) {
  const controls = (html.match(/<(button|input|select|textarea)\b/gi) || []).length
  const sections = (html.match(/<(section|article|form|table)\b/gi) || []).length
  const script = /<script\b/i.test(html)
  const storage = /localStorage/i.test(html)
  const responsive = /@media|viewport/i.test(html)
  const nav = /<(nav|aside)\b/i.test(html)
  const forms = /<form\b/i.test(html)
  return Math.min(100, controls * 4 + sections * 4 + (script ? 15 : 0) + (storage ? 15 : 0) + (responsive ? 10 : 0) + (nav ? 10 : 0) + (forms ? 10 : 0))
}

type LiveState = {
  gate: ReturnType<typeof evaluateX20BuildCandidate>
  requestScore: number
  missing: string[]
  accepted: boolean
}

export function X20CapabilityStatus() {
  const [state, setState] = useState<LiveState | null>(null)

  useEffect(() => {
    const read = () => {
      try {
        const html = localStorage.getItem(HTML_KEY) || ""
        const idea = (localStorage.getItem(IDEA_KEY) || "").trim()
        const rawMode = localStorage.getItem(BUILD_KEY)
        const mode: X20BuildMode = rawMode === "starter" || rawMode === "growth" ? rawMode : "premium"
        if (!html) return setState(null)
        const gate = evaluateX20BuildCandidate({ html, quality: estimateQuality(html) }, mode)
        const spec = auditStudioSpecMatch(html, idea)
        setState({
          gate,
          requestScore: spec.score,
          missing: spec.missing,
          accepted: gate.accepted && spec.score >= 80 && !spec.severeMismatch,
        })
      } catch {
        setState(null)
      }
    }

    read()
    const timer = window.setInterval(read, 1200)
    window.addEventListener("storage", read)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("storage", read)
    }
  }, [])

  if (!state) return null
  const { gate } = state
  const needs = [
    ...gate.missingRequired,
    ...(state.requestScore < 80 ? [`request match ${state.requestScore}%`] : []),
  ]

  return (
    <div className={`mx-auto mb-4 flex max-w-[1560px] flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${state.accepted ? "border-primary/25 bg-primary/8" : "border-amber-400/25 bg-amber-400/8"}`}>
      <div className="flex items-center gap-2">
        {state.accepted ? <ShieldCheck className="size-4 text-primary" /> : <TriangleAlert className="size-4 text-amber-300" />}
        <div>
          <span className="font-black uppercase tracking-wider text-foreground">{gate.mode} capability + request contract</span>
          <span className="ml-2 text-muted-foreground">capability {gate.capabilityScore}% · request {state.requestScore}% · quality {gate.quality}%/{gate.minimumQuality}%</span>
        </div>
      </div>
      <div className={state.accepted ? "font-bold text-primary" : "max-w-3xl text-right font-semibold text-amber-200"}>
        {state.accepted ? "Verified for this build level and customer request" : `Needs repair: ${needs.join(", ") || gate.reason}`}
      </div>
    </div>
  )
}
