"use client"

import Link from "next/link"
import { useState } from "react"
import { Copy, Check, FileCode2, Sparkles, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buildLocalizedSpecification, getStudioCopy } from "@/lib/i18n/studio-copy"

const APP_STUDIO_HANDOFF_KEY = "hegeva:app-studio:prompt-to-build"

/**
 * Prompt My App — structures a raw idea into a professional specification.
 * Runs fully client-side (deterministic). It does NOT claim AI generation happened;
 * HEGEVA AI enhancement is clearly labelled as the next, separate step.
 */
export function PromptMyApp() {
  const { t, locale } = useI18n()
  const c = getStudioCopy(locale)
  const [idea, setIdea] = useState("")
  const [appTypeIndex, setAppTypeIndex] = useState(0)
  const [audienceIndex, setAudienceIndex] = useState(0)
  const [spec, setSpec] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function buildSpec() {
    const trimmed = idea.trim()
    if (!trimmed) return
    const appType = c.types[appTypeIndex]
    const audience = c.audiences[audienceIndex]
    setSpec(buildLocalizedSpecification(locale, appType, audience, trimmed))
  }

  async function copySpec() {
    if (!spec) return
    await navigator.clipboard.writeText(spec)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function saveBuildHandoff() {
    if (!spec) return
    try {
      sessionStorage.setItem(
        APP_STUDIO_HANDOFF_KEY,
        JSON.stringify({
          idea: idea.trim(),
          specification: spec,
          appType: c.types[appTypeIndex],
          audience: c.audiences[audienceIndex],
          locale,
          createdAt: Date.now(),
        }),
      )
    } catch {
      // Navigation must still work if browser storage is unavailable.
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="HEGEVA App Studio"
        title={t.studio.prompt}
        subtitle={t.studio.promptDesc}
        action={<StatusBadge status="beta" />}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">{c.prompt.describe}</h2>
          </div>

          <label htmlFor="idea" className="mt-4 block text-xs font-medium text-muted-foreground">
            {c.prompt.idea}
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={5}
            placeholder={c.prompt.placeholder}
            className="mt-1.5 w-full resize-y rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="apptype" className="block text-xs font-medium text-muted-foreground">
                {c.prompt.type}
              </label>
              <select
                id="apptype"
                value={appTypeIndex}
                onChange={(e) => setAppTypeIndex(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-input bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                {c.types.map((a, index) => (
                  <option key={a} value={index} className="bg-popover text-popover-foreground">
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audience" className="block text-xs font-medium text-muted-foreground">
                {c.prompt.audience}
              </label>
              <select
                id="audience"
                value={audienceIndex}
                onChange={(e) => setAudienceIndex(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-input bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                {c.audiences.map((a, index) => (
                  <option key={a} value={index} className="bg-popover text-popover-foreground">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={buildSpec}
            disabled={!idea.trim()}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <FileCode2 className="size-4" aria-hidden />
            {c.prompt.generate}
          </button>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-cyan/25 bg-cyan/8 p-3">
            <Info className="mt-0.5 size-3.5 shrink-0 text-cyan" aria-hidden />
            <p className="text-xs leading-relaxed text-foreground/75 text-pretty">
              {c.prompt.info}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">{c.prompt.spec}</h2>
            </div>
            {spec && (
              <button
                type="button"
                onClick={copySpec}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-input/30 px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {copied ? <Check className="size-3.5 text-primary" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                {copied ? c.prompt.copied : c.prompt.copy}
              </button>
            )}
          </div>

          {spec ? (
            <pre className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-border bg-background/50 p-4 font-mono text-xs leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {spec}
            </pre>
          ) : (
            <div className="mt-4 flex min-h-[20rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/30 px-6 text-center">
              <span className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/8 text-primary">
                <FileCode2 className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-foreground">{c.prompt.empty}</p>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground text-pretty">
                {c.prompt.emptyBody}
              </p>
            </div>
          )}

          {spec && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/app-studio/build-my-app"
                onClick={saveBuildHandoff}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                {c.prompt.continue}
                <StatusBadge status="beta" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
