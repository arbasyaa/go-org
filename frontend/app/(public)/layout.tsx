import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google"
import { LandingMotion } from "@/components/landing/landing-motion"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { SmoothScroll } from "@/components/landing/smooth-scroll"
import { navLinks } from "@/lib/landing/content"
import { getLandingSections } from "@/lib/landing/fetch"

// Font khusus halaman publik: dimuat (dan di-preload) hanya di route (public),
// bukan di portal/login. Display: Bricolage Grotesque; body: Instrument Sans.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
})
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

/**
 * Kerangka semua halaman publik (/, /berita, /merch, /undangan): header
 * melayang, footer wordmark, smooth scroll, dan sutradara
 * animasi. `data-landing` adalah akar yang dibaca aturan fokus.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const sections = await getLandingSections()
  const links = navLinks.filter((l) => !l.section || sections[l.section])
  return (
    <div data-landing className={`${bricolage.variable} ${instrumentSans.variable} min-h-svh bg-[var(--landing-paper)] font-[family-name:var(--font-landing-body)]`}>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[var(--landing-on-ink)] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-[var(--landing-ink)]"
      >
        Lompat ke konten
      </a>
      <SiteHeader navLinks={links} />
      <main id="konten">{children}</main>
      <SiteFooter navLinks={links} />
      <SmoothScroll />
      <LandingMotion />
    </div>
  )
}
