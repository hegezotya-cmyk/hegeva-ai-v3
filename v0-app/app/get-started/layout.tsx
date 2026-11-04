import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Set up your business workspace",
  alternates: { canonical: "/get-started" },
  robots: { index: false, follow: false },
}

export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
  return children
}
