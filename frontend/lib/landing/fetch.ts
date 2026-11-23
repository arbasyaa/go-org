import {
  himpunanList,
  programs,
  type Himpunan,
  type LandingSectionKey,
  type OfficialGroup,
  type WorkProgram,
} from "@/lib/landing/content"
import type {
  HimpunanItem,
  MerchItem,
  OfficialItem,
  PressRelease,
  WorkProgramItem,
} from "@/lib/public-content"
import { storageUrl } from "@/lib/storage-url"

const BASE = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080"

/**
 * GET endpoint publik untuk halaman pemasaran (landing, /berita, /merch).
 *
 * Berbeda dengan `serverPublicGet`, kegagalan di sini sengaja DITELAN dan
 * dikembalikan sebagai `fallback`: landing tidak boleh ikut mati hanya karena
 * daftar berita belum bisa diambil. Section terkait menampilkan empty state.
 * Revalidate 60 detik: konten CRUD cukup segar tanpa memukul backend tiap
 * kunjungan.
 */
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

export function getPressReleases(limit?: number) {
  const q = limit ? `?limit=${limit}` : ""
  return publicGet<PressRelease[]>(`/public/press_releases${q}`, [])
}

export async function getPressRelease(slug: string) {
  return publicGet<PressRelease | null>(
    `/public/press_releases/${encodeURIComponent(slug)}`,
    null
  )
}

export function getMerch() {
  return publicGet<MerchItem[]>("/public/merch", [])
}

/** Seperti publicGet, tetapi `null` bila fetch GAGAL (beda dengan sukses berisi []). */
async function publicGetOrNull<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: T }
    return body.data ?? null
  } catch {
    return null
  }
}

/**
 * Himpunan anggota dari API. Hanya bila fetch GAGAL dipakai data statis
 * `himpunanList`; sukses dengan [] berarti daftar memang kosong.
 */
export async function getHimpunan(): Promise<Himpunan[]> {
  const rows = await publicGetOrNull<HimpunanItem[]>("/public/himpunan")
  if (!rows) return himpunanList
  return rows.map((h) => ({
    no: h.id,
    name: h.name,
    shortLabel: h.short_label ?? "",
    institution: h.institution ?? "",
    city: h.city ?? "",
    region: h.region ?? 0,
    address: h.address || null,
    email: h.email || null,
    logo: h.logo_url ? storageUrl(h.logo_url) : null,
  }))
}

/**
 * Pengurus dari API, dikelompokkan per divisi. Sumbernya tabel `user`, jadi
 * pengurus yang akunnya dinonaktifkan/dihapus langsung hilang dari landing.
 * Tidak ada fallback statis: fetch gagal = daftar kosong (section
 * menyembunyikan diri), supaya tidak pernah menampilkan orang yang sudah tidak
 * menjabat.
 */
export async function getOfficials(): Promise<OfficialGroup[]> {
  const rows = await publicGet<OfficialItem[]>("/public/officials", [])
  return groupOfficials(rows)
}

/**
 * Peringkat jabatan untuk urutan dalam satu divisi: pimpinan dulu, lalu
 * wakil/sekretaris/bendahara, lalu anggota. Tanpa ini urutan mengikuti id user,
 * sehingga kartu besar (lead) jatuh ke orang yang paling awal dibuat akunnya —
 * mis. anggota yang id-nya lebih kecil dari Kepala Divisi.
 */
function roleRank(role: string) {
  if (/Wakil/i.test(role)) return 1
  if (/Kepala|Koordinator/i.test(role)) return 0
  if (/Sekretaris/i.test(role)) return 2
  if (/Bendahara/i.test(role)) return 3
  return 4
}

function groupOfficials(rows: OfficialItem[]): OfficialGroup[] {
  const groups = new Map<string, OfficialGroup>()
  for (const row of rows) {
    const division = row.division || "Pengurus"
    const group = groups.get(division) ?? { division, members: [] }
    group.members.push({
      name: row.name,
      role: row.role,
      origin: row.origin,
      // Path storage di-resolve di sini supaya komponen tidak perlu tahu API base.
      avatar: row.avatar_url ? storageUrl(row.avatar_url) : undefined,
    })
    groups.set(division, group)
  }
  // sort stabil: jabatan seranking tetap urut id dari API.
  for (const group of groups.values()) {
    group.members.sort((a, b) => roleRank(a.role) - roleRank(b.role))
  }
  return [...groups.values()]
}

export type WorkProgramQuery = {
  limit?: number
  status?: "upcoming" | "done"
  category?: "program_kerja" | "agenda"
}

/** Normalisasi baris API (toleran terhadap backend lama yang belum punya field baru). */
function toWorkProgram(p: WorkProgramItem): WorkProgram {
  return {
    slug: p.slug || slugify(p.name),
    name: p.name,
    description: p.description ?? "",
    cadence: p.cadence ?? "",
    category: p.category === "agenda" ? "agenda" : "program_kerja",
    status: p.status === "done" ? "done" : "upcoming",
    division_name: p.division_name ?? "",
    start_date: p.start_date || null,
    end_date: p.end_date || null,
    location: p.location ?? "",
    host: p.host ?? "",
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Program kerja & agenda dari API beserta TOTAL aktif (header X-Total-Count,
 * mengabaikan `limit`; fallback ke jumlah item). Fallback statis hanya bila
 * fetch GAGAL; sukses dengan [] berarti memang kosong.
 */
export async function getWorkPrograms(
  query: WorkProgramQuery = {}
): Promise<{ items: WorkProgram[]; total: number }> {
  const params = new URLSearchParams()
  if (query.limit) params.set("limit", String(query.limit))
  if (query.status) params.set("status", query.status)
  if (query.category) params.set("category", query.category)
  const qs = params.toString()
  try {
    const res = await fetch(`${BASE}/public/work_programs${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    })
    if (!res.ok) throw new Error(String(res.status))
    const body = (await res.json()) as { data?: WorkProgramItem[] }
    const items = (body.data ?? []).map(toWorkProgram)
    const raw = res.headers.get("X-Total-Count")
    const header = raw === null ? Number.NaN : Number(raw)
    const total = Number.isFinite(header) ? Math.max(header, items.length) : items.length
    return { items, total }
  } catch {
    const all = programs.filter(
      (p) =>
        (!query.status || p.status === query.status) &&
        (!query.category || p.category === query.category)
    )
    return { items: query.limit ? all.slice(0, query.limit) : all, total: all.length }
  }
}

/** Detail program per slug; null bila 404 / gagal. */
export async function getWorkProgram(slug: string): Promise<WorkProgram | null> {
  const row = await publicGetOrNull<WorkProgramItem>(
    `/public/work_programs/${encodeURIComponent(slug)}`
  )
  return row ? toWorkProgram(row) : null
}

export type LandingSections = Record<LandingSectionKey, boolean>

const SECTION_KEYS: LandingSectionKey[] = [
  "about",
  "programs",
  "press",
  "members",
  "officials",
  "merch",
  "invitation",
  "cta",
]

/** Toggle section landing dari /settings. Key hilang / gagal parse = tampil. */
export async function getLandingSections(): Promise<LandingSections> {
  const settings = await publicGetOrNull<{ landing_sections?: string }>("/settings")
  let parsed: Record<string, unknown> = {}
  try {
    const raw = settings?.landing_sections
    if (raw) {
      const value = JSON.parse(raw)
      if (value && typeof value === "object") parsed = value
    }
  } catch {
    parsed = {}
  }
  return Object.fromEntries(
    SECTION_KEYS.map((k) => [k, parsed[k] !== false])
  ) as LandingSections
}
