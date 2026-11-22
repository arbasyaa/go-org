import Link from "next/link"
import type { PressRelease } from "@/lib/public-content"
import { storageUrl } from "@/lib/storage-url"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"
import { MagneticLink } from "@/components/landing/magnetic-link"
import { PressHoverList } from "@/components/landing/press-hover-list"

export function formatPressDate(value?: string | null) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d)
}

/**
 * Press release: konten CRUD (admin → /admin/press-releases).
 * Komposisi editorial: satu rilis utama besar dengan sampul ber-tirai
 * (clip reveal + zoom-out), lalu daftar baris dengan pratinjau gambar yang
 * mengikuti kursor. Bila belum ada rilis terbit, tampil empty state yang
 * tetap memberi arah (kontak media), bukan section yang hilang.
 */
export function PressSection({ items }: { items: PressRelease[] }) {
  const [featured, ...rest] = items

  return (
    <section
      id="berita"
      aria-labelledby="berita-title"
      className="relative scroll-mt-24 bg-[var(--landing-paper)] text-[var(--landing-ink)]"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <SectionLabel index="03" tone="paper">
              Press release
            </SectionLabel>
            <SectionTitle id="berita-title" text="Kabar dari wilayah." className="mt-6 max-w-[12ch]" accentLast />
          </div>
          <div data-reveal>
            <MagneticLink href="/berita" variant="ghost-paper" cursor="Semua">
              Semua siaran pers
            </MagneticLink>
          </div>
        </div>

        {featured ? (
          <>
            <article className="group mt-16 grid gap-8 md:mt-20 md:grid-cols-12 md:gap-12">
              <Link
                href={`/berita/${featured.slug}`}
                data-cursor="Baca"
                className="relative block overflow-hidden rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] md:col-span-7"
                aria-label={`Baca: ${featured.title}`}
              >
                <div data-clip className="aspect-[16/10] overflow-hidden">
                  {featured.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={storageUrl(featured.cover_url)}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  ) : (
                    <CoverFallback title={featured.title} />
                  )}
                </div>
              </Link>
              <div data-reveal className="flex flex-col md:col-span-5 md:py-4">
                <p className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
                  <span className="rounded-full bg-[var(--landing-accent-deep)] px-3 py-1 text-white">{featured.category || "Siaran Pers"}</span>
                  <time dateTime={featured.published_at ?? undefined}>{formatPressDate(featured.published_at)}</time>
                </p>
                <h3 className="mt-6 font-[family-name:var(--font-landing-display)] text-[clamp(1.75rem,3vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                  <Link href={`/berita/${featured.slug}`} className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat no-underline transition-[background-size] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[length:100%_2px]">
                    {featured.title}
                  </Link>
                </h3>
                {featured.excerpt ? (
                  <p className="mt-5 max-w-[50ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-muted)]">
                    {featured.excerpt}
                  </p>
                ) : null}
                <div className="mt-8 md:mt-auto md:pt-8">
                  <MagneticLink href={`/berita/${featured.slug}`} variant="solid-ink" cursor="Baca">
                    Baca selengkapnya
                  </MagneticLink>
                </div>
              </div>
            </article>

            {rest.length ? <PressHoverList items={rest} /> : null}
          </>
        ) : (
          <div
            data-reveal
            className="mt-16 grid gap-6 rounded-[var(--landing-radius-md)] border border-dashed border-[var(--landing-ink)]/25 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12"
          >
            <div>
              <p className="font-[family-name:var(--font-landing-display)] text-2xl font-bold">Belum ada siaran pers terbit.</p>
              <p className="mt-2 max-w-[52ch] font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-ink-muted)]">
                Rilis resmi kegiatan, prestasi, dan kerja sama wilayah akan tampil di sini. Untuk kebutuhan media, hubungi divisi PR melalui sekretariat.
              </p>
            </div>
            <MagneticLink href="/#kontak" variant="ghost-paper">
              Kontak media
            </MagneticLink>
          </div>
        )}
      </div>
    </section>
  )
}

/** Sampul pengganti: tipografi di atas bidang indigo, tetap terasa disengaja. */
export function CoverFallback({ title }: { title: string }) {
  return (
    <div className="relative flex size-full items-end overflow-hidden bg-[var(--landing-ink)] p-6 md:p-8">
      <div aria-hidden className="landing-grid absolute inset-0 opacity-50" />
      <div
        aria-hidden
        className="absolute -right-16 -top-16 size-64 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--landing-cyan)_45%,transparent),transparent_70%)]"
      />
      <p aria-hidden className="relative line-clamp-3 font-[family-name:var(--font-landing-display)] text-[clamp(1.25rem,2.6vw,2.25rem)] font-extrabold leading-tight text-[var(--landing-on-ink)]">
        {title}
      </p>
    </div>
  )
}
