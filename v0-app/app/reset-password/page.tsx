import { ResetPasswordPanel } from "@/components/auth/reset-password-panel"

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string
    error?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams

  return (
    <main className="mx-auto min-h-[75vh] max-w-xl px-6 py-16">
      <div className="mb-8">
        <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI ACCOUNT</p>
        <h1 className="text-4xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-4 text-muted-foreground">
          Choose a new secure password for your HEGEVA workspace.
        </p>
      </div>
      <ResetPasswordPanel token={params.token} tokenError={params.error} />
    </main>
  )
}
