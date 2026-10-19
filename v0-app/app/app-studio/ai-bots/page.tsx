"use client"
import { useEffect, useState } from "react"

import { AIBotStudio } from "@/components/app-studio/ai-bot-studio"
import { AIBotExecution } from "@/components/app-studio/ai-bot-execution"
import { AIBotOwnerApprovalPanel } from "@/components/app-studio/ai-bot-owner-approval-panel"
import { OwnerAIBotSetup } from "@/components/app-studio/owner-ai-bot-setup"
import { ComingSoonCard } from "@/components/coming-soon-state"
import { useAiAvailability } from "@/lib/ai-availability"
import { OwnerAIBotRenewal } from "@/components/app-studio/owner-ai-bot-renewal"
export default function AIBotsPage() {
  const aiAvailability = useAiAvailability()
  const [renewal, setRenewal] = useState<{ available: boolean; profileId?: string }>({ available: false })
  useEffect(() => {
    if (aiAvailability.status.aiBotsEnabled) return
    let active = true
    fetch("/api/ai-bot/renewal-readiness", { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } }).then(async response => ({ response, data: await response.json().catch(() => null) })).then(({ response, data }) => {
      if (active && response.ok && data?.renewalAvailable === true && typeof data.profileId === "string") setRenewal({ available: true, profileId: data.profileId })
    }).catch(() => {})
    return () => { active = false }
  }, [aiAvailability.status.aiBotsEnabled])
  if (!aiAvailability.status.aiBotsEnabled) {
    return <><ComingSoonCard feature="aiBots" className="max-w-4xl" />{renewal.available && renewal.profileId ? <OwnerAIBotRenewal profileId={renewal.profileId} /> : <OwnerAIBotSetup />}</>
  }
  return <AIBotStudio afterContent={<main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 lg:px-8"><AIBotOwnerApprovalPanel /><AIBotExecution /></main>} />
}
