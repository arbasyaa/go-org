"use client"

import { useMemo, useState } from "react"
import { HimpunanLogo } from "@/components/landing/himpunan-logo"
import type { Himpunan } from "@/lib/landing/content"
import { cn } from "@/lib/utils"

type Point = { name: string; lon: number; lat: number; count: number }

const LON = [108.85, 111.6] as const
const LAT = [-6.45, -7.95] as const
const W = 1000
const H = 545

function project(p: { lon: number; lat: number }) {
  return {
    x: ((p.lon - LON[0]) / (LON[1] - LON[0])) * W,
    y: ((p.lat - LAT[0]) / (LAT[1] - LAT[0])) * H,
  }
}

/**
 * Peta titik + direktori yang saling terhubung. Kota ber-himpunan menjadi hub
 * (luas lingkaran ∝ jumlah himpunan), tersambung ke 2 hub terdekat; kota
 * tanpa himpunan tetap digambar redup sebagai cakupan wilayah. Hover/fokus
 * kota di direktori menyalakan hub-nya, dan sebaliknya klik hub menggulir ke
 * kartu kotanya.
 */
export function MembersMap({
  points,
  directory,
}: {
  points: Point[]
  directory: { city: string; members: Himpunan[] }[]
}) {
  const [active, setActive] = useState<string | null>(null)
  const hubs = useMemo(() => points.filter((p) => p.count > 0).map((p) => ({ ...p, ...project(p) })), [points])

  // Label yang bertabrakan dengan label hub sebelumnya (urut x) diturunkan
  // ke bawah titik — pantura (Brebes/Tegal) berjarak < 1 label.
  const labelBelow = useMemo(() => {
    const placed: { x: number; y: number }[] = []
    const below = new Set<string>()
    for (const h of [...hubs].filter((h) => h.count >= 2).sort((a, b) => a.x - b.x)) {
      if (placed.some((q) => Math.abs(q.x - h.x) < 190 && Math.abs(q.y - h.y) < 40)) below.add(h.name)
      else placed.push(h)
    }
    return below
  }, [hubs])

  const links = useMemo(() => {
    const seen = new Set<string>()
    const out: [number, number][] = []
    hubs.forEach((a, i) => {
      hubs
        .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
        .filter((e) => e.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2)
        .forEach(({ j }) => {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`
          if (!seen.has(key)) {
            seen.add(key)
            out.push([i, j])
          }
        })
    })
    return out
  }, [hubs])

  return (
    <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <figure data-reveal className="lg:sticky lg:top-28">
          <svg viewBox={`-40 -40 ${W + 80} ${H + 80}`} className="w-full" role="img" aria-label="Sebaran kota himpunan anggota di Jawa Tengah">
            {links.map(([i, j]) => {
              const a = hubs[i]
              const b = hubs[j]
              const lit = active === a.name || active === b.name
              return (
                <line
                  key={`${a.name}-${b.name}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={lit ? "var(--landing-cyan)" : "var(--landing-on-ink)"}
                  strokeOpacity={lit ? 0.9 : 0.18}
                  strokeDasharray="4 6"
                  className="transition-[stroke,stroke-opacity] duration-500"
                />
              )
            })}
            {points
              .filter((p) => p.count === 0)
              .map((p) => {
                const { x, y } = project(p)
                return <circle key={p.name} aria-hidden cx={x} cy={y} r={4} fill="var(--landing-on-ink)" fillOpacity={0.3} />
              })}
            {hubs.map((p) => {
              const lit = active === p.name
              const r = 8 + Math.sqrt(p.count) * 9
              return (
                <g
                  key={p.name}
                  aria-hidden
                  className="cursor-pointer"
                  onPointerEnter={() => setActive(p.name)}
                  onPointerLeave={() => setActive(null)}
                  onClick={() => document.getElementById(`kota-${slug(p.name)}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill="var(--landing-accent)"
                    fillOpacity={lit ? 0.45 : 0.16}
                    className="transition-[fill-opacity] duration-500 [transform-box:fill-box] [transform-origin:center] motion-safe:animate-[landing-pulse_3.2s_ease-in-out_infinite]"
                  />
                  <circle cx={p.x} cy={p.y} r={7} fill={lit ? "var(--landing-cyan)" : "var(--landing-on-ink)"} className="transition-[fill] duration-300" />
                  {/* Label permanen hanya untuk hub ≥2 himpunan (kota kecil
                      berdempetan di pantura); sisanya muncul saat aktif. */}
                  <text
                    x={p.x > 850 ? p.x - 14 : p.x + 14}
                    y={labelBelow.has(p.name) ? p.y + 40 : p.y - 14}
                    textAnchor={p.x > 850 ? "end" : "start"}
                    fill="var(--landing-on-ink)"
                    fontSize="30"
                    fontWeight="700"
                    paintOrder="stroke"
                    stroke="var(--landing-ink-deep)"
                    strokeWidth="6"
                    className="font-[family-name:var(--font-landing-label)] uppercase transition-opacity duration-300"
                    opacity={lit ? 1 : active || p.count < 2 ? 0 : 0.95}
                  >
                    {p.name} · {p.count}
                  </text>
                </g>
              )
            })}
          </svg>
          <figcaption className="mt-4 font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
            Lingkaran merah: kota dengan himpunan anggota (besar ∝ jumlah) · titik redup: cakupan wilayah
          </figcaption>
        </figure>
      </div>

      <div className="space-y-3 lg:col-span-5" data-stagger>
        {directory.map((group) => (
          <section
            key={group.city}
            id={`kota-${slug(group.city)}`}
            aria-label={`Himpunan di ${group.city}`}
            onPointerEnter={() => setActive(group.city)}
            onPointerLeave={() => setActive(null)}
            onFocusCapture={() => setActive(group.city)}
            onBlurCapture={() => setActive(null)}
            className={cn(
              "scroll-mt-28 rounded-[var(--landing-radius-md)] border p-5 transition-[background-color,border-color] duration-500",
              active === group.city
                ? "border-[var(--landing-cyan)]/60 bg-[var(--landing-on-ink)]/[0.06]"
                : "border-[var(--landing-on-ink)]/12"
            )}
          >
            <h3 className="flex items-baseline justify-between gap-3 font-[family-name:var(--font-landing-display)] text-xl font-bold">
              {group.city}
              <span className="font-[family-name:var(--font-landing-label)] text-xs font-semibold tabular-nums text-[var(--landing-cyan)]">
                {String(group.members.length).padStart(2, "0")} himpunan
              </span>
            </h3>
            <ul className="mt-4 space-y-4">
              {group.members.map((h) => (
                <li key={h.no} className="group/h grid grid-cols-[3rem_1fr] gap-4">
                  <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-white p-1 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/h:scale-110 group-hover/h:-rotate-6">
                    <HimpunanLogo src={h.logo} name={h.name} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-landing-display)] text-base font-bold leading-tight text-[var(--landing-on-ink)]">{h.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--landing-on-ink-dim)]">{h.institution}</p>
                    {h.address ? <p className="mt-1 text-xs leading-relaxed text-[var(--landing-on-ink-dim)]/90">{h.address}</p> : null}
                    {h.email ? (
                      <a
                        href={`mailto:${h.email}`}
                        className="mt-1 inline-block break-all text-xs font-medium text-[var(--landing-cyan)] underline-offset-4 hover:underline"
                      >
                        {h.email}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}
