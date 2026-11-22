import type { WorkProgram } from "@/lib/landing/content"

const UNITS = [
  "nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan",
  "sembilan", "sepuluh", "sebelas",
]

function words(n: number): string {
  if (n <= 11) return UNITS[n]
  if (n < 20) return `${UNITS[n - 10]} belas`
  const tens = Math.floor(n / 10)
  const unit = n % 10
  return unit ? `${UNITS[tens]} puluh ${UNITS[unit]}` : `${UNITS[tens]} puluh`
}

/**
 * Angka 0..99 dalam kata Indonesia dengan huruf awal kapital
 * (1 -> "Satu", 17 -> "Tujuh belas", 21 -> "Dua puluh satu").
 * Di luar rentang (>= 100, negatif, bukan bilangan bulat) dikembalikan
 * sebagai digit.
 */
export function terbilang(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n)
  const w = words(n)
  return w.charAt(0).toUpperCase() + w.slice(1)
}

const MONTHS_UTC = { timeZone: "UTC" } as const

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Tanggal pelaksanaan dalam format id-ID. Rentang bila end_date berbeda:
 * "12 – 14 Maret 2026", "30 Maret – 2 April 2026", lintas tahun ditulis penuh.
 * Kosong bila start_date tidak ada. Dihitung di UTC agar tidak bergeser zona.
 */
export function formatProgramDate(start?: string | null, end?: string | null): string {
  const s = parseDate(start)
  if (!s) return ""
  const full = (d: Date) =>
    new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", ...MONTHS_UTC }).format(d)
  const e = parseDate(end)
  if (!e || e.getTime() === s.getTime()) return full(s)
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear()
  if (!sameYear) return `${full(s)} – ${full(e)}`
  const sameMonth = s.getUTCMonth() === e.getUTCMonth()
  const dayMonth = (d: Date) =>
    new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", ...MONTHS_UTC }).format(d)
  if (sameMonth) {
    return `${s.getUTCDate()} – ${full(e)}`
  }
  return `${dayMonth(s)} – ${full(e)}`
}

export const CATEGORY_LABEL: Record<WorkProgram["category"], string> = {
  program_kerja: "Program Kerja",
  agenda: "Agenda",
}

export const STATUS_LABEL: Record<WorkProgram["status"], string> = {
  upcoming: "Akan datang",
  done: "Selesai",
}

export function categoryLabel(c: string): string {
  return CATEGORY_LABEL[c as WorkProgram["category"]] ?? c
}

export function statusLabel(s: string): string {
  return STATUS_LABEL[s as WorkProgram["status"]] ?? s
}
