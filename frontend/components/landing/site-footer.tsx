import Link from "next/link"
import { navLinks, org } from "@/lib/landing/content"

export function SiteFooter() {
  return (
    <footer
      id="kontak"
      className="bg-[var(--landing-ink-deep)] text-[var(--landing-parchment)]"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-landing-display)] text-lg font-bold">
            {org.name}
          </p>
          <p className="mt-2 font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.14em] uppercase opacity-70">
            {org.fullName}
          </p>
          <p className="mt-6 max-w-sm font-[family-name:var(--font-landing-body)] text-sm leading-relaxed opacity-80">
            {org.address}
          </p>
        </div>

        <nav aria-label="Navigasi footer">
          <h2 className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.14em] uppercase opacity-70">
            Navigasi
          </h2>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-[family-name:var(--font-landing-body)] text-sm no-underline opacity-90 hover:opacity-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.14em] uppercase opacity-70">
            Kontak
          </h2>
          <ul className="mt-4 space-y-2">
            <li>
              <a
                href={`mailto:${org.email}`}
                className="font-[family-name:var(--font-landing-body)] text-sm no-underline underline-offset-2 opacity-90 hover:underline hover:opacity-100"
              >
                {org.email}
              </a>
            </li>
            <li>
              <Link
                href="/login"
                className="font-[family-name:var(--font-landing-body)] text-sm no-underline underline-offset-2 opacity-90 hover:underline hover:opacity-100"
              >
                Portal anggota
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--landing-parchment)]/20">
        <p className="mx-auto max-w-6xl px-6 py-6 font-[family-name:var(--font-landing-body)] text-xs opacity-70">
          © {new Date().getFullYear()} {org.name}. Garda terdepan perkembangan
          teknologi di Jawa Tengah.
        </p>
      </div>
    </footer>
  )
}
