import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  BACKEND_ORIGIN,
  SESSION_COOKIE,
  clearSessionCookie,
} from "@/lib/session/server"

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (token) {
    // Backend /auth/logout hanya menghapus cookie-nya sendiri (JWT stateless);
    // tetap dipanggil, kegagalannya diabaikan.
    try {
      await fetch(`${BACKEND_ORIGIN}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
    } catch {
      /* abaikan */
    }
  }
  return clearSessionCookie(
    NextResponse.json({ success: true, message: "logout success", data: null })
  )
}
