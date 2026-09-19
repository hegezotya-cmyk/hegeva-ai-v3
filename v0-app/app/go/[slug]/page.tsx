import { redirect } from "next/navigation"

type DistributionPageProps = {
  params: Promise<{ slug: string }>
}

const routes: Record<string, string> = {
  "li-challenge": "/challenge?utm_source=linkedin&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_challenge",
  "li-consultants": "/for-consultants?utm_source=linkedin&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_consultants",
  "fb-small-business": "/free-tools?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_free_tools",
  "fb-electricians": "/for-electricians?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_electricians",
  "fb-builders": "/for-builders?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_builders",
  "fb-plumbers": "/for-plumbers?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_plumbers",
  "fb-cleaners": "/for-cleaners?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_cleaners",
  "fb-property": "/for-property-maintenance?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_property",
  "ig-challenge": "/challenge?utm_source=instagram&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_challenge",
  "tt-challenge": "/challenge?utm_source=tiktok&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_challenge",
  "yt-challenge": "/challenge?utm_source=youtube&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_challenge",
  "sc-challenge": "/challenge?utm_source=snapchat&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_challenge",
  "reddit-free-tools": "/free-tools?utm_source=reddit&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=v2_free_tools",
  "li-v1": "/challenge?utm_source=linkedin&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_1",
  "li-v2": "/challenge?utm_source=linkedin&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_2",
  "li-v3": "/challenge?utm_source=linkedin&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_3",
  "fb-v1": "/challenge?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_1",
  "fb-v2": "/challenge?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_2",
  "fb-v3": "/challenge?utm_source=facebook&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_3",
  "ig-v1": "/challenge?utm_source=instagram&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_1",
  "ig-v2": "/challenge?utm_source=instagram&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_2",
  "ig-v3": "/challenge?utm_source=instagram&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_3",
  "tt-v1": "/challenge?utm_source=tiktok&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_1",
  "tt-v2": "/challenge?utm_source=tiktok&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_2",
  "tt-v3": "/challenge?utm_source=tiktok&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_3",
  "yt-v1": "/challenge?utm_source=youtube&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_1",
  "yt-v2": "/challenge?utm_source=youtube&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_2",
  "yt-v3": "/challenge?utm_source=youtube&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_3",
  "sc-v1": "/challenge?utm_source=snapchat&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_1",
  "sc-v2": "/challenge?utm_source=snapchat&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_2",
  "sc-v3": "/challenge?utm_source=snapchat&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=video_3",
}

export default async function DistributionRedirect({ params }: DistributionPageProps) {
  const { slug } = await params
  redirect(routes[slug] || "/challenge")
}
