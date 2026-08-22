"use client"

import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { MessageStudio } from "@/components/business/message-studio"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

export default function MessagesPage() {
  const { locale } = useI18n()
  const c = getBusinessModulesCopy(locale)
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={c.eyebrow}
          title={c.messages.title}
          subtitle={c.messages.subtitle}
        />
        <div className="mt-8">
          <MessageStudio />
        </div>
      </div>
    </AppShell>
  )
}
