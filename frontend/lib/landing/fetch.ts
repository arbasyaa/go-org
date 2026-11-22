import {
  himpunanList,
  programs,
  type Himpunan,
  type LandingSectionKey,
  type WorkProgram,
} from "@/lib/landing/content"
import type {
  HimpunanItem,
  MerchItem,
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
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } })
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
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } })
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

/** Program kerja dari API; fallback statis hanya bila fetch gagal. */
export async function getWorkPrograms(): Promise<WorkProgram[]> {
  const rows = await publicGetOrNull<WorkProgramItem[]>("/public/work_programs")
  if (!rows) return programs
  return rows.map((p) => ({
    name: p.name,
    description: p.description ?? "",
    cadence: p.cadence ?? "",
  }))
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
