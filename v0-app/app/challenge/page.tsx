import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { SixtySecondChallenge } from "@/components/growth/sixty-second-challenge"

export const metadata: Metadata = {
  title: "60-Second Business Challenge",
  description: "Try the HEGEVA 60-Second Business Challenge with clearly labelled fictional demo data. No signup or card required to see how HEGEVA finds business priorities.",
  alternates: { canonical: "/challenge" },
  openGraph: {
    title: "HEGEVA 60-Second Business Challenge",
    description: "Give HEGEVA 60 seconds and see what a small business could be missing.",
    url: "/challenge",
    type: "website",
  },
}

export default function ChallengePage() {
  return (
    <AppShell>
      <SixtySecondChallenge />
    </AppShell>
  )
}
