import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in or create your free account",
  description: "Create your HEGEVA AI account to organise customers, quotes, invoices and follow-ups.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
