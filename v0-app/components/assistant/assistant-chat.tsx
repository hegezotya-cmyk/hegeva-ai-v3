"use client"

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Check, Copy, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"

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
  const { locale } = useI18n()
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
      setError("The answer could not be copied.")
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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
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
          data?.error || "HEGEVA AI is temporarily unavailable."
        )
      }

      const answer =
        typeof data?.response === "string"
          ? data.response.trim()
          : ""

      if (!answer) {
        throw new Error("HEGEVA AI returned an empty response.")
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer } as ChatMessage,
      ].slice(-100))
      await loadUsage()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "HEGEVA AI is temporarily unavailable."
      )
    } finally {
      setSending(false)
    }
  }

  if (isPending) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Checking your HEGEVA account…
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8">
        <h2 className="text-2xl font-semibold">Sign in to use HEGEVA Assistant</h2>
        <p className="mt-3 text-muted-foreground">
          The live assistant uses your authenticated HEGEVA account and your real monthly AI usage limit.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
        >
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Signed in as {session.user.email}
            </p>
            {usage && (
              <p className="mt-1 text-xs text-muted-foreground">
                {usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)} plan · {usage.aiMessages} / {usage.aiLimit} AI messages this month
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {syncState === "saving" ? "Saving conversation…" : syncState === "cloud" ? "Conversation cloud synced" : syncState === "error" ? "Cloud sync temporarily unavailable" : "Loading conversation…"}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([])
                setError("")
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Clear chat
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[420px] space-y-4 p-5 sm:p-6">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">
            Ask HEGEVA for practical business help. No demo conversation is inserted here.
          </div>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={
                item.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
                  : "group relative mr-auto max-w-[90%] rounded-2xl bg-muted px-4 py-3 pr-11 text-foreground"
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
                    aria-label="Copy answer"
                    title="Copy answer"
                    className="absolute right-2 top-2 rounded-lg p-2 text-muted-foreground opacity-70 transition hover:bg-background hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  >
                    {copiedIndex === index ? <Check className="size-4 text-primary" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  </button>
                </>
              )}
            </div>
          ))
        )}

        {sending && (
          <div className="mr-auto max-w-[90%] rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            HEGEVA is thinking…
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
        className="border-t border-border p-4 sm:p-5"
      >
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            maxLength={2500}
            rows={3}
            placeholder="Ask HEGEVA AI…"
            className="min-h-24 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="self-end rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter to send · Shift+Enter for a new line · Maximum 2,500 characters. Usage is counted by the live HEGEVA backend.
        </p>
      </form>
    </div>
  )
}
