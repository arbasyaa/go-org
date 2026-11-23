import Link from "next/link"
import { navLinks as allNavLinks, org, type NavLink } from "@/lib/landing/content"

/**
 * Footer: tiga kolom info + wordmark PERMIKOMNAS selebar layar yang hurufnya
 * naik bergelombang dari tengah (landing-motion §12) sebagai penutup halaman.
 */
export function SiteFooter({ navLinks = allNavLinks }: { navLinks?: readonly NavLink[] }) {
  const word = "PERMIKOMNAS"

  return (
    <footer id="kontak" className="relative scroll-mt-24 overflow-hidden bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]">
      <div className="mx-auto max-w-[1400px] px-6 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5" data-reveal>
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo-permikomnas.webp" alt="" className="size-full object-contain" />
              </span>
              <p className="font-[family-name:var(--font-landing-display)] text-2xl font-extrabold leading-tight">{org.name}</p>
            </div>
            <p className="mt-5 max-w-[38ch] font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
              {org.fullName} · {org.region}
            </p>
            <p className="mt-4 max-w-[38ch] font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-on-ink-dim)]">
              {org.address}
            </p>
          </div>

          <nav aria-label="Navigasi footer" className="md:col-span-3" data-reveal>
            <h2 className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
              Navigasi
            </h2>
            <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="group inline-flex items-center gap-2 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-on-ink-dim)] no-underline transition-colors duration-300 hover:text-[var(--landing-on-ink)]">
                    <span aria-hidden className="h-px w-0 bg-[var(--landing-accent)] transition-[width] duration-500 group-hover:w-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4" data-reveal>
            <h2 className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
              Kontak
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <a href={`mailto:${org.email}`} className="font-[family-name:var(--font-landing-display)] text-lg font-bold text-[var(--landing-on-ink)] underline-offset-4 hover:underline md:text-xl">
                  {org.email}
                </a>
              </li>
              <li>
                <Link href="/undangan" className="font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-on-ink-dim)] no-underline transition-colors hover:text-[var(--landing-on-ink)]">
                  Kirim undangan kegiatan →
                </Link>
              </li>
              <li>
                <Link href="/login" className="font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-on-ink-dim)] no-underline transition-colors hover:text-[var(--landing-on-ink)]">
                  Portal pengurus →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kredit: disebut apa adanya — siapa yang membangun, siapa yang memulai. */}
        <div
          data-reveal
          className="mt-14 grid gap-4 border-t border-[var(--landing-on-ink)]/15 pt-8 md:grid-cols-12 md:items-start"
        >
          <h2 className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)] md:col-span-3">
            {org.credits.title}
          </h2>
          <div className="md:col-span-9">
            <p className="font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-on-ink)]">
              Dibuat oleh <span className="font-semibold">{org.credits.builder}</span>.
            </p>
            <p className="mt-2 font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-on-ink-dim)]">
              Terima kasih khusus kepada <span className="font-semibold text-[var(--landing-on-ink)]">{org.credits.thanks}</span>, {org.credits.thanksRole}.
            </p>
            <p className="mt-3 max-w-[62ch] font-[family-name:var(--font-landing-body)] text-xs leading-relaxed text-[var(--landing-on-ink-dim)]">
              {org.credits.story}
            </p>
          </div>
        </div>
      </div>

      <div data-wordmark aria-hidden className="mt-16 overflow-hidden px-2 md:mt-24">
        <p className="flex justify-center font-[family-name:var(--font-landing-display)] text-[clamp(2.5rem,13.4vw,14rem)] font-extrabold leading-[0.8] tracking-[-0.05em] text-[var(--landing-on-ink)]">
          {word.split("").map((ch, i) => (
            <span key={i} data-letter className="inline-block">
              {ch}
            </span>
          ))}
        </p>
      </div>

      <div className="border-t border-[var(--landing-on-ink)]/15">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-6 md:px-10">
          <p className="font-[family-name:var(--font-landing-body)] text-xs text-[var(--landing-on-ink-dim)]">
            © {new Date().getFullYear()} {org.name}
          </p>
          <p className="font-[family-name:var(--font-landing-body)] text-xs text-[var(--landing-on-ink-dim)]">
            Garda terdepan perkembangan teknologi di Jawa Tengah
          </p>
        </div>
      </div>
    </footer>
  )
}
