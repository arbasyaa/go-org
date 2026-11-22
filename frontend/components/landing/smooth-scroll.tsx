"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const HEADER_OFFSET = 88
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Lenis aktif (null bila reduced-motion / belum terpasang). */
let lenisRef: Lenis | null = null
/** Hash tujuan saat pindah halaman publik → "/" (dikerjakan setelah route baru siap). */
let pendingHash: string | null = null

/** Tunggu font + 2 frame + hitung ulang ScrollTrigger: posisi target & pin final. */
async function waitForLayout() {
  await document.fonts?.ready
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  ScrollTrigger.refresh()
}

/**
 * Meluncur ke section. Jarak jauh (> 1,2 layar) tidak ditempuh penuh — itu
 * memicu semua animasi reveal + pin horizontal Program sekaligus sehingga
 * terlihat berantakan. Konten memudar sebentar, posisi dipindah ke dekat
 * target, lalu meluncur halus sisa ~0,6 layar sambil muncul kembali.
 */
function glideTo(target: HTMLElement) {
  const lenis = lenisRef
  const y = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  if (!lenis) {
    window.scrollTo({ top: y })
    return
  }
  // Batas scroll Lenis di-cache; setelah pindah halaman masih memakai tinggi
  // halaman lama (mis. /berita) sehingga scroll terpotong. Hitung ulang.
  lenis.resize()
  const distance = y - window.scrollY
  const vh = window.innerHeight
  const main = document.getElementById("konten")

  if (Math.abs(distance) <= vh * 1.2 || !main) {
    lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 1.1, easing: easeInOutCubic })
    return
  }

  gsap.to(main, {
    opacity: 0,
    duration: 0.18,
    ease: "power1.out",
    onComplete: () => {
      lenis.scrollTo(y - Math.sign(distance) * vh * 0.6, { immediate: true, force: true })
      ScrollTrigger.update()
      lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 0.9, easing: easeInOutCubic, force: true })
      gsap.to(main, { opacity: 1, duration: 0.45, ease: "power2.out" })
    },
  })
}

/**
 * Smooth scroll (Lenis) yang digerakkan ticker GSAP, sehingga scrub
 * ScrollTrigger dan interpolasi Lenis membaca frame yang sama.
 *
 * Link anchor (`/#himpunan`) dari navbar/CTA ditangkap di fase capture —
 * sebelum handler <Link> Next atau lompatan hash native — lalu:
 *  - halaman sama: glideTo(target);
 *  - halaman publik lain: navigasi client-side ke "/" lalu glideTo setelah
 *    layout siap (tanpa reload penuh, tanpa teleport).
 * `prefers-reduced-motion`: Lenis tidak dipasang, scroll native.
 */
export function SmoothScroll() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    history.scrollRestoration = "manual"

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef = lenis

    lenis.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement | null)?.closest("a")
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || !url.hash) return

      if (url.pathname === window.location.pathname) {
        const target = document.querySelector<HTMLElement>(url.hash)
        if (!target) return
        event.preventDefault()
        glideTo(target)
        history.replaceState(null, "", url.hash)
        return
      }
      // Halaman publik lain → landing: navigasi client-side, scroll menyusul.
      if (url.pathname === "/") {
        event.preventDefault()
        pendingHash = url.hash
        router.push("/", { scroll: false })
      }
    }
    // Capture: jalan sebelum onClick <Link> (yang akan melompat native).
    document.addEventListener("click", onClick, true)

    // Datang via reload/URL langsung dengan hash: mulai dari atas, lalu
    // meluncur setelah layout stabil (browser sudah melompat native duluan).
    if (window.location.hash) {
      pendingHash = window.location.hash
      lenis.scrollTo(0, { immediate: true, force: true })
    }

    return () => {
      document.removeEventListener("click", onClick, true)
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef = null
    }
  }, [router])

  // Kerjakan hash tertunda setelah route (dan animasi landing) terpasang.
  useEffect(() => {
    if (!pendingHash) return
    const hash = pendingHash
    let cancelled = false
    void waitForLayout().then(() => {
      if (cancelled) return
      pendingHash = null
      const target = document.querySelector<HTMLElement>(hash)
      if (!target) return
      glideTo(target)
      history.replaceState(null, "", hash)
    })
    return () => {
      cancelled = true
    }
  }, [pathname])

  return null
}
