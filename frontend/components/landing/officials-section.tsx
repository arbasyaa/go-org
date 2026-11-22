"use client"

import { useRef, useState } from "react"
import type { OfficialGroup } from "@/lib/landing/content"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"
import { cn } from "@/lib/utils"

/**
 * Badan Pengurus Wilayah: 50+ orang dalam 7 kelompok terlalu panjang untuk
 * satu grid. Jadi: tablist divisi (pola ARIA tabs, panah kiri/kanan
 * berpindah), satu panel aktif. Kartu panel masuk ulang tiap ganti divisi
 * (key = divisi) dengan stagger CSS, dan kartu pimpinan (Koordinator/Kepala)
 * diberi bobot visual lebih besar.
 *
 * Data berasal dari tabel user (GET /public/officials). Tanpa pengurus, section
 * tidak dirender sama sekali — lebih baik hilang daripada menampilkan orang
 * yang sudah tidak menjabat.
 */
export function OfficialsSection({ groups: officialGroups }: { groups: OfficialGroup[] }) {
  const [index, setIndex] = useState(0)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])
  // Data bisa berubah (admin menghapus divisi) — jaga indeks tetap valid.
  const active = Math.min(index, officialGroups.length - 1)
  const group = officialGroups[active]

  function onKey(e: React.KeyboardEvent) {
    const last = officialGroups.length - 1
    let next = active
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1
    else if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = last
    else return
    e.preventDefault()
    setIndex(next)
    tabsRef.current[next]?.focus()
  }

  if (!group) return null

  return (
    <section
      id="pengurus"
      aria-labelledby="pengurus-title"
      className="relative scroll-mt-24 bg-[var(--landing-paper)] text-[var(--landing-ink)]"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <SectionLabel index="05" tone="paper">
              Badan Pengurus Wilayah
            </SectionLabel>
            <SectionTitle id="pengurus-title" text="Orang-orang di balik gerakan." className="mt-6 max-w-[14ch]" accentLast />
          </div>
          <p data-reveal className="max-w-[38ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-muted)] md:col-span-4">
            BPW periode 2026/2027, dipilih dari dan oleh himpunan anggota. Pilih divisi untuk melihat susunannya.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Divisi pengurus"
          onKeyDown={onKey}
          data-reveal
          className="mt-14 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:flex-wrap md:overflow-visible"
          data-lenis-prevent
        >
          {officialGroups.map((g, i) => {
            const selected = i === active
            return (
              <button
                key={g.division}
                ref={(el) => {
                  tabsRef.current[i] = el
                }}
                type="button"
                role="tab"
                id={`tab-${i}`}
                aria-selected={selected}
                aria-controls="pengurus-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-full border px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold transition-[color,border-color,background-color] duration-500",
                  selected
                    ? "border-[var(--landing-ink)] bg-[var(--landing-ink)] text-[var(--landing-on-ink)]"
                    : "border-[var(--landing-ink)]/20 text-[var(--landing-ink)] hover:border-[var(--landing-ink)]/60"
                )}
              >
                {g.division}
                <span className={cn("ml-2 tabular-nums", selected ? "text-[var(--landing-on-ink-dim)]" : "text-[var(--landing-ink-muted)]")}>
                  {g.members.length}
                </span>
              </button>
            )
          })}
        </div>

        <div id="pengurus-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-10">
          <ul key={group.division} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {group.members.map((official, i) => {
              const lead = i === 0 || /Koordinator Wilayah|Kepala/.test(official.role)
              return (
                <li
                  key={official.name}
                  style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }}
                  className={cn(
                    "group relative flex min-h-44 flex-col overflow-hidden rounded-[var(--landing-radius-md)] p-5 motion-safe:animate-[landing-card-in_0.8s_cubic-bezier(0.16,1,0.3,1)_both]",
                    lead
                      ? "bg-[var(--landing-ink)] text-[var(--landing-on-ink)] sm:col-span-2 lg:row-span-2 lg:min-h-0"
                      : "border border-[var(--landing-ink)]/12 bg-[var(--landing-paper-raised)] text-[var(--landing-ink)]"
                  )}
                >
                  {lead ? (
                    <div
                      aria-hidden
                      className="absolute -right-24 -top-24 size-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--landing-accent)_40%,transparent),transparent_70%)] transition-transform duration-1000 group-hover:scale-125"
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className={cn(
                      "relative flex items-center justify-center overflow-hidden rounded-full font-[family-name:var(--font-landing-display)] font-extrabold transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-110",
                      lead
                        ? "size-16 bg-[var(--landing-on-ink)] text-lg text-[var(--landing-ink)]"
                        : "size-11 bg-[var(--landing-ink)] text-xs text-[var(--landing-on-ink)]"
                    )}
                  >
                    {/* Inisial jadi lapisan dasar: file avatar yang sudah hilang dari
                        storage tidak menyisakan broken image. */}
                    {initials(official.name)}
                    {official.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={official.avatar}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="relative mt-auto pt-6">
                    <p
                      className={cn(
                        "font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.12em]",
                        lead ? "text-[var(--landing-cyan)]" : "text-[var(--landing-accent-deep)]"
                      )}
                    >
                      {official.role}
                    </p>
                    <h3 className={cn("mt-2 font-[family-name:var(--font-landing-display)] font-bold leading-tight", lead ? "text-2xl md:text-3xl" : "text-base")}>
                      {official.name}
                    </h3>
                    <p className={cn("mt-1 font-[family-name:var(--font-landing-body)] text-xs", lead ? "text-[var(--landing-on-ink-dim)]" : "text-[var(--landing-ink-muted)]")}>
                      {official.origin}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

function initials(name: string) {
  return name
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
