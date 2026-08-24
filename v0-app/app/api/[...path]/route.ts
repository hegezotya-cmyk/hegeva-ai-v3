import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

type WorkspaceItem = Record<string, unknown>
type ServiceBinding = { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> }

function publicApiUrl(pathname: string, search = "") {
  return new URL(`${pathname}${search}`, "https://hegevaai.co.uk")
}

function forwardedHeaders(request: Request) {
  const headers = new Headers(request.headers)
  headers.set("x-forwarded-host", "hegevaai.co.uk")
  headers.set("x-forwarded-proto", "https")
  headers.delete("content-length")
  return headers
}

async function readWorkspaceItems(
  binding: ServiceBinding,
  request: Request,
  type: string,
): Promise<WorkspaceItem[]> {
  const response = await binding.fetch(
    new Request(publicApiUrl(`/api/workspace/${encodeURIComponent(type)}`), {
      method: "GET",
      headers: forwardedHeaders(request),
      redirect: "manual",
    }),
  )

  if (!response.ok) return []

  const payload = await response.json().catch(() => null) as { data?: unknown } | null
  return Array.isArray(payload?.data) ? payload.data as WorkspaceItem[] : []
}

async function buildWorkspaceContext(binding: ServiceBinding, request: Request) {
  try {
    const [customers, documents, expenses, tasks, invoices] = await Promise.all([
      readWorkspaceItems(binding, request, "customers"),
      readWorkspaceItems(binding, request, "documents"),
      readWorkspaceItems(binding, request, "expenses"),
      readWorkspaceItems(binding, request, "planner"),
      readWorkspaceItems(binding, request, "invoice_documents"),
    ])

    const expenseTotal = expenses.reduce((sum, item) => {
      const amount = Number(item.amount)
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)

    const openTasks = tasks.filter((item) => item.done !== true).length
    const paidInvoices = invoices.filter(
      (item) => item.type === "invoice" && item.status === "paid",
    ).length

    return [
      "Authenticated HEGEVA workspace facts (source of truth; never replace these with estimates):",
      `customers=${customers.length}`,
      `documents=${documents.length}`,
      `expense_records=${expenses.length}`,
      `expenses_total_GBP=${expenseTotal.toFixed(2)}`,
      `open_tasks=${openTasks}`,
      `invoice_and_quote_records=${invoices.length}`,
      `paid_invoices=${paidInvoices}`,
      "When the user asks about their current saved business data, answer from these facts and clearly say when a requested fact is not present.",
    ].join("; ").slice(0, 500)
  } catch {
    return ""
  }
}

async function proxyToHegevaApi(request: Request) {
  const { env } = await getCloudflareContext({ async: true })

  if (!env.HEGEVA_API) {
    return Response.json(
      { error: "HEGEVA API service binding is unavailable." },
      { status: 503 },
    )
  }

  // Service bindings can expose the target Worker's hostname to the
  // receiving Worker. Better Auth uses the request URL when it builds its
  // secure cookie configuration, so always forward the public HEGEVA URL.
  // This keeps sign-in and subsequent session checks on the same origin.
  const incomingUrl = new URL(request.url)
  const publicUrl = publicApiUrl(incomingUrl.pathname, incomingUrl.search)
  const headers = forwardedHeaders(request)
  let body: BodyInit | null = request.body

  // Ground Assistant answers in the authenticated user's real HEGEVA data.
  // This enrichment happens server-side so browser input cannot spoof the
  // workspace facts that are sent to the AI Worker.
  if (request.method === "POST" && incomingUrl.pathname === "/api/chat") {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null

    if (payload) {
      const workspaceContext = await buildWorkspaceContext(env.HEGEVA_API, request)
      body = JSON.stringify({
        ...payload,
        businessContext: workspaceContext || payload.businessContext || "",
      })
      headers.set("content-type", "application/json")
    } else {
      body = null
    }
  }

  const upstreamRequest = new Request(publicUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  })

  const upstreamResponse = await env.HEGEVA_API.fetch(upstreamRequest)
  const responseHeaders = new Headers(upstreamResponse.headers)

  // Authentication, workspace and billing responses must never be retained
  // by a browser, CDN or intermediary cache.
  responseHeaders.set("Cache-Control", "no-store, max-age=0")
  responseHeaders.set("Pragma", "no-cache")
  responseHeaders.set("X-Content-Type-Options", "nosniff")

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxyToHegevaApi
export const POST = proxyToHegevaApi
export const PUT = proxyToHegevaApi
export const PATCH = proxyToHegevaApi
export const DELETE = proxyToHegevaApi
export const OPTIONS = proxyToHegevaApi
