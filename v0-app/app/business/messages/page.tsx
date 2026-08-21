import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { MessageStudio } from "@/components/business/message-studio"

export default function MessagesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Business Workspace"
          title="Message Studio"
          subtitle="Draft customer replies, follow-ups, reminders and business messages. Drafts stay in HEGEVA until you explicitly send them through a supported integration."
        />
        <div className="mt-8">
          <MessageStudio />
        </div>
      </div>
    </AppShell>
  )
}
