import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { LocalPlanner } from "@/components/business/planner"

export default function PlannerPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Business Workspace"
          title="Planner / Time Saver"
          subtitle="Capture priorities, due dates and quick tasks in one place. Signed-in accounts keep this real data synced to their cloud workspace."
        />
        <div className="mt-8">
          <LocalPlanner />
        </div>
      </div>
    </AppShell>
  )
}
