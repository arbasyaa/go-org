import { NextResponse } from "next/server"

/** Sama dengan origin rewrite di next.config.ts. */
export const BACKEND_ORIGIN =
  process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080"

export const SESSION_COOKIE = "token"
const MAX_AGE = 7 * 24 * 60 * 60

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  }
}

/**
 * Teruskan POST JSON ke backend, lalu set cookie HttpOnly `token` di origin
 * Next bila respons berisi token. Token DIHAPUS dari JSON yang dikirim ke
 * browser. Status + envelope error backend diteruskan apa adanya.
 * Set-Cookie dari backend sengaja tidak diteruskan (cookie dikelola di sini).
 */
export async function forwardAuth(request: Request, backendPath: string) {
  let res: Response
  try {
    res = await fetch(`${BACKEND_ORIGIN}${backendPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { success: false, message: "backend tidak terjangkau" },
      { status: 502 }
    )
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    return NextResponse.json(
      { success: false, message: res.statusText || "Request failed" },
      { status: res.status }
    )
  }

  let token: string | undefined
  const envelope = body as { data?: Record<string, unknown> } | null
  if (envelope?.data && typeof envelope.data === "object") {
    if (typeof envelope.data.token === "string") token = envelope.data.token
    delete envelope.data.token
  }

  const out = NextResponse.json(body, { status: res.status })
  if (res.ok && token) {
    out.cookies.set(SESSION_COOKIE, token, cookieOptions(MAX_AGE))
  }
  return out
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", cookieOptions(0))
  return res
}
