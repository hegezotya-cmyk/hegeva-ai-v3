"use client"

import { useEffect, useRef, useState } from "react"

export type AiFeatureFlags = {
  providerEnabled: boolean
  globalKillSwitch: boolean
  x20Enabled: boolean
  assistantEnabled: boolean
  x10Enabled: boolean
  aiBotsEnabled: boolean
  x30Enabled: boolean
  videoEnabled: boolean
}

const FALLBACK: AiFeatureFlags = {
  providerEnabled: false,
  globalKillSwitch: true,
  x20Enabled: true,
  assistantEnabled: false,
  x10Enabled: false,
  aiBotsEnabled: false,
  x30Enabled: false,
  videoEnabled: false,
}

export type AiAvailability = {
  status: AiFeatureFlags
  loading: boolean
}

let inflight: Promise<AiFeatureFlags> | null = null

function fetchAiFlags(): Promise<AiFeatureFlags> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      const response = await fetch("/api/ai/status", {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
      clearTimeout(timeout)
      if (!response.ok) return FALLBACK
      const data = (await response.json()) as Partial<AiFeatureFlags>
      return { ...FALLBACK, ...data }
    } catch {
      return FALLBACK
    }
  })()
  void inflight.finally(() => { inflight = null })
  return inflight
}

const GLOBAL_STATE: AiAvailability = { status: { ...FALLBACK }, loading: true }
const listeners = new Set<() => void>()

function emit() { listeners.forEach((fn) => fn()) }

if (typeof window !== "undefined") {
  void fetchAiFlags().then((flags) => {
    GLOBAL_STATE.status = flags
    GLOBAL_STATE.loading = false
    emit()
  })
}

export function useAiAvailability(): AiAvailability {
  const [, rerender] = useState(0)
  useEffect(() => {
    const listener = () => rerender((n) => n + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])
  return GLOBAL_STATE
}
