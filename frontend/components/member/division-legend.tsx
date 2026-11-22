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
  hiddenIds,
  onToggle,
  onReset,
  className,
}: {
  divisions: Division[]
  myDivisionId?: number | null
  /** Tampilkan entri abu 'Tanpa divisi' hanya kalau ada event tanpa divisi. */
  showNoDivision?: boolean
  /** Id divisi yang disembunyikan (0 = tanpa divisi). Aktif bersama `onToggle`. */
  hiddenIds?: ReadonlySet<number>
  /** Kalau diisi, chip jadi tombol filter: klik = tampil/sembunyikan divisi. */
  onToggle?: (divisionId: number) => void
  onReset?: () => void
  className?: string
}) {
  if (divisions.length === 0) return null
  const colors = divisionColorMap(divisions)
  // Urut id supaya legend terbaca sesuai pembagian warna (division-1 → division-6).
  const items = [...divisions].sort((a, b) => a.id - b.id)
  const interactive = Boolean(onToggle)
  const isHidden = (id: number) => hiddenIds?.has(id) ?? false
  const chipClass = (id: number) =>
    cn(
      "flex items-center gap-1.5 text-xs max-sm:whitespace-nowrap",
      interactive &&
        "rounded-full border px-2 py-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      interactive && isHidden(id) && "opacity-50"
    )

  return (
    <section
      aria-label="Petunjuk warna divisi"
      className={cn("rounded-2xl border bg-card p-4", className)}
    >
      <p className="text-xs text-muted-foreground">
        Warna event di kalender mengikuti divisi pembuatnya
        {interactive ? ". Klik untuk menampilkan/menyembunyikan." : ""}
      </p>
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1 max-sm:[scrollbar-width:none]">
        {interactive && onReset ? (
          <li className="max-sm:shrink-0">
            <button
              type="button"
              onClick={onReset}
              aria-pressed={(hiddenIds?.size ?? 0) === 0}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                (hiddenIds?.size ?? 0) === 0 &&
                  "border-primary bg-primary/10 text-primary"
              )}
            >
              Semua
            </button>
          </li>
        ) : null}
        {items.map((division) => {
          const mine = division.id === myDivisionId
          const body = (
            <>
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor:
                    colors.get(division.id) ?? NO_DIVISION_COLOR,
                }}
              />
              <span
                className={cn(
                  mine && "font-medium",
                  interactive && isHidden(division.id) && "line-through"
                )}
              >
                {division.name}
              </span>
              {mine ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  Divisi Anda
                </span>
              ) : null}
            </>
          )
          return (
            <li key={division.id} className="max-sm:shrink-0">
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onToggle?.(division.id)}
                  aria-pressed={!isHidden(division.id)}
                  className={chipClass(division.id)}
                >
                  {body}
                </button>
              ) : (
                <span className={chipClass(division.id)}>{body}</span>
              )}
            </li>
          )
        })}
        {showNoDivision ? (
          <li className="max-sm:shrink-0">
            {(() => {
              const body = (
                <>
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: NO_DIVISION_COLOR }}
                  />
                  <span
                    className={cn(
                      interactive && isHidden(0) && "line-through"
                    )}
                  >
                    Tanpa divisi
                  </span>
                </>
              )
              return interactive ? (
                <button
                  type="button"
                  onClick={() => onToggle?.(0)}
                  aria-pressed={!isHidden(0)}
                  className={cn(chipClass(0), "text-muted-foreground")}
                >
                  {body}
                </button>
              ) : (
                <span className={cn(chipClass(0), "text-muted-foreground")}>
                  {body}
                </span>
              )
            })()}
          </li>
        ) : null}
      </ul>
    </section>
  )
}
