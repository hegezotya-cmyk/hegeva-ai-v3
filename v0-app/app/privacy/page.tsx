import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal-document"

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How HEGEVA AI processes and protects information.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return <LegalDocument type="privacy" />
}
