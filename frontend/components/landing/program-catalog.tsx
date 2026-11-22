"use client"

import Link from "next/link"
import { useState } from "react"
import type { WorkProgram } from "@/lib/landing/content"
import { formatProgramDate } from "@/lib/landing/program"
import { ProgramBadges } from "@/components/landing/program-badges"
import { cn } from "@/lib/utils"

const STATUS_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "upcoming", label: "Akan datang" },
  { value: "done", label: "Selesai" },
] as const

const CATEGORY_FILTERS = [
  { value: "all", label: "Semua kategori" },
  { value: "program_kerja", label: "Program Kerja" },
  { value: "agenda", label: "Agenda" },
] as const

function Chips<T extends string>({
  label,
  options,
  active,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  active: T
  onChange: (v: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={active === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-5 py-2.5 text-sm font-semibold transition-[color,background-color,border-color] duration-500",
            active === o.value
              ? "border-[var(--landing-ink)] bg-[var(--landing-ink)] text-[var(--landing-on-ink)]"
              : "border-[var(--landing-ink)]/20 text-[var(--landing-ink)] hover:border-[var(--landing-ink)]/60"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Daftar program/agenda dengan filter status + kategori (client-side, urutan dari API). */
export function ProgramCatalog({ items }: { items: WorkProgram[] }) {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all")
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]["value"]>("all")

  const shown = items.filter(
    (p) => (status === "all" || p.status === status) && (category === "all" || p.category === category)
  )

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:gap-x-10">
        <Chips label="Filter status" options={STATUS_FILTERS} active={status} onChange={setStatus} />
        <Chips label="Filter kategori" options={CATEGORY_FILTERS} active={category} onChange={setCategory} />
      </div>
      <p className="sr-only" aria-live="polite">{shown.length} program ditampilkan</p>

      {shown.length ? (
        <ul key={`${status}-${category}`} className="mt-12 grid gap-5 md:grid-cols-2">
          {shown.map((p, i) => {
            const date = formatProgramDate(p.start_date, p.end_date)
            const meta = [
              date && { term: "Tanggal", value: date },
              p.location && { term: "Lokasi", value: p.location },
              p.host && { term: "Tuan rumah", value: p.host },
              p.division_name && { term: "Divisi", value: p.division_name },
            ].filter(Boolean) as { term: string; value: string }[]
            return (
              <li
                key={p.slug}
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                className="motion-safe:animate-[landing-card-in_0.8s_cubic-bezier(0.16,1,0.3,1)_both]"
              >
                <Link
                  href={`/program/${p.slug}`}
                  data-cursor="Detail"
                  className="group flex h-full flex-col rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/15 p-6 text-[var(--landing-ink)] no-underline transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-[var(--landing-ink)]/50 md:p-8"
                >
                  <ProgramBadges category={p.category} status={p.status} tone="paper" />
                  <h2 className="mt-5 font-[family-name:var(--font-landing-display)] text-2xl font-extrabold leading-tight transition-colors group-hover:text-[var(--landing-accent-deep)] md:text-3xl">
                    {p.name}
                  </h2>
                  {p.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--landing-ink-muted)] md:text-base">
                      {p.description}
                    </p>
                  ) : null}
                  {meta.length ? (
                    <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-[var(--landing-ink)]/12 pt-5 text-sm sm:grid-cols-2">
                      {meta.map((m) => (
                        <div key={m.term}>
                          <dt className="font-[family-name:var(--font-landing-label)] text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
                            {m.term}
                          </dt>
                          <dd className="mt-0.5 font-medium">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-12 rounded-[var(--landing-radius-md)] border border-dashed border-[var(--landing-ink)]/25 p-10 text-center font-[family-name:var(--font-landing-display)] text-xl font-bold text-[var(--landing-ink)]">
          {items.length ? "Tidak ada program yang cocok dengan filter." : "Belum ada program kerja atau agenda."}
        </p>
      )}
    </>
  )
}
