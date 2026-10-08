import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase()

  if (host === "www.hegevaai.co.uk") {
    const canonical = request.nextUrl.clone()
    canonical.protocol = "https:"
    canonical.hostname = "hegevaai.co.uk"
    canonical.port = ""
    return NextResponse.redirect(canonical, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
