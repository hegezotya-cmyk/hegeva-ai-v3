import { AppShell } from "@/components/app-shell"
import { EmailVerificationPanel } from "@/components/auth/email-verification-panel"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type EmailVerificationPageProps = {
  searchParams: Promise<{
    status?: string
    error?: string
  }>
}

export default async function EmailVerificationPage({
  searchParams,
}: EmailVerificationPageProps) {
  const params = await searchParams

  return (
    <AppShell>
      <main className="mx-auto min-h-[75vh] max-w-xl px-6 py-16">
        <EmailVerificationPanel status={params.status} error={params.error} />
      </main>
    </AppShell>
  )
}
