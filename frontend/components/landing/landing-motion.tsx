"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Sutradara animasi seluruh halaman publik (landing, /berita, /merch,
 * /undangan).
 *
 * Satu komponen, satu gsap.context: urutan registrasi ScrollTrigger dapat
 * diprediksi dan cleanup sekali jalan. Dipasang di layout (public) dan
 * dijalankan ulang tiap pathname berubah, sehingga navigasi client-side ikut
 * mendapat animasi.
 *
 * Kosakata atribut (semua opsional, komponen cukup menandai elemen):
 *   data-hero-*        timeline masuk hero (eyebrow → kata → sub → aksi)
 *   data-split         judul: kata [data-word] naik dari balik tirai
 *   data-reveal        blok: naik + fade, sekali
 *   data-stagger       induk: anak langsung masuk bergiliran 60ms
 *   data-clip          media: tirai clip-path terbuka dari bawah
 *   data-parallax=n    lapisan bergerak n×100% tinggi sendiri saat discroll
 *   data-scrub-words   paragraf: kata menyala satu per satu mengikuti scroll
 *   data-counter=n     angka menghitung dari 0
 *   data-hscroll       section dipin, track [data-hscroll-track] digeser
 *                      horizontal (≥1024px saja)
 *   data-marquee-track loop horizontal yang membalik arah mengikuti scroll
 *   data-progress      garis progres baca di header
 *   data-wordmark      huruf [data-letter] wordmark footer naik bergelombang
 *
 * prefers-reduced-motion: tidak ada yang disembunyikan; semua langsung di
 * posisi akhir. Tanpa JS pun konten terbaca karena state awal di-set GSAP,
 * bukan CSS.
 */
