"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export function AssistantChat() {
  const { data: session, isPending } = authClient.useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const recentHistory = useMemo(
    () => messages.slice(-10),
    [messages]
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanMessage = message.trim()
    if (!cleanMessage || sending) return

    setError("")
    setSending(true)
    setMessage("")
    setMessages((current) => [
      ...current,
      { role: "user", content: cleanMessage },
    ])

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
          language: "en",
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
        { role: "assistant", content: answer },
      ])
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
        <p className="text-sm text-muted-foreground">
          Signed in as {session.user.email}
        </p>
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
                  : "mr-auto max-w-[90%] rounded-2xl bg-muted px-4 py-3 text-foreground"
              }
            >
              <p className="whitespace-pre-wrap text-sm leading-6">
                {item.content}
              </p>
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
      </div>

      <form
        onSubmit={submit}
        className="border-t border-border p-4 sm:p-5"
      >
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
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
          Maximum 2,500 characters per message. Usage is counted by the live HEGEVA backend.
        </p>
      </form>
    </div>
  )
}
