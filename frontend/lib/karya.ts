const BASE = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080"

export type KaryaStatus = "review" | "published" | "rejected"

/** Satu karya seperti yang dikirim API. `about_html` hanya ada di endpoint detail. */
export type Karya = {
  id: number
  code: string
  title: string
  author_name: string
  himpunan: string
  himpunan_id: number
  repo_url: string
  image_url: string
  about_html?: string
  status: KaryaStatus
  review_note?: string
  like_count: number
  published_at?: string | null
  created_at: string
}

export type KaryaQuery = {
  limit?: number
  offset?: number
  himpunanID?: number
  sort?: "likes" | "new"
}

/** Kegagalan fetch dikembalikan sebagai daftar kosong: katalog tidak boleh ikut mati. */
async function publicGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
    if (!res.ok) return fallback
    const body = (await res.json()) as { data?: T }
    return body.data ?? fallback
  } catch {
    return fallback
  }
}

export async function getKaryaList(query: KaryaQuery = {}): Promise<{ items: Karya[]; total: number }> {
  const params = new URLSearchParams()
  if (query.limit) params.set("limit", String(query.limit))
  if (query.offset) params.set("offset", String(query.offset))
  if (query.himpunanID) params.set("himpunan_id", String(query.himpunanID))
  if (query.sort) params.set("sort", query.sort)
  const qs = params.toString()
  try {
    const res = await fetch(`${BASE}/public/karya${qs ? `?${qs}` : ""}`, { cache: "no-store" })
    if (!res.ok) return { items: [], total: 0 }
    const body = (await res.json()) as { data?: Karya[] }
    const items = body.data ?? []
    const raw = res.headers.get("X-Total-Count")
    const total = raw ? Number(raw) : items.length
    return { items, total: Number.isFinite(total) ? Math.max(total, items.length) : items.length }
  } catch {
    return { items: [], total: 0 }
  }
}

/**
 * Karya unggulan untuk landing: endpoint daftar dengan limit 1. Urutan default
 * API sudah "like terbanyak lalu kiriman terlama", jadi tidak perlu endpoint
 * khusus (dan route statis di bawah /public/karya akan tertelan :code).
 */
export async function getKaryaFeatured(): Promise<Karya | null> {
  const { items } = await getKaryaList({ limit: 1 })
  return items[0] ?? null
}

export async function getKaryaByCode(code: string): Promise<Karya | null> {
  return publicGet<Karya | null>(`/public/karya/${encodeURIComponent(code)}`, null)
}

/** Dipakai halaman detail untuk metadata; tidak butuh isi markdown. */
export function karyaOgTitle(k: Karya) {
  return `${k.title} — ${k.author_name}`
}
