"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { PressRelease } from "@/lib/public-content"
import { storageUrl } from "@/lib/storage-url"

function shortDate(value?: string | null) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d)
}

/**
 * Daftar rilis berbentuk baris. Di pointer presisi, sampul rilis yang sedang
 * di-hover melayang mengikuti kursor (lerp di rAF) dan berganti dengan
 * transisi skala — pratinjau tanpa membuka halaman. Di sentuh, baris tetap
 * baris biasa yang bisa diketuk.
 */
export function PressHoverList({ items }: { items: PressRelease[] }) {
  const [active, setActive] = useState<number | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = previewRef.current
    if (!el || !window.matchMedia("(pointer: fine)").matches) return
    let x = 0
    let y = 0
    let frame = 0
    const loop = () => {
      x += (target.current.x - x) * 0.14
      y += (target.current.y - y) * 0.14
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  const current = active != null ? items[active] : null

  return (
    <div className="relative mt-20 md:mt-28">
      <ul
        data-stagger
        className="border-t border-[var(--landing-ink)]/15"
        onPointerMove={(e) => {
          target.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerLeave={() => setActive(null)}
      >
        {items.map((item, i) => (
          <li key={item.id} className="border-b border-[var(--landing-ink)]/15">
            <Link
              href={`/berita/${item.slug}`}
              data-cursor="Baca"
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(null)}
              className="group grid gap-2 py-7 no-underline transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:px-3 md:grid-cols-[9rem_minmax(0,1fr)_10rem_2rem] md:items-center md:gap-8 md:py-9"
            >
              <time
                dateTime={item.published_at ?? undefined}
                className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]"
              >
                {shortDate(item.published_at)}
              </time>
              <span className="font-[family-name:var(--font-landing-display)] text-xl font-bold leading-snug text-[var(--landing-ink)] transition-colors duration-300 group-hover:text-[var(--landing-accent-deep)] md:text-3xl">
                {item.title}
              </span>
              <span className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)] md:text-right">
                {item.category || "Siaran Pers"}
              </span>
              <span
                aria-hidden
                className="hidden text-2xl text-[var(--landing-ink)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-45 md:block"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 hidden w-72 [@media(pointer:fine)]:block"
      >
        <div
          className={`aspect-[4/3] overflow-hidden rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] shadow-2xl transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            current ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          {current?.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={current.id} src={storageUrl(current.cover_url)} alt="" className="size-full object-cover" />
          ) : current ? (
            <div className="flex size-full items-end bg-[var(--landing-ink)] p-5">
              <span className="line-clamp-3 font-[family-name:var(--font-landing-display)] text-lg font-extrabold text-[var(--landing-on-ink)]">
                {current.title}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
