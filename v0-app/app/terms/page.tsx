import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal-document"

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms that apply when using HEGEVA AI.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return <LegalDocument type="terms" />
}
