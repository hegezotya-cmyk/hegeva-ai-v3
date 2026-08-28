import { CalendarDays, ChevronRight, PawPrint, Scissors, Sparkles } from "lucide-react"
import { validateX30Spec, type X30AppSpec, type X30Node } from "@/lib/x30/schema"

const text=(value:unknown,fallback="")=>typeof value==="string"?value.slice(0,180):fallback
const items=(value:unknown)=>Array.isArray(value)?value.slice(0,8).filter((item)=>item&&typeof item==="object") as Record<string,unknown>[]:[]

function Node({node}:{node:X30Node}){
 const p=node.props
 if(node.type==="hero") return <section className="x30-hero"><div><p>{text(p.eyebrow)}</p><h2>{text(p.title)}</h2><span>{text(p.description)}</span></div><span className="x30-mark"><PawPrint aria-hidden/></span></section>
 if(node.type==="metric") return <section className="x30-metric"><p>{text(p.label)}</p><strong>{text(p.value)}</strong><span>{text(p.detail)}</span></section>
 if(node.type==="schedule") return <section className="x30-schedule"><header><div><p>Schedule</p><h3>{text(p.title)}</h3></div><CalendarDays aria-hidden/></header><div>{items(p.items).map((item,index)=><article key={index}><time>{text(item.time)}</time><div><strong>{text(item.pet)}</strong><span>{text(item.breed)} · {text(item.service)}</span></div><b>{text(item.price)}</b></article>)}</div></section>
 if(node.type==="pet-list") return <section className="x30-list"><header><PawPrint aria-hidden/><h3>{text(p.title)}</h3></header>{items(p.items).map((item,index)=><article key={index}><span className="x30-avatar">{text(item.name,"P").slice(0,1)}</span><div><strong>{text(item.name)}</strong><small>{text(item.detail)}</small><small>{text(item.owner)}</small></div></article>)}</section>
 if(node.type==="service-list") return <section className="x30-list"><header><Scissors aria-hidden/><h3>{text(p.title)}</h3></header>{items(p.items).map((item,index)=><article key={index}><div><strong>{text(item.name)}</strong></div><b>{text(item.price)}</b></article>)}</section>
 return <button type="button" className="x30-action"><span><strong>{text(p.label)}</strong><small>{text(p.hint)}</small></span><ChevronRight aria-hidden/></button>
}

export function SafeX30Renderer({spec}:{spec:unknown}){
 const result=validateX30Spec(spec)
 if(!result.ok) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><strong>Preview rejected.</strong><ul className="mt-2 list-disc pl-5">{result.errors.map(error=><li key={error}>{error}</li>)}</ul></div>
 const safe=result.spec as X30AppSpec
 const metrics=safe.nodes.filter(node=>node.type==="metric")
 const hero=safe.nodes.find(node=>node.type==="hero")
 const schedule=safe.nodes.find(node=>node.type==="schedule")
 const supporting=safe.nodes.filter(node=>node.type==="pet-list"||node.type==="service-list"||node.type==="action")
 return <div className="x30-app" data-x30-version={safe.version}><nav><div><Sparkles aria-hidden/><strong>{safe.name}</strong></div><span>X30 structured preview</span></nav>{hero&&<Node node={hero}/>}<div className="x30-metrics">{metrics.map(node=><Node key={node.id} node={node}/>)}</div><main>{schedule&&<Node node={schedule}/>}<aside>{supporting.map(node=><Node key={node.id} node={node}/>)}</aside></main></div>
}
