import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HEGEVA Enterprise Workspace",
  description:
    "Discuss HEGEVA AI workspace needs for your organization, or compare the current plans.",
  alternates: { canonical: "/enterprise" },
  openGraph: {
    type: "website",
    url: "/enterprise",
    title: "HEGEVA Enterprise Workspace",
    description:
      "Discuss HEGEVA AI workspace needs for your organization, or compare the current plans.",
  },
}

export default function EnterpriseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
