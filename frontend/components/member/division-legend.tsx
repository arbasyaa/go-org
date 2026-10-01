"use client"

import { divisionColorMap, NO_DIVISION_COLOR } from "@/lib/division-color"
import { cn } from "@/lib/utils"
import type { Division } from "@/lib/types"

/**
 * Petunjuk warna kalender: menampilkan SELURUH divisi (bukan hanya yang punya
 * event bulan ini) supaya warna chip bisa dicari tanpa harus ketemu eventnya.
 */
export function DivisionLegend({
  divisions,
  myDivisionId,
  showNoDivision,
  className,
}: {
  divisions: Division[]
  myDivisionId?: number | null
  /** Tampilkan entri abu 'Tanpa divisi' hanya kalau ada event tanpa divisi. */
  showNoDivision?: boolean
  className?: string
}) {
  if (divisions.length === 0) return null
  const colors = divisionColorMap(divisions)
  // Urut id supaya legend terbaca sesuai pembagian warna (division-1 → division-6).
  const items = [...divisions].sort((a, b) => a.id - b.id)

  return (
    <section
      aria-label="Petunjuk warna divisi"
      className={cn("rounded-2xl border bg-card p-4", className)}
    >
      <p className="text-xs text-muted-foreground">
        Warna event di kalender mengikuti divisi pembuatnya
      </p>
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {items.map((division) => {
          const mine = division.id === myDivisionId
          return (
            <li key={division.id} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor:
                    colors.get(division.id) ?? NO_DIVISION_COLOR,
                }}
              />
              <span className={cn(mine && "font-medium")}>{division.name}</span>
              {mine ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  Divisi Anda
                </span>
              ) : null}
            </li>
          )
        })}
        {showNoDivision ? (
          <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: NO_DIVISION_COLOR }}
            />
            Tanpa divisi
          </li>
        ) : null}
      </ul>
    </section>
  )
}
