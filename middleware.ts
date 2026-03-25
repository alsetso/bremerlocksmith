import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/") return NextResponse.next()
  if (pathname === "/samgov") return NextResponse.next()
  if (pathname === "/integrations") return NextResponse.next()
  if (pathname === "/map") return NextResponse.next()
  if (pathname.startsWith("/api")) return NextResponse.next()
  if (pathname.startsWith("/_next")) return NextResponse.next()
  if (pathname.includes(".")) return NextResponse.next()

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = "/"
  redirectUrl.searchParams.set("toast", "coming-soon")
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
}
