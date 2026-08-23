import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

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
  const publicUrl = new URL(incomingUrl.pathname + incomingUrl.search, "https://hegevaai.co.uk")
  const headers = new Headers(request.headers)

  headers.set("x-forwarded-host", "hegevaai.co.uk")
  headers.set("x-forwarded-proto", "https")

  const upstreamRequest = new Request(publicUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  })

  return env.HEGEVA_API.fetch(upstreamRequest)
}

export const GET = proxyToHegevaApi
export const POST = proxyToHegevaApi
export const PUT = proxyToHegevaApi
export const PATCH = proxyToHegevaApi
export const DELETE = proxyToHegevaApi
export const OPTIONS = proxyToHegevaApi
