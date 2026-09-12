import { AppShell } from "@/components/app-shell"
import { ResetPasswordPanel } from "@/components/auth/reset-password-panel"
import { ResetPasswordHeader } from "@/components/auth/reset-password-header"

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string
    error?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams

  return (
    <AppShell>
      <main className="mx-auto min-h-[75vh] max-w-xl px-6 py-16">
        <ResetPasswordHeader />
        <ResetPasswordPanel token={params.token} tokenError={params.error} />
      </main>
    </AppShell>
  )
}
