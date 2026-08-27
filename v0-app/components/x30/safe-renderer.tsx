import { CalendarDays, ChevronRight, PawPrint, Scissors, Sparkles } from "lucide-react"
import { validateX30Spec, type X30AppSpec, type X30Node } from "@/lib/x30/schema"

export type X30RendererCopy = {
  preview: string
  rejected: string
  schedule: string
  previewAction: string
}

const text = (value: unknown, fallback = "") => typeof value === "string" ? value.slice(0, 180) : fallback
const items = (value: unknown) => Array.isArray(value) ? value.slice(0, 8).filter((item) => item && typeof item === "object") as Record<string, unknown>[] : []

function Node({ node, copy }: { node: X30Node; copy: X30RendererCopy }) {
  const props = node.props
  if (node.type === "hero") return <section className="x30-hero"><div><p>{text(props.eyebrow)}</p><h2>{text(props.title)}</h2><span>{text(props.description)}</span></div><span className="x30-mark"><PawPrint aria-hidden /></span></section>
  if (node.type === "metric") return <section className="x30-metric"><p>{text(props.label)}</p><strong>{text(props.value)}</strong><span>{text(props.detail)}</span></section>
  if (node.type === "schedule") return <section className="x30-schedule"><header><div><p>{copy.schedule}</p><h3>{text(props.title)}</h3></div><CalendarDays aria-hidden /></header><div>{items(props.items).map((item, index) => <article key={`${node.id}-${index}`}><time>{text(item.time)}</time><div><strong>{text(item.pet)}</strong><span>{text(item.breed)} · {text(item.service)}</span></div><b>{text(item.price)}</b></article>)}</div></section>
  if (node.type === "pet-list") return <section className="x30-list"><header><PawPrint aria-hidden /><h3>{text(props.title)}</h3></header>{items(props.items).map((item, index) => <article key={`${node.id}-${index}`}><span className="x30-avatar">{text(item.name, "P").slice(0, 1)}</span><div><strong>{text(item.name)}</strong><small>{text(item.detail)}</small><small>{text(item.owner)}</small></div></article>)}</section>
  if (node.type === "service-list") return <section className="x30-list"><header><Scissors aria-hidden /><h3>{text(props.title)}</h3></header>{items(props.items).map((item, index) => <article key={`${node.id}-${index}`}><div><strong>{text(item.name)}</strong></div><b>{text(item.price)}</b></article>)}</section>
  return <div className="x30-action" aria-label={copy.previewAction}><span><strong>{text(props.label)}</strong><small>{text(props.hint)}</small></span><ChevronRight aria-hidden /></div>
}

export function SafeX30Renderer({ spec, copy }: { spec: unknown; copy: X30RendererCopy }) {
  const result = validateX30Spec(spec)
  if (!result.ok) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><strong>{copy.rejected}</strong><ul className="mt-2 list-disc pl-5">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>
  const safe = result.spec as X30AppSpec
  const metrics = safe.nodes.filter((node) => node.type === "metric")
  const hero = safe.nodes.find((node) => node.type === "hero")
  const schedule = safe.nodes.find((node) => node.type === "schedule")
  const supporting = safe.nodes.filter((node) => node.type === "pet-list" || node.type === "service-list" || node.type === "action")
  return <div className="x30-app" data-x30-version={safe.version}><nav><div><Sparkles aria-hidden /><strong>{safe.name}</strong></div><span>{copy.preview}</span></nav>{hero && <Node node={hero} copy={copy} />}<div className="x30-metrics">{metrics.map((node) => <Node key={node.id} node={node} copy={copy} />)}</div><main>{schedule && <Node node={schedule} copy={copy} />}<aside>{supporting.map((node) => <Node key={node.id} node={node} copy={copy} />)}</aside></main></div>
}
