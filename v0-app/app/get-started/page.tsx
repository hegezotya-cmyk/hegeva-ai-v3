import Link from "next/link"

export default function GetStartedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>

      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
        Choose where you want to start
      </h1>

      <p className="mt-4 max-w-2xl text-muted-foreground">
        Start with the HEGEVA Command Center, App Studio, or your Business workspace.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link
          href="/command-center"
          className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="text-lg font-semibold">Command Center</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open your HEGEVA operational dashboard.
          </p>
        </Link>

        <Link
          href="/app-studio"
          className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="text-lg font-semibold">App Studio</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prompt, build and improve applications.
          </p>
        </Link>

        <Link
          href="/business"
          className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="text-lg font-semibold">Business</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Work with customers, documents and expenses.
          </p>
        </Link>
      </div>
    </main>
  )
}
