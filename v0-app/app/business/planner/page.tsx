"use client"

import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { LocalPlanner } from "@/components/business/planner"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

export default function PlannerPage() {
  const { locale } = useI18n()
  const c = getBusinessModulesCopy(locale)
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={c.eyebrow}
          title={c.planner.title}
          subtitle={c.planner.subtitle}
        />
        <div className="mt-8">
          <LocalPlanner />
        </div>
      </div>
    </AppShell>
  )
}
