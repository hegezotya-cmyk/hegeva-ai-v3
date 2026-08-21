import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { LocalReports } from "@/components/business/reports"

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Business Workspace"
          title="Reports"
          subtitle="Summaries are calculated from your real cloud workspace data, with a browser-local fallback. No demo revenue, customers or activity are invented."
        />
        <div className="mt-8">
          <LocalReports />
        </div>
      </div>
    </AppShell>
  )
}
