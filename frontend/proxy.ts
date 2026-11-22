import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const protectedPrefixes = [
  "/dashboard",
  "/profile",
  "/events",
  "/my-permissions",
  "/my-violations",
  "/announcements",
  "/invitations",
  "/divisions",
  "/admin",
]

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * `/api/backend/*` (di-rewrite ke Go backend oleh next.config.ts):
 * - tolak write lintas-origin (CSRF defense in depth; cookie sudah SameSite=Lax),
 * - suntik `Authorization: Bearer <cookie token>` dari cookie HttpOnly.
 * Override header request dari proxy diterapkan ke req sebelum rewrite eksternal
 * (next/dist/server/lib/router-utils/resolve-routes.js), jadi ikut ter-forward.
 */
function handleBackendApi(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!SAFE_METHODS.has(request.method) && origin) {
    let originHost: string | null = null
    try {
      originHost = new URL(origin).host
    } catch {
      originHost = null
    }
    const host = request.headers.get("host") ?? request.nextUrl.host
    if (originHost !== host) {
      return NextResponse.json(
        { success: false, message: "origin tidak valid" },
        { status: 403 }
      )
    }
  }

  const token = request.cookies.get("token")?.value
  if (token && !request.headers.has("authorization")) {
    const headers = new Headers(request.headers)
    headers.set("authorization", `Bearer ${token}`)
    return NextResponse.next({ request: { headers } })
  }
  return NextResponse.next()
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/backend/")) {
    return handleBackendApi(request)
  }
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const token = request.cookies.get("token")?.value
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/backend/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/events",
    "/events/:path*",
    "/my-permissions",
    "/my-permissions/:path*",
    "/my-violations",
    "/my-violations/:path*",
    "/announcements",
    "/announcements/:path*",
    "/invitations",
    "/invitations/:path*",
    "/divisions",
    "/divisions/:path*",
    "/admin",
    "/admin/:path*",
  ],
}
