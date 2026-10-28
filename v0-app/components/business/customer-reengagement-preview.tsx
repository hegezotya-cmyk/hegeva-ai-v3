"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { Locale } from "@/lib/i18n/dictionaries"
import { customerReengagementCopy } from "@/lib/i18n/customer-reengagement-copy"

export function CustomerReengagementPreview({ customer, identity, locale, onClose }: {
  customer: { id: string; title: string }; identity: string; locale: Locale; onClose: () => void
}) {
  const copy = customerReengagementCopy[locale]
  const headingId = useId()
  const [text, setText] = useState(() => copy.template(customer.title))
  const [status, setStatus] = useState<"copied" | "error" | null>(null)
  const [copying, setCopying] = useState(false)
  const generation = useRef(0)
  const revision = useRef(0)
  const editor = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    generation.current++
    editor.current?.focus()
    return () => { generation.current++ }
  }, [identity, customer.id])

  async function copyText() {
    const current = generation.current
    const copiedRevision = revision.current
    setStatus(null)
    setCopying(true)
    try {
      await navigator.clipboard.writeText(text)
      if (generation.current === current && revision.current === copiedRevision) setStatus("copied")
    } catch {
      if (generation.current === current && revision.current === copiedRevision) setStatus("error")
    } finally {
      if (generation.current === current) setCopying(false)
    }
  }

  return <section aria-labelledby={headingId} className="glass-panel mt-4 rounded-2xl border border-primary/30 p-5">
    <h2 id={headingId} className="font-semibold">{copy.preview}</h2>
    <p className="mt-2 break-words text-sm text-muted-foreground">{customer.title}</p>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy.boundary}</p>
    <label className="mt-4 block text-sm">{copy.message}
      <textarea ref={editor} value={text} onChange={event => { revision.current++; setText(event.target.value); setStatus(null) }} rows={8} className="mt-2 w-full resize-y rounded-xl border border-border bg-input/30 p-3 text-sm" />
    </label>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={copying} onClick={copyText} className="min-h-11 rounded-xl border border-primary/40 px-4 text-sm text-primary disabled:opacity-50">{copy.copy}</button>
      <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-4 text-sm">{copy.close}</button>
    </div>
    <p role="status" className="mt-2 text-sm">{status === "copied" ? copy.copied : status === "error" ? copy.copyFailed : ""}</p>
  </section>
}
