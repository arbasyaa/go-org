"use client"

import { useMemo, useState } from "react"
import type { MerchItem } from "@/lib/public-content"
import { MerchCard } from "@/components/landing/merch-card"
import { cn } from "@/lib/utils"

/** Filter kategori (chip) + grid kartu; kartu masuk ulang saat filter berganti. */
export function MerchCatalog({ items }: { items: MerchItem[] }) {
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(items.map((i) => i.category || "Lainnya")))], [items])
  const [active, setActive] = useState("Semua")
  const shown = active === "Semua" ? items : items.filter((i) => (i.category || "Lainnya") === active)

  if (!items.length) {
    return (
      <div className="rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] p-10 text-center text-[var(--landing-on-ink)] md:p-16">
        <p className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--landing-cyan)]">Segera rilis</p>
        <p className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-extrabold">Koleksi perdana sedang disiapkan.</p>
      </div>
    )
  }

  return (
    <>
      <div role="group" aria-label="Filter kategori" className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={active === c}
            onClick={() => setActive(c)}
            className={cn(
              "rounded-full border px-5 py-2.5 text-sm font-semibold transition-[color,background-color,border-color] duration-500",
              active === c
                ? "border-[var(--landing-ink)] bg-[var(--landing-ink)] text-[var(--landing-on-ink)]"
                : "border-[var(--landing-ink)]/20 text-[var(--landing-ink)] hover:border-[var(--landing-ink)]/60"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{shown.length} produk ditampilkan</p>
      <div key={active} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((item, i) => (
          <div key={item.id} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }} className="motion-safe:animate-[landing-card-in_0.8s_cubic-bezier(0.16,1,0.3,1)_both]">
            <MerchCard item={item} index={i} />
          </div>
        ))}
      </div>
    </>
  )
}
