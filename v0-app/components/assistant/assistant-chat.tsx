"use client"

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Check, Copy, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { AICore, IntelligenceCard, SkeletonSurface } from "@/components/visual-engine"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type PlanStatus = {
  plan: string
  aiMessages: number
  aiLimit: number
  period: string
}

type SupportedLanguage = "en" | "hu" | "de" | "fr" | "es"

function detectMessageLanguage(message: string, fallback: SupportedLanguage): SupportedLanguage {
  const text = message.toLocaleLowerCase()

  if (/[őűáéíóöü]/u.test(text) || /\b(mit|hogy|vagy|tudunk|csinálni|csinalni|mondj|kérek|kerem|üzleti|uzleti|magyarul|segíts|segits)\b/u.test(text)) return "hu"
  if (/[äöüß]/u.test(text) || /\b(und|oder|bitte|heute|geschäft|geschaft|ideen|hilf)\b/u.test(text)) return "de"
  if (/[àâçéèêëîïôûùüÿœ]/u.test(text) || /\b(et|avec|pour|bonjour|idées|idees|entreprise|aide)\b/u.test(text)) return "fr"
  if (/[áéíñóúü¿¡]/u.test(text) || /\b(y|para|hola|ideas|negocio|ayuda|puedes|quiero)\b/u.test(text)) return "es"
  if (/\b(the|and|please|business|help|how|what|today|ideas)\b/u.test(text)) return "en"

  return fallback
}

