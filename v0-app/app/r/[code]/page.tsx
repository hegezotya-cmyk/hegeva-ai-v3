import { redirect } from "next/navigation"

type ReferralPageProps = {
  params: Promise<{ code: string }>
}

const SAFE_REFERRAL = /^[A-Za-z0-9_-]{1,32}$/

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = await params
  const safe = SAFE_REFERRAL.test(code) ? code : ""
  redirect(safe ? `/challenge?ref=${encodeURIComponent(safe)}` : "/challenge")
}
