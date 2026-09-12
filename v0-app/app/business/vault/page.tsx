"use client"

import { FormEvent, useMemo, useState } from "react"
import { Copy, Search, Trash2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { VAULT_COPY } from "@/lib/i18n/vault-copy"

type Template={id:string;title:string;category:string;content:string;createdAt:string;updatedAt:string}

export default function VaultPage(){
 const {locale}=useI18n();const c=VAULT_COPY[locale]
 const {items,setItems,syncState}=useWorkspaceData<Template>("vault_templates")
 const [query,setQuery]=useState("");const [copied,setCopied]=useState<string|null>(null)
 const filtered=useMemo(()=>{const q=query.trim().toLocaleLowerCase();return q?items.filter((item)=>[item.title,item.category,item.content].some((value)=>value.toLocaleLowerCase().includes(q))):items},[items,query])
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const data=new FormData(form);const title=String(data.get("title")||"").trim();const category=String(data.get("category")||"").trim();const content=String(data.get("content")||"").trim();if(!title||!content)return;const now=new Date().toISOString();setItems((current)=>[{id:crypto.randomUUID(),title:title.slice(0,120),category:category.slice(0,80),content:content.slice(0,8000),createdAt:now,updatedAt:now},...current].slice(0,200));form.reset()}
 async function copy(item:Template){try{await navigator.clipboard.writeText(item.content);setCopied(item.id);window.setTimeout(()=>setCopied(null),1600)}catch{}}
 const syncText=syncState==="cloud"?c.cloud:syncState==="saving"?c.saving:syncState==="error"?c.syncError:c.local
 return <AppShell><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
  <PageHeader eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}/>
  <p className="mt-6 rounded-xl border border-border bg-card/60 p-3 text-xs text-muted-foreground">{syncText}</p>
  <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
   <form onSubmit={submit} className="glass-panel h-fit space-y-4 rounded-3xl p-6">
    <h2 className="text-lg font-semibold">{c.add}</h2>
    <label className="block text-sm font-medium">{c.templateTitle}<input name="title" required maxLength={120} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 outline-none focus:border-primary/50"/></label>
    <label className="block text-sm font-medium">{c.category}<input name="category" maxLength={80} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 outline-none focus:border-primary/50"/></label>
    <label className="block text-sm font-medium">{c.content}<textarea name="content" required maxLength={8000} rows={10} className="mt-2 w-full resize-y rounded-xl border border-input bg-input/30 px-3.5 py-3 outline-none focus:border-primary/50"/></label>
    <button className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{c.save}</button>
   </form>
   <section>
    <label className="relative block"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={c.search} className="w-full rounded-xl border border-input bg-card/70 py-3 pl-11 pr-4 outline-none focus:border-primary/50"/></label>
    <div className="mt-4 space-y-4">
     {filtered.length===0&&<div className="glass-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">{c.empty}</div>}
     {filtered.map((item)=><article key={item.id} className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{item.title}</h2>{item.category&&<p className="mt-1 text-xs text-primary">{item.category}</p>}</div><div className="flex gap-2"><button type="button" onClick={()=>void copy(item)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"><Copy className="size-3.5"/>{copied===item.id?c.copied:c.copy}</button><button type="button" aria-label={c.remove} title={c.remove} onClick={()=>setItems((current)=>current.filter((entry)=>entry.id!==item.id))} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4"/></button></div></div>
      <p className="mt-4 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl bg-background/40 p-4 text-sm leading-7 text-foreground">{item.content}</p>
     </article>)}
    </div>
   </section>
  </div>
  <p className="mt-6 text-xs leading-6 text-muted-foreground">{c.note}</p>
 </main></AppShell>
}
