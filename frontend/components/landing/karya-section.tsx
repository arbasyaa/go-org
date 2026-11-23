import Link from "next/link"
import { KaryaCard } from "@/components/landing/karya-card"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"
import type { Karya } from "@/lib/karya"

/**
 * Strip karya di landing: satu karya unggulan (like terbanyak, lalu kiriman
 * terlama) sebagai pintu masuk ke katalog /karya. Section bisa dimatikan dari
 * pengaturan landing seperti section lain.
 */
export function KaryaSection({ karya }: { karya: Karya | null }) {
  if (!karya) return null

  return (
    <section
      id="karya"
      aria-labelledby="karya-title"
      className="relative scroll-mt-24 bg-[var(--landing-paper)] text-[var(--landing-ink)]"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <SectionLabel index="06" tone="paper">
              Karya anggota
            </SectionLabel>
            <SectionTitle
              id="karya-title"
              text="Yang mereka bangun, terbuka untuk dibaca."
              className="mt-6 max-w-[18ch]"
              accentLast
            />
          </div>
          <div className="md:col-span-5 md:text-right">
            <p className="font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-ink-muted)]">
              Repositori pilihan dari himpunan anggota, dikurasi pengurus.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 md:justify-end">
              <Link
                href="/karya"
                className="rounded-full bg-[var(--landing-ink)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline"
              >
                Lihat semua karya
              </Link>
              <Link
                href="/karya/kirim"
                className="rounded-full border border-[var(--landing-ink)]/25 px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline transition-colors hover:border-[var(--landing-ink)]/60"
              >
                Kirim karya
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-[520px]" data-reveal>
          <KaryaCard karya={karya} priority />
        </div>
      </div>
    </section>
  )
}
