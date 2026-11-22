"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { navLinks as allNavLinks, org, type NavLink } from "@/lib/landing/content"
import { cn } from "@/lib/utils"

/**
 * Header melayang: pil gelap ber-blur yang terbaca di atas bidang indigo
 * maupun paper. Bersembunyi saat menggulir turun, muncul lagi saat naik
 * (ruang baca maksimal). Di bawah lg, menu menjadi panel layar penuh dengan
 * tautan raksasa yang masuk bergiliran.
 */
export function SiteHeader({ navLinks = allNavLinks }: { navLinks?: readonly NavLink[] }) {
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled()
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  // Tutup menu saat pindah halaman (disesuaikan saat render, bukan di effect).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }
  // Kunci scroll body selagi menu terbuka.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : ""
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    menuRef.current?.querySelector("a")?.focus()
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4"
        )}
      >
        <div
          className={cn(
            "relative mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 overflow-hidden rounded-full border pl-2 pr-2 transition-[background-color,border-color,box-shadow] duration-500 md:h-16 md:pl-3",
            scrolled || open
              ? "border-[var(--landing-on-ink)]/10 bg-[var(--landing-ink-deep)]/95 shadow-[0_12px_40px_-12px_rgb(27_14_77/0.5)]"
              : "border-transparent bg-transparent"
          )}
        >
          <span
            aria-hidden
            data-progress
            className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-[var(--landing-accent)]"
          />

          <Link href="/" className="flex items-center gap-3 rounded-full pr-2 no-underline" aria-label={`${org.name} — beranda`}>
            <span className="flex size-10 items-center justify-center rounded-full bg-white p-1 md:size-11">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-permikomnas.webp" alt="" className="size-full object-contain" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-landing-display)] text-sm font-extrabold text-[var(--landing-on-ink)]">
                PERMIKOMNAS
              </span>
              <span className="mt-1 font-[family-name:var(--font-landing-label)] text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
                Wilayah VII · Jateng
              </span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group relative block overflow-hidden rounded-full px-3.5 py-2 font-[family-name:var(--font-landing-body)] text-sm font-medium text-[var(--landing-on-ink-dim)] no-underline transition-colors duration-300 hover:bg-[var(--landing-on-ink)]/10 hover:text-[var(--landing-on-ink)]"
                  >
                    {/* Teks bergulir: salinan kedua naik menggantikan yang pertama. */}
                    <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full motion-reduce:transition-none">
                      {link.label}
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 top-full block py-2 text-[var(--landing-on-ink)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full motion-reduce:transition-none"
                    >
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full bg-[var(--landing-on-ink)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline transition-[background-color,color,transform] duration-300 hover:bg-[var(--landing-accent-deep)] hover:text-white active:scale-95 sm:inline-block"
            >
              Portal pengurus
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              className="relative flex size-11 items-center justify-center rounded-full bg-[var(--landing-on-ink)]/10 lg:hidden"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute h-0.5 w-5 rounded-full bg-[var(--landing-on-ink)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  open ? "rotate-45" : "-translate-y-1"
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute h-0.5 w-5 rounded-full bg-[var(--landing-on-ink)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  open ? "-rotate-45" : "translate-y-1"
                )}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuRef}
        inert={!open}
        data-lenis-prevent
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-[var(--landing-ink-deep)] px-6 pb-8 pt-28 transition-[clip-path] duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] lg:hidden",
          open ? "[clip-path:circle(150%_at_100%_0%)]" : "[clip-path:circle(0%_at_100%_0%)]"
        )}
      >
        <nav aria-label="Navigasi ponsel">
          <ul className="space-y-1">
            {navLinks.map((link, i) => (
              <li key={link.href} className="overflow-hidden">
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${180 + i * 50}ms` : "0ms" }}
                  className={cn(
                    "flex items-baseline gap-4 py-1.5 font-[family-name:var(--font-landing-display)] text-[clamp(2.25rem,10vw,3.5rem)] font-extrabold leading-none text-[var(--landing-on-ink)] no-underline transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    open ? "translate-y-0" : "translate-y-full"
                  )}
                >
                  <span className="font-[family-name:var(--font-landing-label)] text-xs font-semibold tabular-nums text-[var(--landing-accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-[var(--landing-on-ink)]/15 pt-6">
          <Link
            href="/login"
            className="rounded-full bg-[var(--landing-on-ink)] px-6 py-4 text-center font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline"
          >
            Masuk portal pengurus
          </Link>
          <a
            href={`mailto:${org.email}`}
            className="text-center font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-on-ink-dim)]"
          >
            {org.email}
          </a>
        </div>
      </div>
    </>
  )
}

/**
 * Navbar selalu tampil (sticky); state hanya "sudah lewat 24px" untuk latar.
 * Satu pembacaan scrollY per frame, setState hanya saat nilainya berubah.
 */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24)
        frame = 0
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return scrolled
}
