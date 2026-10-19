"use client"

import { useEffect, useState } from "react"
import { ANALYTICS_CONSENT_KEY, GA4_MEASUREMENT_ID } from "@/lib/conversion-tracking"

export function ConsentAnalytics() {
  const [choice, setChoice] = useState<"granted" | "denied" | null>(null)
  useEffect(() => {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
    setChoice(stored === "granted" ? "granted" : stored === "denied" ? "denied" : null)
  }, [])

  useEffect(() => {
    if (choice !== "granted" || document.getElementById("hegeva-ga4-script")) return
    window.dataLayer = window.dataLayer || []
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args) }
    window.gtag("js", new Date())
    window.gtag("config", GA4_MEASUREMENT_ID)
    const script = document.createElement("script")
    script.id = "hegeva-ga4-script"
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    document.head.appendChild(script)
  }, [choice])

  const decide = (value: "granted" | "denied") => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value)
    setChoice(value)
    if (value === "denied") window.location.reload()
  }

  if (choice !== null) return null
  return <div role="region" aria-label="Analytics cookies" className="fixed bottom-3 left-3 right-3 z-[100] mx-auto max-w-lg rounded-xl border border-border bg-background p-4 shadow-xl">
    <p className="mb-3 text-sm">HEGEVA AI uses optional analytics to improve the website. No analytics loads unless you agree.</p>
    <div className="flex gap-3">
      <button type="button" onClick={() => decide("granted")} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Accept analytics</button>
      <button type="button" onClick={() => decide("denied")} className="rounded-lg border border-border px-4 py-2 text-sm">Reject</button>
    </div>
  </div>
}
