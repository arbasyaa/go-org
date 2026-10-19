import Link from "next/link"
import { navLinks, org } from "@/lib/landing/content"

export function SiteHeader() {
  return (
    <header className="bg-[var(--landing-paper)] border-b border-[var(--landing-ink)]/15">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="flex size-10 items-center justify-center rounded-[var(--landing-radius-sm)] bg-[var(--landing-ink)] font-[family-name:var(--font-landing-label)] text-sm font-semibold tracking-wide text-[var(--landing-parchment)]">
            VII
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-[family-name:var(--font-landing-display)] text-base font-bold text-[var(--landing-ink)]">
              PERMIKOMNAS
            </span>
            <span className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-wide text-[var(--landing-ink-soft)] uppercase">
              Jawa Tengah
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-[family-name:var(--font-landing-body)] text-sm font-medium text-[var(--landing-ink)] no-underline hover:text-[var(--landing-ink-soft)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/login"
          className="hidden rounded-[var(--landing-radius-sm)] bg-[var(--landing-ink)] px-5 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-parchment)] no-underline hover:bg-[var(--landing-ink-deep)] md:inline-block"
        >
          Masuk
        </Link>
      </div>
      <p className="sr-only">{org.fullName} — {org.region}</p>
    </header>
  )
}
