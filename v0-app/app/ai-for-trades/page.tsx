import type { Metadata } from "next"
import { AcquisitionPageView } from "@/components/acquisition/acquisition-page"
import { acquisitionPages } from "@/lib/acquisition-pages"
const page=acquisitionPages["ai-for-trades"]
export const metadata:Metadata={title:page.title,description:page.description,alternates:{canonical:`/${page.slug}`},openGraph:{type:"website",url:`/${page.slug}`,title:page.title,description:page.description,images:[{url:"/hegeva-social-card.webp",width:1200,height:630,alt:"HEGEVA AI for UK trades and service businesses"}]},twitter:{card:"summary_large_image",title:page.title,description:page.description,images:["/hegeva-social-card.webp"]}}
export default function Page(){return <AcquisitionPageView page={page}/>}
