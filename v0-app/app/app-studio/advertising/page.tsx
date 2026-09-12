import { AdvertisingStudio } from "@/components/app-studio/advertising-studio"
import { CampaignApprovalBoard } from "@/components/app-studio/campaign-approval-board"

export default function AdvertisingPage() {
  return <><AdvertisingStudio /><div className="mx-auto -mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"><CampaignApprovalBoard /></div></>
}
