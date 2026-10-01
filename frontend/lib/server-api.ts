import { cookies } from "next/headers"

const BASE = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080"

/**
 * GET backend dari Server Component dengan cookie `token` milik user.
 *
 * Dipakai supaya data awal (mis. event + divisi untuk kalender) sudah ada di
 * HTML pertama — menghilangkan skeleton di hard refresh. `no-store` karena
 * respons bergantung user, bukan halaman statis.
 */
export async function serverGet<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get("token")?.value
  if (!token) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: T }
    return body.data ?? null
  } catch {
    return null
  }
}

/**
 * GET backend dari Server Component untuk endpoint publik (tanpa cookie),
 * mis. `GET /settings` yang hanya butuh branding + flag.
 */
export async function serverPublicGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: T }
    return body.data ?? null
  } catch {
    return null
  }
}
