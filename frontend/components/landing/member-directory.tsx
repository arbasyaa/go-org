"use client"

import { useMemo, useState } from "react"
import { HimpunanLogo } from "@/components/landing/himpunan-logo"
import { getRegionCoordinator, groupByRegion, type Himpunan } from "@/lib/landing/content"

/** Daftar anggota per daerah + filter teks (nama / instansi / kota) di sisi klien. */
export function MemberDirectory({ members }: { members: Himpunan[] }) {
  const [query, setQuery] = useState("")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? members.filter((h) => [h.name, h.institution, h.city].some((v) => v.toLowerCase().includes(q)))
      : members
    return groupByRegion(filtered)
  }, [members, query])
  const shown = groups.reduce((n, g) => n + g.members.length, 0)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block w-full max-w-md">
          <span className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
            Cari himpunan
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nama, kampus, atau kota"
            className="mt-2 w-full rounded-full border border-[var(--landing-ink)]/20 bg-transparent px-5 py-3 text-sm text-[var(--landing-ink)] outline-none transition-colors placeholder:text-[var(--landing-ink-muted)] focus:border-[var(--landing-ink)]/60"
          />
        </label>
        <p aria-live="polite" className="font-[family-name:var(--font-landing-label)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
          {shown} himpunan · {groups.length} daerah
        </p>
      </div>

      {groups.length ? (
        <div className="mt-12 space-y-14">
          {groups.map((group) => {
            const koor = group.region ? getRegionCoordinator(group.region) : undefined
            return (
            <section key={group.region} aria-label={`Himpunan di ${group.label}`}>
              <h2 className="flex items-baseline justify-between gap-3 border-b border-[var(--landing-ink)]/15 pb-3 font-[family-name:var(--font-landing-display)] text-2xl font-extrabold text-[var(--landing-ink)] md:text-3xl">
                {group.label}
                <span className="font-[family-name:var(--font-landing-label)] text-xs font-semibold tabular-nums text-[var(--landing-accent-deep)]">
                  {String(group.members.length).padStart(2, "0")} himpunan
                </span>
              </h2>
              {koor ? (
                <p className="mt-3 text-sm text-[var(--landing-ink-muted)]">
                  Koordinator Daerah: <span className="font-semibold text-[var(--landing-ink)]">{koor.name}</span> · {koor.origin}
                </p>
              ) : null}
              <ul className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                {group.members.map((h) => (
                  <li key={h.no} className="grid grid-cols-[3.5rem_1fr] gap-4">
                    <span className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-[var(--landing-ink)]/10 bg-white p-1">
                      <HimpunanLogo src={h.logo} name={h.name} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-landing-display)] text-lg font-bold leading-tight text-[var(--landing-ink)]">{h.name}</p>
                      <p className="mt-0.5 text-sm text-[var(--landing-ink-muted)]">{h.institution}</p>
                      <p className="text-sm text-[var(--landing-ink-muted)]">{h.city}</p>
                      {h.email ? (
                        <a href={`mailto:${h.email}`} className="mt-1 inline-block break-all text-sm font-medium text-[var(--landing-accent-deep)] underline-offset-4 hover:underline">
                          {h.email}
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            )
          })}
        </div>
      ) : (
        <p className="mt-12 rounded-[var(--landing-radius-md)] border border-dashed border-[var(--landing-ink)]/25 p-10 text-center font-[family-name:var(--font-landing-display)] text-xl font-bold text-[var(--landing-ink)]">
          {members.length ? "Tidak ada himpunan yang cocok." : "Belum ada himpunan anggota."}
        </p>
      )}
    </>
  )
}
