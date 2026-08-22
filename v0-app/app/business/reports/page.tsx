"use client"

import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { LocalReports } from "@/components/business/reports"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

export default function ReportsPage() {
  const { locale } = useI18n()
  const c = getBusinessModulesCopy(locale)
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={c.eyebrow}
          title={c.reports.title}
          subtitle={c.reports.subtitle}
        />
        <div className="mt-8">
          <LocalReports />
        </div>
      </div>
    </AppShell>
  )
}
