import Link from "next/link"
import { SplitWords } from "@/components/landing/kinetic"

/**
 * Hero ringkas untuk halaman publik turunan (/berita, /merch, /undangan):
 * bidang indigo (header melayang tetap terbaca), breadcrumb, judul per kata.
 * Memakai atribut data-hero supaya timeline masuk hero ikut berjalan.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  crumb,
  children,
}: {
  eyebrow: string
  title: string
  lead?: string
  crumb: string
  children?: React.ReactNode
}) {
  return (
    <section
      data-hero
      className="relative isolate overflow-hidden bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(55%_70%_at_85%_10%,color-mix(in_oklab,var(--landing-cyan)_22%,transparent),transparent_70%),radial-gradient(40%_50%_at_0%_100%,color-mix(in_oklab,var(--landing-accent)_22%,transparent),transparent_70%)]"
      />
      <div aria-hidden className="landing-grid absolute inset-0 -z-10 opacity-30" />
      <div data-hero-content className="mx-auto max-w-[1400px] px-6 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <nav data-hero-eyebrow aria-label="Breadcrumb" className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--landing-on-ink-dim)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="no-underline hover:text-[var(--landing-on-ink)]">
                Beranda
              </Link>
            </li>
            <li aria-hidden className="text-[var(--landing-accent)]">/</li>
            <li aria-current="page" className="text-[var(--landing-on-ink)]">
              {crumb}
            </li>
          </ol>
        </nav>
        <p className="sr-only">{eyebrow}</p>
        <h1 className="mt-6 max-w-[14ch] font-[family-name:var(--font-landing-display)] text-[clamp(2.75rem,8.5vw,7.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
          <SplitWords text={title} accentLast />
        </h1>
        {lead ? (
          <p data-hero-sub className="mt-8 max-w-[56ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-on-ink-dim)] md:text-lg">
            {lead}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  )
}
