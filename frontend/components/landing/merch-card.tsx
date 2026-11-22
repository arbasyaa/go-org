"use client"

import { useRef } from "react"
import type { MerchItem } from "@/lib/public-content"
import { formatCurrency } from "@/lib/format"
import { storageUrl } from "@/lib/storage-url"
import { cn } from "@/lib/utils"

const stockLabel: Record<string, string> = {
  ready: "Ready stock",
  preorder: "Pre-order",
  soldout: "Habis",
}

/**
 * Kartu merch dengan tilt 3D mengikuti pointer (rAF, dibatasi ±8°) dan
 * kilau yang bergeser mengikuti sudut. Foto punya lapisan kedalaman sendiri
 * (translateZ) sehingga terasa melayang di atas kartu. Tombol pesan membuka
 * order_url (WhatsApp/form) di tab baru; stok habis menonaktifkan tombol.
 */
export function MerchCard({ item, index = 0 }: { item: MerchItem; index?: number }) {
  const ref = useRef<HTMLElement>(null)
  const frame = useRef(0)
  const soldout = item.stock_status === "soldout"

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return
    const el = ref.current
    if (!el) return
    const { clientX, clientY } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      const px = (clientX - r.left) / r.width
      const py = (clientY - r.top) / r.height
      el.style.setProperty("--rx", `${(0.5 - py) * 16}deg`)
      el.style.setProperty("--ry", `${(px - 0.5) * 16}deg`)
      el.style.setProperty("--gx", `${px * 100}%`)
      el.style.setProperty("--gy", `${py * 100}%`)
    })
  }
  function onLeave() {
    cancelAnimationFrame(frame.current)
    const el = ref.current
    if (!el) return
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--ry", "0deg")
  }

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor={soldout ? undefined : "Pesan"}
      className="group relative flex flex-col rounded-[var(--landing-radius-md)] bg-[var(--landing-paper-raised)] p-3 text-[var(--landing-ink)] shadow-[0_1px_0_rgb(39_21_110/0.08),0_30px_60px_-40px_rgb(39_21_110/0.5)] transition-transform duration-300 ease-out [transform-style:preserve-3d] [transform:perspective(900px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] motion-reduce:[transform:none]"
    >
      <div className="relative aspect-square overflow-hidden rounded-[calc(var(--landing-radius-md)-4px)] bg-[var(--landing-ink)] [transform:translateZ(40px)]">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storageUrl(item.image_url)}
            alt={item.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <div aria-hidden className="landing-grid absolute inset-0 opacity-40" />
            <span className="relative font-[family-name:var(--font-landing-display)] text-6xl font-extrabold text-[var(--landing-on-ink)]/90">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgb(255_255_255/0.28),transparent_55%)]"
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 font-[family-name:var(--font-landing-label)] text-[0.65rem] font-semibold uppercase tracking-[0.12em]",
            soldout
              ? "bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]"
              : item.stock_status === "preorder"
                ? "bg-[var(--landing-on-ink)] text-[var(--landing-ink)]"
                : "bg-[var(--landing-accent-deep)] text-white"
          )}
        >
          {stockLabel[item.stock_status] ?? item.stock_status}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-5 [transform:translateZ(20px)]">
        <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
          {item.category || "Merch"}
        </p>
        <h3 className="mt-1.5 font-[family-name:var(--font-landing-display)] text-xl font-bold leading-tight">{item.name}</h3>
        {item.description ? (
          <p className="mt-2 line-clamp-2 font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-ink-muted)]">
            {item.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="font-[family-name:var(--font-landing-display)] text-lg font-extrabold tabular-nums">{formatCurrency(item.price)}</p>
          {soldout || !item.order_url ? (
            <span className="rounded-full border border-[var(--landing-ink)]/20 px-4 py-2 font-[family-name:var(--font-landing-body)] text-xs font-semibold text-[var(--landing-ink-muted)]">
              {soldout ? "Stok habis" : "Segera"}
            </span>
          ) : (
            <a
              href={item.order_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Pesan ${item.name}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--landing-ink)] px-4 py-2 font-[family-name:var(--font-landing-body)] text-xs font-semibold text-[var(--landing-on-ink)] no-underline transition-[background-color,transform] duration-300 hover:bg-[var(--landing-accent-deep)] active:scale-95"
            >
              Pesan
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