export function AssistantChat() {
  const { locale, t } = useI18n()
  const { data: session, isPending } = authClient.useSession()
  const { items: messages, setItems: setMessages, syncState } = useWorkspaceData<ChatMessage>("assistant_history")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [usage, setUsage] = useState<PlanStatus | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const recentHistory = useMemo(
    () => messages.slice(-10),
    [messages]
  )

  const loadUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/plan/status", {
        credentials: "include",
      })
      const data = await response.json().catch(() => null)

      if (response.ok && data) {
        setUsage({
          plan: typeof data.plan === "string" ? data.plan : "basic",
          aiMessages: Number(data.aiMessages) || 0,
          aiLimit: Number(data.aiLimit) || 0,
          period: typeof data.period === "string" ? data.period : "",
        })
      }
    } catch {
      // Chat remains usable when optional plan status is temporarily unavailable.
    }
  }, [])

  useEffect(() => {
    if (session?.user) void loadUsage()
  }, [loadUsage, session?.user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, sending])

  async function copyAnswer(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      window.setTimeout(() => setCopiedIndex(null), 1800)
    } catch {
      setError(t.assistant.copyError)
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanMessage = message.trim()
    if (!cleanMessage || sending) return

    setError("")
    setSending(true)
    setMessage("")
    setMessages((current) => [
      ...current,
      { role: "user", content: cleanMessage } as ChatMessage,
    ].slice(-100))

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
          history: recentHistory,
          language: detectMessageLanguage(cleanMessage, locale),
          mode: "general",
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error || t.assistant.unavailable
        )
      }

      const answer =
        typeof data?.response === "string"
          ? data.response.trim()
          : ""

      if (!answer) {
        throw new Error(t.assistant.emptyResponse)
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer } as ChatMessage,
      ].slice(-100))
      await loadUsage()
    } catch (requestError) {
      setError(
        controller.signal.aborted
          ? t.assistant.unavailable
          : requestError instanceof Error
            ? requestError.message
            : t.assistant.unavailable
      )
    } finally {
      window.clearTimeout(timeout)
      setSending(false)
    }
  }

  if (isPending) {
    return <SkeletonSurface lines={4} className="min-h-52" />
  }

  if (!session?.user) {
    return (
      <IntelligenceCard tone="violet" className="p-8">
        <h2 className="text-2xl font-semibold">{t.assistant.signInTitle}</h2>
        <p className="mt-3 text-muted-foreground">
          {t.assistant.signInBody}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground shadow-[0_14px_36px_-18px_rgba(60,220,160,.75)] transition hover:-translate-y-0.5 hover:bg-primary/90"
        >
          {t.assistant.goLogin}
        </Link>
      </IntelligenceCard>
    )
  }

  return (
    <div className="ve-panel relative overflow-hidden rounded-[2rem] shadow-[0_30px_90px_-46px_rgba(0,0,0,.95)]">
      <span className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -left-16 top-40 h-52 w-52 rounded-full bg-violet/8 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />

      <div className="relative border-b border-border/70 bg-white/[0.015] px-5 py-4 backdrop-blur-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AICore state="active" className="scale-90" />
            <div>
              <p className="text-sm font-medium text-foreground/90">
                {t.assistant.signedIn} <span className="text-muted-foreground">{session.user.email}</span>
              </p>
              {usage && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)} {t.assistant.plan} · {usage.aiMessages} / {usage.aiLimit} {t.assistant.messagesMonth}
                </p>
              )}
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex size-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(80,220,160,.8)]" aria-hidden />
                {syncState === "saving" ? t.assistant.saving : syncState === "cloud" ? t.assistant.synced : syncState === "error" ? t.assistant.syncError : t.assistant.loading}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([])
                setError("")
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/35 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/8 hover:text-foreground"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {t.assistant.clear}
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-[420px] space-y-5 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.025),transparent_34%)] p-5 sm:p-6">
        {messages.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-cyan/20 bg-gradient-to-br from-cyan/[0.055] via-white/[0.018] to-violet/[0.04] p-7 text-muted-foreground">
            <span className="pointer-events-none absolute right-5 top-1/2 size-24 -translate-y-1/2 rounded-full border border-cyan/10" aria-hidden />
            <span className="pointer-events-none absolute right-9 top-1/2 size-16 -translate-y-1/2 rounded-full border border-violet/10" aria-hidden />
            <div className="relative max-w-xl text-sm leading-6">{t.assistant.empty}</div>
          </div>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={
                item.role === "user"
                  ? "ml-auto max-w-[85%] rounded-3xl rounded-br-lg border border-primary/25 bg-gradient-to-br from-primary/95 to-emerald/80 px-4 py-3 text-primary-foreground shadow-[0_16px_34px_-22px_rgba(60,220,160,.75)]"
                  : "group relative mr-auto max-w-[90%] rounded-3xl rounded-bl-lg border border-white/8 bg-gradient-to-br from-white/[0.055] via-muted/70 to-violet/[0.045] px-4 py-3 pr-11 text-foreground shadow-[0_16px_36px_-26px_rgba(0,0,0,.9)] backdrop-blur-sm"
              }
            >
              {item.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
              ) : (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                      p: (props) => <p className="mb-3 text-sm leading-6 last:mb-0" {...props} />,
                      strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                      ul: (props) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm last:mb-0" {...props} />,
                      ol: (props) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm last:mb-0" {...props} />,
                      li: (props) => <li className="leading-6" {...props} />,
                      code: (props) => <code className="rounded bg-background/70 px-1.5 py-0.5 text-[0.85em]" {...props} />,
                      a: (props) => <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />,
                      blockquote: (props) => <blockquote className="my-3 border-l-2 border-primary/50 pl-3 text-muted-foreground" {...props} />,
                    }}
                  >
                    {item.content}
                  </ReactMarkdown>
                  <button
                    type="button"
                    onClick={() => void copyAnswer(item.content, index)}
                    aria-label={t.assistant.copy}
                    title={t.assistant.copy}
                    className="absolute right-2 top-2 rounded-xl border border-transparent p-2 text-muted-foreground opacity-70 transition hover:border-white/8 hover:bg-background/70 hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  >
                    {copiedIndex === index ? <Check className="size-4 text-primary" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  </button>
                </>
              )}
            </div>
          ))
        )}

        {sending && (
          <div className="mr-auto flex max-w-[90%] items-center gap-3 rounded-3xl rounded-bl-lg border border-violet/25 bg-gradient-to-r from-violet/10 via-cyan/[0.05] to-transparent px-4 py-3 text-sm text-muted-foreground shadow-[0_16px_34px_-26px_rgba(120,80,255,.65)]" role="status" aria-live="polite">
            <AICore state="thinking" className="scale-75" />
            <span>{t.assistant.thinking}</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={submit}
        className="relative border-t border-border/70 bg-background/45 p-4 backdrop-blur-md sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            maxLength={2500}
            rows={3}
            placeholder={t.assistant.placeholder}
            className="min-h-24 flex-1 resize-none rounded-3xl border border-input/80 bg-black/10 px-4 py-3 text-sm shadow-inner outline-none ring-offset-background transition placeholder:text-muted-foreground/70 focus:border-cyan/35 focus:bg-background/70 focus:ring-2 focus:ring-cyan/20"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="min-h-11 w-full self-end rounded-2xl bg-gradient-to-r from-primary to-cyan px-5 py-3 font-semibold text-primary-foreground shadow-[0_16px_36px_-18px_rgba(60,220,180,.78)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
          >
            {sending ? t.assistant.sending : t.assistant.send}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t.assistant.hint}
        </p>
      </form>
    </div>
  )
}
