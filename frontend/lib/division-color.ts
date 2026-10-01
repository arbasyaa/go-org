import type { Division } from "@/lib/types"

/**
 * Token warna divisi yang tersedia (`--division-1..8`), urut sesuai nilai di
 * globals.css. Admin memilih salah satunya di menu Divisi (kolom
 * `division.color`); nilai kosong = dibagi otomatis.
 */
export const DIVISION_COLOR_TOKENS = [
  "division-1",
  "division-2",
  "division-3",
  "division-4",
  "division-5",
  "division-6",
  "division-7",
  "division-8",
] as const

export type DivisionColorToken = (typeof DIVISION_COLOR_TOKENS)[number]

/** Nama warna untuk swatch di menu Divisi (aria-label + label kolom). */
export const DIVISION_COLOR_LABELS: Record<DivisionColorToken, string> = {
  "division-1": "Merah",
  "division-2": "Amber",
  "division-3": "Olive",
  "division-4": "Hijau",
  "division-5": "Teal",
  "division-6": "Biru",
  "division-7": "Violet",
  "division-8": "Pink",
}

/** Warna untuk event tanpa divisi (pembuat tanpa divisi). */
export const NO_DIVISION_COLOR = "var(--muted-foreground)"

export function divisionColorValue(color?: string | null) {
  return (DIVISION_COLOR_TOKENS as readonly string[]).includes(color ?? "")
    ? `var(--${color})`
    : null
}

export function divisionColorLabel(color?: string | null) {
  return color && color in DIVISION_COLOR_LABELS
    ? DIVISION_COLOR_LABELS[color as DivisionColorToken]
    : "Otomatis"
}

/**
 * Peta warna divisi: warna pilihan admin dipakai apa adanya, sisanya dibagi
 * otomatis (urut id, token yang belum terpakai lebih dulu) sehingga tidak ada
 * dua divisi berwarna sama selama token masih cukup. Dipakai bareng oleh chip
 * kalender dan legend supaya satu divisi selalu berwarna sama di semua halaman.
 */
export function divisionColorMap(
  divisions: Array<Pick<Division, "id"> & { color?: string | null }>
) {
  const sorted = [...divisions].sort((a, b) => a.id - b.id)
  const used = new Set<number>()
  const map = new Map<number, string>()

  for (const division of sorted) {
    const index = DIVISION_COLOR_TOKENS.indexOf(
      division.color as DivisionColorToken
    )
    if (index === -1) continue
    map.set(division.id, `var(--${DIVISION_COLOR_TOKENS[index]})`)
    used.add(index)
  }

  let next = 0
  for (const division of sorted) {
    if (map.has(division.id)) continue
    while (used.has(next)) next++
    const index = next % DIVISION_COLOR_TOKENS.length
    map.set(division.id, `var(--${DIVISION_COLOR_TOKENS[index]})`)
    used.add(index)
    next++
  }
  return map
}

/** Nama divisi pembuat event, atau label netral kalau pembuat tanpa divisi. */
export function creatorDivisionLabel(
  name?: string | null,
  divisionId?: number | null
) {
  if (name) return name
  return divisionId ? "Divisi" : "Tanpa divisi"
}
