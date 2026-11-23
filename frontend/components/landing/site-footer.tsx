import Link from "next/link"
import { navLinks as allNavLinks, org, type NavLink } from "@/lib/landing/content"

/**
 * Footer: tiga kolom ringkas (identitas, navigasi, kontak) + satu baris kredit,
 * lalu wordmark kecil sebagai penutup. Sengaja padat: footer sebelumnya setinggi
 * lebih dari satu layar karena tiap bagian punya blok dan jarak sendiri-sendiri.
 *
 * Wordmark tetap ada (landing-motion §12 menaikkan hurufnya) tetapi pada skala
 * footer, bukan skala hero, supaya tidak bersaing dengan isi halaman.
 */
export function SiteFooter({ navLinks = allNavLinks }: { navLinks?: readonly NavLink[] }) {
  const word = "PERMIKOMNAS"

  return (
    <footer
      id="kontak"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]"
    >
      <div className="mx-auto max-w-[1400px] px-6 pb-6 pt-14 md:px-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4" data-reveal>
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo-permikomnas.webp" alt="" className="size-full object-contain" />
              </span>
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-landing-display)] text-lg font-extrabold leading-tight">
                  {org.name}
                </p>
                <p className="mt-1 font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
                  {org.region}
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-[30ch] font-[family-name:var(--font-landing-body)] text-xs leading-relaxed text-[var(--landing-on-ink-dim)]">
              {org.address}
            </p>
          </div>

          <nav aria-label="Navigasi footer" className="md:col-span-4" data-reveal>
            <h2 className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
              Navigasi
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 font-[family-name:var(--font-landing-body)] text-[0.82rem] text-[var(--landing-on-ink-dim)] no-underline transition-colors duration-300 hover:text-[var(--landing-on-ink)]"
                  >
                    <span
                      aria-hidden
                      className="h-px w-0 bg-[var(--landing-accent)] transition-[width] duration-500 group-hover:w-3"
                    />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4" data-reveal>
            <h2 className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
              Kontak
            </h2>
            <a
              href={`mailto:${org.email}`}
              className="mt-4 block break-all font-[family-name:var(--font-landing-display)] text-sm font-bold text-[var(--landing-on-ink)] underline-offset-4 hover:underline"
            >
              {org.email}
            </a>
            <ul className="mt-2 space-y-1.5 font-[family-name:var(--font-landing-body)] text-[0.82rem] text-[var(--landing-on-ink-dim)]">
              <li>
                <Link href="/undangan" className="no-underline transition-colors hover:text-[var(--landing-on-ink)]">
                  Kirim undangan kegiatan
                </Link>
              </li>
              <li>
                <Link href="/login" className="no-underline transition-colors hover:text-[var(--landing-on-ink)]">
                  Portal pengurus
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          data-reveal
          className="mt-10 flex flex-col gap-2 border-t border-[var(--landing-on-ink)]/15 pt-5 md:flex-row md:items-start md:justify-between md:gap-8"
        >
          <div className="max-w-[70ch]">
            <p className="font-[family-name:var(--font-landing-body)] text-[0.72rem] leading-relaxed text-[var(--landing-on-ink-dim)]">
              {org.credits.title}: dibuat oleh{" "}
              <span className="font-semibold text-[var(--landing-on-ink)]">{org.credits.builder}</span>. Terima kasih
              khusus kepada{" "}
              <span className="font-semibold text-[var(--landing-on-ink)]">{org.credits.thanks}</span>,{" "}
              {org.credits.thanksRole}.
            </p>
            <p className="mt-1 max-w-[80ch] font-[family-name:var(--font-landing-body)] text-[0.7rem] leading-relaxed text-[var(--landing-on-ink-dim)]">
              {org.credits.story}
            </p>
          </div>
          <p className="shrink-0 font-[family-name:var(--font-landing-body)] text-[0.72rem] text-[var(--landing-on-ink-dim)]">
            © {new Date().getFullYear()} {org.name}
          </p>
        </div>
      </div>

      <div data-wordmark aria-hidden className="overflow-hidden px-4">
        <p className="flex justify-center font-[family-name:var(--font-landing-display)] text-[clamp(1.35rem,6.4vw,3.5rem)] font-extrabold leading-[0.85] tracking-[-0.02em] text-[var(--landing-on-ink)]/60">
          {word.split("").map((ch, i) => (
            <span key={i} data-letter className="inline-block">
              {ch}
            </span>
          ))}
        </p>
      </div>
    </footer>
  )
}