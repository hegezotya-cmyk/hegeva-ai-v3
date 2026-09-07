"use client"

import { AIBotStudio } from "@/components/app-studio/ai-bot-studio"
import { AIBotExecution } from "@/components/app-studio/ai-bot-execution"
import { AIBotOwnerApprovalPanel } from "@/components/app-studio/ai-bot-owner-approval-panel"
import { ComingSoonCard } from "@/components/coming-soon-state"
import { useAiAvailability } from "@/lib/ai-availability"
export default function AIBotsPage() {
  const aiAvailability = useAiAvailability()
  if (!aiAvailability.status.aiBotsEnabled) {
    return <ComingSoonCard feature="aiBots" className="max-w-4xl" />
  }
  return <AIBotStudio afterContent={<main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 lg:px-8"><AIBotOwnerApprovalPanel /><AIBotExecution /></main>} />
}