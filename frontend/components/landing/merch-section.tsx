import type { MerchItem } from "@/lib/public-content"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"
import { MagneticLink } from "@/components/landing/magnetic-link"
import { MerchCard } from "@/components/landing/merch-card"

/**
 * Merch resmi (CRUD admin → /admin/merch). Landing menampilkan maksimal 4
 * item; katalog lengkap di /merch. Marquee teks di belakang memberi energi
 * "drop" tanpa gambar tambahan. Kosong → teaser "segera rilis".
 */
export function MerchSection({ items }: { items: MerchItem[] }) {
  const shown = items.slice(0, 4)

  return (
    <section
      id="merch"
      aria-labelledby="merch-title"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--landing-paper)] text-[var(--landing-ink)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-24 overflow-hidden opacity-[0.07]">
        <div
          data-marquee-track
          data-marquee-reverse
          className="flex w-max whitespace-nowrap font-[family-name:var(--font-landing-display)] text-[clamp(6rem,16vw,14rem)] font-extrabold uppercase leading-none"
        >
          {[0, 1].map((c) => (
            <span key={c} className="pr-12">
              Official Merch ✦ Wilayah VII ✦ Official Merch ✦ Wilayah VII ✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <SectionLabel index="06" tone="paper">
              Merch resmi
            </SectionLabel>
            <SectionTitle id="merch-title" text="Pakai identitasmu." className="mt-6 max-w-[10ch]" accentLast />
            <p data-reveal className="mt-6 max-w-[46ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-muted)]">
              Koleksi resmi PERMIKOMNAS Jawa Tengah, dikelola divisi Kewirausahaan. Hasil penjualan kembali ke program kerja wilayah.
            </p>
          </div>
          <div data-reveal>
            <MagneticLink href="/merch" variant="solid-ink" cursor="Katalog">
              Lihat katalog
            </MagneticLink>
          </div>
        </div>

        {shown.length ? (
          <div data-stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((item, i) => (
              <div key={item.id}>
                <MerchCard item={item} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div
            data-reveal
            className="relative mt-16 overflow-hidden rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] p-8 text-[var(--landing-on-ink)] md:p-14"
          >
            <div aria-hidden className="landing-grid absolute inset-0 opacity-40" />
            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--landing-cyan)]">
                  Segera rilis
                </p>
                <p className="mt-3 font-[family-name:var(--font-landing-display)] text-3xl font-extrabold md:text-4xl">
                  Koleksi perdana sedang disiapkan.
                </p>
                <p className="mt-3 max-w-[50ch] font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-on-ink-dim)]">
                  Kaos, jaket, dan aksesoris resmi wilayah akan tersedia di sini. Pantau terus halaman ini.
                </p>
              </div>
              <MagneticLink href="/merch" variant="solid-paper">
                Buka halaman merch
              </MagneticLink>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
