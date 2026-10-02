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
 *
 * Sengaja TIDAK menelan error: dulu fetch gagal dikembalikan sebagai `null`,
 * padahal pemanggilnya mengartikan `null` sebagai "fitur mati" — akibatnya
 * backend tak terjangkau muncul sebagai 404 yang menyamar jadi normal
 * (kasus /uhuyorangsenang di prod). Sekarang kegagalan transport dilempar
 * beserta URL yang dicoba, jadi muncul di log container + halaman error.
 * `null` hanya berarti backend menjawab 200 tanpa `data`.
 */
export async function serverPublicGet<T>(path: string): Promise<T | null> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { cache: "no-store" })
  } catch (err) {
    throw new Error(`backend tidak terjangkau (${BASE}${path}): ${String(err)}`)
  }
  if (!res.ok) {
    throw new Error(`GET ${path} gagal: HTTP ${res.status}`)
  }
  const body = (await res.json()) as { data?: T }
  return body.data ?? null
}
