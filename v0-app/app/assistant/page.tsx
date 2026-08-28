"use client"

import { AppShell } from "@/components/app-shell"
import { AssistantChat } from "@/components/assistant/assistant-chat"
import { useI18n } from "@/lib/i18n/provider"
import { AICore } from "@/components/visual-engine"

export default function AssistantPage() {
  const { t } = useI18n()
  return (
    <AppShell>
      <main className="mx-auto min-h-[80vh] max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="assistant-crown"><div><p>HEGEVA / HUMAN LAYER</p><h1>{t.assistant.title}</h1><span>{t.assistant.subtitle}</span></div><div className="assistant-core-field"><span/><span/><AICore state="ready"/><small>READY TO UNDERSTAND</small></div></section>

        <AssistantChat />
      </main>
    </AppShell>
  )
}
