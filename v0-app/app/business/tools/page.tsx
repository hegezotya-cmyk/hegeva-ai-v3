"use client"

import { useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/provider"
import { TOOLS_COPY } from "@/lib/i18n/tools-copy"

const currencies = { GBP:"£", EUR:"€", USD:"$", HUF:"Ft" } as const
type Currency = keyof typeof currencies
const num = (value:string) => { const result=Number(value); return Number.isFinite(result) ? result : 0 }

function NumberField({label,value,onChange,suffix}:{label:string;value:string;onChange:(value:string)=>void;suffix?:string}) {
 return <label className="text-sm font-medium text-foreground">{label}<div className="relative mt-2"><input type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(event)=>onChange(event.target.value)} className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 pr-12 outline-none focus:border-primary/50"/>{suffix&&<span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}</div></label>
}

function Result({label,value,highlight=false}:{label:string;value:string;highlight?:boolean}) {
 return <div className={highlight?"rounded-xl border border-primary/30 bg-primary/10 p-4":"rounded-xl border border-border bg-background/30 p-4"}><p className="text-xs text-muted-foreground">{label}</p><p className={highlight?"mt-1 text-xl font-bold text-primary":"mt-1 text-lg font-semibold"}>{value}</p></div>
}

export default function BusinessToolsPage() {
 const {locale}=useI18n(); const c=TOOLS_COPY[locale]
 const [currency,setCurrency]=useState<Currency>("GBP")
 const [revenue,setRevenue]=useState("1000"); const [costs,setCosts]=useState("650")
 const [unitCost,setUnitCost]=useState("10"); const [targetMargin,setTargetMargin]=useState("30")
 const [net,setNet]=useState("100"); const [vatRate,setVatRate]=useState("20")
 const [fixed,setFixed]=useState("1000"); const [variable,setVariable]=useState("8"); const [price,setPrice]=useState("15")
 const symbol=currencies[currency]
 const money=(value:number)=>`${symbol}${value.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2})}`
 const results=useMemo(()=>{
   const r=num(revenue), co=num(costs), p=r-co, uc=num(unitCost), tm=num(targetMargin), n=num(net), vr=num(vatRate), f=num(fixed), v=num(variable), sp=num(price)
   const targetPrice=tm>=100?null:uc/(1-tm/100); const contribution=sp-v
   return {profit:p, margin:r>0?(p/r)*100:0, targetPrice, unitProfit:targetPrice===null?null:targetPrice-uc, vat:n*vr/100, gross:n*(1+vr/100), units:contribution>0?Math.ceil(f/contribution):null}
 },[revenue,costs,unitCost,targetMargin,net,vatRate,fixed,variable,price])
 return <AppShell><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
   <div className="flex flex-wrap items-end justify-between gap-4"><PageHeader eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}/><label className="text-sm font-medium">{c.currency}<select value={currency} onChange={(e)=>setCurrency(e.target.value as Currency)} className="ml-3 rounded-xl border border-input bg-background px-3 py-2">{Object.keys(currencies).map((code)=><option key={code}>{code}</option>)}</select></label></div>
   <div className="mt-8 grid gap-5 lg:grid-cols-2">
    <section className="glass-panel rounded-3xl p-6"><h2 className="text-xl font-semibold">{c.profitTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{c.profitDesc}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><NumberField label={c.revenue} value={revenue} onChange={setRevenue}/><NumberField label={c.costs} value={costs} onChange={setCosts}/><Result label={c.profit} value={money(results.profit)} highlight/><Result label={c.margin} value={`${results.margin.toFixed(1)}%`}/></div></section>
    <section className="glass-panel rounded-3xl p-6"><h2 className="text-xl font-semibold">{c.pricingTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{c.pricingDesc}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><NumberField label={c.unitCost} value={unitCost} onChange={setUnitCost}/><NumberField label={c.targetMargin} value={targetMargin} onChange={setTargetMargin} suffix="%"/><Result label={c.sellingPrice} value={results.targetPrice===null?c.invalid:money(results.targetPrice)} highlight/><Result label={c.unitProfit} value={results.unitProfit===null?"—":money(results.unitProfit)}/></div></section>
    <section className="glass-panel rounded-3xl p-6"><h2 className="text-xl font-semibold">{c.vatTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{c.vatDesc}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><NumberField label={c.net} value={net} onChange={setNet}/><NumberField label={c.vatRate} value={vatRate} onChange={setVatRate} suffix="%"/><Result label={c.vat} value={money(results.vat)}/><Result label={c.gross} value={money(results.gross)} highlight/></div></section>
    <section className="glass-panel rounded-3xl p-6"><h2 className="text-xl font-semibold">{c.breakEvenTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{c.breakEvenDesc}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><NumberField label={c.fixedCosts} value={fixed} onChange={setFixed}/><NumberField label={c.variableCost} value={variable} onChange={setVariable}/><NumberField label={c.price} value={price} onChange={setPrice}/><Result label={c.units} value={results.units===null?c.invalid:results.units.toLocaleString(locale)} highlight/></div></section>
   </div>
   <p className="mt-6 rounded-2xl border border-border bg-card/60 p-4 text-xs leading-6 text-muted-foreground">{c.note}</p>
 </main></AppShell>
}
