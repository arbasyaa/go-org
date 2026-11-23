import Link from "next/link"
import { CoverFallback, formatPressDate } from "@/components/landing/press-section"
import { PageHero } from "@/components/landing/page-hero"
import { getPressReleases } from "@/lib/landing/fetch"
import { storageUrl } from "@/lib/storage-url"

export const metadata = {
  title: "Press Release",
  description: "Siaran pers dan kabar resmi PERMIKOMNAS Wilayah VII Jawa Tengah.",
}

// Konten dikelola lewat admin: halaman ini dirender per request supaya
// perubahan (pengurus, program, berita, merch) langsung terlihat, tanpa
// menunggu revalidate dan tanpa perlu redeploy.
export const dynamic = "force-dynamic"

/** /berita: arsip seluruh press release terbit, grid editorial 2 kolom. */
export default async function PressIndexPage() {
  const items = await getPressReleases(50)

  return (
    <>
      <PageHero
        crumb="Berita"
        eyebrow="Press release"
        title="Kabar dari wilayah."
        lead="Siaran pers resmi kegiatan, prestasi, dan kerja sama PERMIKOMNAS Jawa Tengah."
      />
      <section aria-label="Daftar press release" className="bg-[var(--landing-paper)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
          {items.length ? (
            <ul data-stagger className="grid gap-x-8 gap-y-14 md:grid-cols-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={`/berita/${item.slug}`} data-cursor="Baca" className="group block text-[var(--landing-ink)] no-underline">
                    <div className="aspect-[16/10] overflow-hidden rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)]">
                      {item.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={storageUrl(item.cover_url)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" />
                      ) : (
                        <CoverFallback title={item.title} />
                      )}
                    </div>
                    <p className="mt-5 flex flex-wrap gap-3 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
                      <span className="text-[var(--landing-accent-deep)]">{item.category || "Siaran Pers"}</span>
                      <time dateTime={item.published_at ?? undefined}>{formatPressDate(item.published_at)}</time>
                    </p>
                    <h2 className="mt-3 font-[family-name:var(--font-landing-display)] text-2xl font-extrabold leading-tight transition-colors group-hover:text-[var(--landing-accent-deep)] md:text-3xl">
                      {item.title}
                    </h2>
                    {item.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--landing-ink-muted)] md:text-base">{item.excerpt}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p data-reveal className="rounded-[var(--landing-radius-md)] border border-dashed border-[var(--landing-ink)]/25 p-10 text-center font-[family-name:var(--font-landing-display)] text-xl font-bold text-[var(--landing-ink)]">
              Belum ada siaran pers terbit.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
