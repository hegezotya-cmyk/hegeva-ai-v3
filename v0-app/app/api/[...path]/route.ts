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

  return env.HEGEVA_API.fetch(request)
}

export const GET = proxyToHegevaApi
export const POST = proxyToHegevaApi
export const PUT = proxyToHegevaApi
export const PATCH = proxyToHegevaApi
export const DELETE = proxyToHegevaApi
export const OPTIONS = proxyToHegevaApi
