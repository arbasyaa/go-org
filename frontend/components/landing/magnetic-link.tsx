"use client"

import Link from "next/link"
import { useRef } from "react"
import { cn } from "@/lib/utils"

type Variant = "accent" | "ghost-ink" | "ghost-paper" | "solid-ink" | "solid-paper"

const variants: Record<Variant, string> = {
  // accent-deep (bukan accent): putih di #ed3237 cuma 4.1:1, di #c8202a 5.7:1.
  accent: "bg-[var(--landing-accent-deep)] text-white [--fill:var(--landing-ink-deep)]",
  "ghost-ink":
    "border border-[var(--landing-on-ink)]/35 text-[var(--landing-on-ink)] [--fill:var(--landing-on-ink)] hover:text-[var(--landing-ink)]",
  "ghost-paper":
    "border border-[var(--landing-ink)]/30 text-[var(--landing-ink)] [--fill:var(--landing-ink)] hover:text-[var(--landing-on-ink)]",
  "solid-ink": "bg-[var(--landing-ink)] text-[var(--landing-on-ink)] [--fill:var(--landing-accent-deep)]",
  "solid-paper": "bg-[var(--landing-on-ink)] text-[var(--landing-ink)] [--fill:var(--landing-accent-deep)] hover:text-white",
}

/**
 * Tombol-link magnetik: konten tertarik ke arah pointer (dibatasi ±10px) dan
 * kembali dengan transisi pegas saat pointer pergi. Hover juga menyapu latar
 * dari bawah (fill bulat yang membesar) — umpan balik bentuk, bukan sekadar
 * ganti warna. Di perangkat sentuh / reduced-motion efek magnet tidak terasa
 * karena tidak ada pointermove presisi; tampilan tetap utuh.
 */
export function MagneticLink({
  href,
  children,
  variant = "accent",
  className,
  external,
  cursor,
  arrow = true,
}: {
  href: string
  children: React.ReactNode
  variant?: Variant
  className?: string
  external?: boolean
  cursor?: string
  arrow?: boolean
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const frame = useRef(0)

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== "mouse") return
    const el = ref.current
    if (!el) return
    const { clientX, clientY } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const dx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const dy = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      el.style.transform = `translate3d(${dx * 10}px, ${dy * 8}px, 0)`
    })
  }
  function onLeave() {
    cancelAnimationFrame(frame.current)
    if (ref.current) ref.current.style.transform = ""
  }

  const classes = cn(
    "group relative isolate inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-4 font-[family-name:var(--font-landing-body)] text-sm font-semibold no-underline transition-[transform,color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.97]",
    variants[variant],
    className
  )
  const inner = (
    <>
      <span
        aria-hidden
        className="absolute left-1/2 top-full -z-10 aspect-square w-[160%] -translate-x-1/2 rounded-full bg-[var(--fill)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[70%] motion-reduce:transition-none"
      />
      <span className="relative">{children}</span>
      {arrow ? (
        <span aria-hidden className="relative inline-flex size-5 items-center justify-center overflow-hidden">
          <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-5">
            →
          </span>
          <span className="absolute -translate-x-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0">
            →
          </span>
        </span>
      ) : null}
    </>
  )

  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        data-cursor={cursor}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    )
  }
  return (
    <Link
      ref={ref}
      href={href}
      className={classes}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor={cursor}
    >
      {inner}
    </Link>
  )
}
