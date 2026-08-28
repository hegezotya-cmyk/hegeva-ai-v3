import Link from "next/link"
import { ArrowLeft, ArrowRight, Braces, CheckCircle2, FlaskConical, Layers3, Palette, ShieldCheck } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { SafeX30Renderer } from "@/components/x30/safe-renderer"
import { pawflowX30Fixture } from "@/lib/x30/fixtures"
import { evaluateVisualQuality } from "@/lib/visual-quality"

export default function X30AlphaPage(){
 const qualityFindings=evaluateVisualQuality({cardCount:2,repeatedLayouts:1,maxRadiusCount:4,hasHierarchy:true,hasMobileRules:true,hasFocusStyles:true,semanticAccentCount:2,hasFocalPoint:true,hasPrimaryAction:true,typographyLevels:4,overflowRisk:false})
 return <AppShell><main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
  <section className="x30-crown"><div><Link href="/app-studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/>App Studio</Link><p>HEGEVA / NEXT GENERATION RUNTIME</p><h1>X30 <span>Alpha</span></h1><b>STRUCTURED. SAFE. DOMAIN-AWARE.</b><small>A deterministic proof that HEGEVA can turn a structured app specification into a distinctive interface without executing generated code.</small></div><div className="x30-core-object" aria-hidden><i/><i/><i/><Layers3/></div></section>
  <section className="x30-pipeline" aria-label="X30 rendering architecture">{[[Braces,"Structured spec","Version 0.1"],[Palette,"Domain direction","Layout + visual rhythm"],[Layers3,"Component registry","Allowlisted components"],[ShieldCheck,"Safe renderer","No generated code"],[CheckCircle2,"Visual result",`${qualityFindings.length} quality findings`]].map(([Icon,title,detail],index)=><div key={String(title)}><span>{String(index+1).padStart(2,"0")}</span><Icon aria-hidden/><b>{String(title)}</b><small>{String(detail)}</small>{index<4&&<ArrowRight aria-hidden/>}</div>)}</section>
  <section className="mt-8"><div className="mb-3 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Deterministic fixture</p><h2 className="mt-1 text-lg font-semibold">Pet grooming · warm booking-led direction</h2></div><span className="hidden items-center gap-2 rounded-full border border-violet/25 bg-violet/10 px-3 py-1.5 text-xs text-violet sm:inline-flex"><FlaskConical className="size-3.5"/>Not a public builder</span></div><SafeX30Renderer spec={pawflowX30Fixture}/></section>
 </main></AppShell>
}
