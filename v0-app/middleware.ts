import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase()

  // Keep the public staging hostname out of search results. This is an
  // indexing directive, not an access-control boundary.
  if (host === "staging.hegevaai.co.uk") {
    const response = NextResponse.next()
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    return response
  }

  // These malformed legacy homepage paths were found as 404s in Search Console.
  // Browsers and Google may percent-encode the reserved characters in a path.
  const pathname = request.nextUrl.pathname
  const isMalformedHomepagePath =
    pathname === "/&" ||
    pathname === "/$" ||
    /^\/%(?:26|24)$/i.test(pathname)

  if (isMalformedHomepagePath) {
    const canonical = request.nextUrl.clone()
    canonical.protocol = "https:"
    canonical.hostname = "hegevaai.co.uk"
    canonical.port = ""
    canonical.pathname = "/"
    canonical.search = ""
    return NextResponse.redirect(canonical, 308)
  }

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
