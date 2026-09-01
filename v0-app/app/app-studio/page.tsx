"use client"

import Link from "next/link"
import { ArrowRight, Braces, CheckCircle2, Hammer, Megaphone, Rocket, Sparkles, Video, Wrench } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"
import { AICore } from "@/components/visual-engine"

const x20Copy = {
  en: ["Build My App X20", "Pro beta: verified app builds, resumable project state and one-click AI improvement passes."],
  hu: ["Build My App X20", "Pro béta: ellenőrzött appépítés, folytatható projektállapot és egykattintásos AI-fejlesztések."],
  de: ["Build My App X20", "Pro-Beta: geprüfte App-Builds, fortsetzbarer Projektstatus und KI-Verbesserungen mit einem Klick."],
  fr: ["Build My App X20", "Bêta Pro : builds vérifiés, projet reprenable et améliorations IA en un clic."],
  es: ["Build My App X20", "Beta Pro: builds verificados, proyecto reanudable y mejoras de IA con un clic."],
} as const

export default function AppStudioPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AppStudioHubHeader />
        <StudioWorkflow />
      </div>
    </AppShell>
  )
}

function StudioWorkflow(){
 const {t,locale}=useI18n();const c=getStudioCopy(locale)
 const stages=[
  {number:"01",label:"REQUEST",icon:Sparkles,title:t.studio.prompt,desc:t.studio.promptDesc,href:"/app-studio/prompt-my-app"},
  {number:"02",label:"SPEC + BUILD",icon:Hammer,title:t.studio.build,desc:t.studio.buildDesc,href:"/app-studio/build-my-app"},
  {number:"03",label:"VERIFY + REPAIR",icon:Wrench,title:t.studio.fix,desc:t.studio.fixDesc,href:"/app-studio/fix-my-app"},
 ]
 return <div className="studio-workflow mt-9"><div className="studio-process"><header><p>HEGEVA engineering flow</p><span>REQUEST → SPEC → BUILD → VERIFY → RESULT</span></header>{stages.map(({number,label,icon:Icon,title,desc,href})=><Link href={href} key={number}><span>{number}</span><div><small>{label}</small><h2>{title}</h2><p>{desc}</p></div><Icon aria-hidden/><ArrowRight className="studio-arrow" aria-hidden/></Link>)}<Link href="/app-studio/advertising"><span>04</span><div><small>CAMPAIGN</small><h2>Advertising Studio</h2><p>Prepare, save and review bounded campaign briefs.</p></div><Megaphone aria-hidden/><ArrowRight className="studio-arrow" aria-hidden/></Link><Link href="/app-studio/video-ad-studio"><span>05</span><div><small>STORYBOARD</small><h2>Video Ad Studio</h2><p>Build a production-ready video specification.</p></div><Video aria-hidden/><ArrowRight className="studio-arrow" aria-hidden/></Link></div><aside><X20Card/><Link href="/app-studio/x30-alpha" className="x30-alpha-entry"><div><Braces aria-hidden/><span>INTERNAL ALPHA</span></div><h2>X30 structured rendering</h2><p>Inspect the safe schema, domain direction and deterministic renderer that demonstrate HEGEVA’s next generation.</p><span>{c.open}<ArrowRight aria-hidden/></span></Link></aside></div>
}

function X20Card() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  const [title, desc] = x20Copy[locale]
  return (
    <Link href="/app-studio/build-my-app-x20" className="x20-studio-entry group">
      <div className="flex items-center justify-between">
        <span className="flex size-12 items-center justify-center border border-primary/25 bg-primary/10 text-primary">
          <Rocket className="size-6" aria-hidden />
        </span>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">PRO · BETA</span>
      </div>
      <div className="flex-1">
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
        {c.open}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}

function AppStudioHubHeader() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  return (
    <section className="studio-crown"><div><p>HEGEVA / CREATION SYSTEM</p><h1>{c.hubTitle}</h1><span>{c.hubSub}</span><Link href="/app-studio/prompt-my-app" className="hegeva-primary mt-7 inline-flex min-h-12 items-center gap-2 px-6 text-sm font-semibold">{c.start}<ArrowRight className="size-4" aria-hidden /></Link></div><div className="studio-core-object" aria-hidden><i/><i/><i/><AICore state="planning"/><small>REQUEST → RESULT</small></div></section>
  )
}
