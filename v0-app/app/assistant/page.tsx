"use client"

import { AppShell } from "@/components/app-shell"
import { AssistantChat } from "@/components/assistant/assistant-chat"
import { useI18n } from "@/lib/i18n/provider"
import { AICore } from "@/components/visual-engine"
import { PageHeader } from "@/components/page-header"

export default function AssistantPage() {
  const { t } = useI18n()
  return (
    <AppShell>
      <main className="mx-auto min-h-[80vh] max-w-5xl px-6 py-10 sm:py-14">
        <PageHeader className="mb-8" eyebrow="HEGEVA intelligence" title={t.assistant.title} subtitle={t.assistant.subtitle} action={<AICore state="active" />} />

        <AssistantChat />
      </main>
    </AppShell>
  )
}
