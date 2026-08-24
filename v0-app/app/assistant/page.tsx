"use client"

import { AppShell } from "@/components/app-shell"
import { AssistantChat } from "@/components/assistant/assistant-chat"
import { useI18n } from "@/lib/i18n/provider"

export default function AssistantPage() {
  const { t } = useI18n()
  return (
    <AppShell>
      <main className="mx-auto min-h-[80vh] max-w-5xl px-6 py-10 sm:py-14">
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t.assistant.title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            {t.assistant.subtitle}
          </p>
        </div>

        <AssistantChat />
      </main>
    </AppShell>
  )
}