export function LandingMotion() {
  const pathname = usePathname()

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    const ease = "expo.out"
    let mm: gsap.MatchMedia | null = null
    const ctx = gsap.context(() => {
      // 1. Hero: orkestrasi urutan baca. Offset 80-120ms antar lapisan.
      if (document.querySelector("[data-hero]")) {
        const tl = gsap.timeline({ defaults: { ease }, delay: 0.15 })
        tl.from("[data-hero-eyebrow]", { y: 24, opacity: 0, duration: 0.9 })
          .from(
            "[data-hero] [data-word]",
            { yPercent: 120, rotate: 4, duration: 1.3, stagger: 0.09 },
            "-=0.6"
          )
          .from("[data-hero-sub]", { y: 28, opacity: 0, duration: 1 }, "-=0.9")
          .from("[data-hero-cta]", { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, "-=0.8")
          .from("[data-hero-stat]", { y: 30, opacity: 0, duration: 0.9, stagger: 0.07 }, "-=0.7")
          .from("[data-hero-canvas]", { opacity: 0, scale: 1.06, duration: 2.2 }, 0)

        // Hero menjauh saat discroll: konten naik lebih cepat dari kanvas
        // (dua kecepatan = kedalaman), lalu memudar ke section berikut.
        gsap.to("[data-hero-content]", {
          yPercent: -18,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
        })
        gsap.to("[data-hero-canvas]", {
          yPercent: 12,
          scale: 1.08,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
        })
      }

      // 2. Judul section: tirai per kata.
      for (const el of gsap.utils.toArray<HTMLElement>("[data-split]")) {
        if (el.closest("[data-hero]")) continue
        gsap.from(el.querySelectorAll("[data-word]"), {
          yPercent: 115,
          rotate: 3,
          duration: 1.15,
          ease,
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        })
      }

      // 3. Blok umum: naik + fade (tidak pernah fade saja).
      for (const el of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 1.1,
          ease,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        })
      }

      // 4. Grup bergiliran: kartu, baris, statistik.
      for (const group of gsap.utils.toArray<HTMLElement>("[data-stagger]")) {
        gsap.from(group.children, {
          y: 48,
          opacity: 0,
          scale: 0.97,
          duration: 1,
          ease,
          stagger: 0.06,
          scrollTrigger: { trigger: group, start: "top 88%", once: true },
        })
      }

      // 5. Media: tirai clip-path + zoom-out kecil (kontinuitas zoom).
      for (const el of gsap.utils.toArray<HTMLElement>("[data-clip]")) {
        const img = el.querySelector("img")
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } })
        tl.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" }
        )
        if (img) tl.from(img, { scale: 1.3, duration: 1.8, ease }, 0)
      }

      // 6. Parallax lapisan.
      for (const el of gsap.utils.toArray<HTMLElement>("[data-parallax]")) {
        const amount = Number(el.dataset.parallax) || 0.15
        gsap.to(el, {
          yPercent: amount * -100,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        })
      }

      // 7. Manifesto: kata menyala mengikuti scroll (baca sambil menggulir).
      for (const el of gsap.utils.toArray<HTMLElement>("[data-scrub-words]")) {
        gsap.fromTo(
          el.querySelectorAll("[data-sw]"),
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
          }
        )
      }

      // 8. Angka menghitung.
      for (const el of gsap.utils.toArray<HTMLElement>("[data-counter]")) {
        const target = Number(el.dataset.counter) || 0
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v)).padStart(2, "0")
          },
        })
      }

      // 9. Program: pin + geser horizontal di layar lebar.
      mm = gsap.matchMedia()
      mm.add("(min-width: 1024px)", () => {
        const section = document.querySelector<HTMLElement>("[data-hscroll]")
        const track = section?.querySelector<HTMLElement>("[data-hscroll-track]")
        if (!section || !track) return
        const distance = () => track.scrollWidth - window.innerWidth
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        })
        // Kartu sedikit miring saat bergerak lalu tegak: rasa inersia.
        for (const card of gsap.utils.toArray<HTMLElement>("[data-hscroll-card]")) {
          gsap.from(card, {
            rotate: 4,
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: "left right",
              end: "left 55%",
              scrub: true,
            },
          })
        }
      })

      // 10. Marquee: loop konstan, arah ikut arah scroll.
      for (const track of gsap.utils.toArray<HTMLElement>("[data-marquee-track]")) {
        const dir = track.dataset.marqueeReverse ? 1 : -1
        const loop = gsap.fromTo(
          track,
          { xPercent: dir === -1 ? 0 : -50 },
          { xPercent: dir === -1 ? -50 : 0, duration: Number(track.dataset.marqueeDuration) || 32, ease: "none", repeat: -1 }
        )
        const st = ScrollTrigger.create({
          trigger: track,
          start: "top bottom",
          end: "bottom top",
          // Loop tak berujung hanya jalan saat marquee terlihat: di luar
          // viewport tidak ada repaint/composite sia-sia.
          onToggle: (self) => void (self.isActive ? loop.resume() : loop.pause()),
          onUpdate: (self) => {
            gsap.to(loop, {
              timeScale: self.direction * Math.min(4, 1 + Math.abs(self.getVelocity()) / 600),
              duration: 0.3,
              overwrite: true,
              onComplete: () => void gsap.to(loop, { timeScale: self.direction, duration: 1 }),
            })
          },
        })
        if (!st.isActive) loop.pause()
      }

      // 11. Progres baca.
      gsap.fromTo(
        "[data-progress]",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        }
      )

      // 12. Wordmark footer: gelombang huruf.
      for (const el of gsap.utils.toArray<HTMLElement>("[data-wordmark]")) {
        gsap.from(el.querySelectorAll("[data-letter]"), {
          yPercent: 100,
          duration: 1.2,
          ease,
          stagger: { each: 0.045, from: "center" },
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
        })
      }
    })

    // Font & gambar mengubah tinggi → hitung ulang posisi trigger.
    const refresh = () => ScrollTrigger.refresh()
    void document.fonts?.ready.then(refresh)
    window.addEventListener("load", refresh)

    // Animasi CSS tak berujung (pulse titik peta SVG, ping, nudge) dijeda saat
    // section-nya di luar layar: animasi SVG tidak ter-composite di GPU, jadi
    // tanpa ini browser me-repaint tiap frame walau tidak terlihat.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting)
      },
      { rootMargin: "200px 0px" }
    )
    for (const el of document.querySelectorAll("[data-landing] section")) io.observe(el)

    return () => {
      io.disconnect()
      window.removeEventListener("load", refresh)
      mm?.revert()
      ctx.revert()
    }
  }, [pathname])

  return null
}
