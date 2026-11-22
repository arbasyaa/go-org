import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatPressDate } from "@/components/landing/press-section"
import { MagneticLink } from "@/components/landing/magnetic-link"
import { getPressRelease } from "@/lib/landing/fetch"
import { org } from "@/lib/landing/content"
import { storageUrl } from "@/lib/storage-url"

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getPressRelease((await params).slug)
  if (!item) return { title: "Press release tidak ditemukan" }
  return {
    title: item.title,
    description: item.excerpt || undefined,
    openGraph: {
      type: "article",
      title: item.title,
      description: item.excerpt || undefined,
      publishedTime: item.published_at ?? undefined,
      images: item.cover_url ? [storageUrl(item.cover_url)] : undefined,
    },
  }
}

/**
 * Detail press release. Isi HTML berasal dari rich text editor admin dan
 * sudah disanitasi backend (services.SanitizeHTML) sebelum disimpan.
 */
export default async function PressDetailPage({ params }: Props) {
  const item = await getPressRelease((await params).slug)
  if (!item) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    datePublished: item.published_at,
    dateModified: item.updated_at,
    description: item.excerpt,
    publisher: { "@type": "Organization", name: org.name },
  }

  return (
    <article className="bg-[var(--landing-paper)]">
      <header data-hero className="relative isolate overflow-hidden bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]">
        <div aria-hidden className="landing-grid absolute inset-0 -z-10 opacity-30" />
        <div data-hero-content className="mx-auto max-w-[1000px] px-6 pb-14 pt-36 md:px-10 md:pb-20 md:pt-44">
          <p data-hero-eyebrow className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
            <Link href="/berita" className="no-underline hover:text-[var(--landing-on-ink)]">← Semua berita</Link>
            <span aria-hidden className="text-[var(--landing-accent)]">/</span>
            <span className="text-[var(--landing-cyan)]">{item.category || "Siaran Pers"}</span>
            <time dateTime={item.published_at ?? undefined}>{formatPressDate(item.published_at)}</time>
          </p>
          <h1 data-hero-sub className="mt-6 font-[family-name:var(--font-landing-display)] text-[clamp(2.25rem,5.5vw,4.5rem)] font-extrabold leading-[1] tracking-[-0.03em]">
            {item.title}
          </h1>
          {item.excerpt ? (
            <p data-hero-sub className="mt-6 max-w-[60ch] text-base leading-relaxed text-[var(--landing-on-ink-dim)] md:text-lg">{item.excerpt}</p>
          ) : null}
        </div>
      </header>

      {item.cover_url ? (
        <div className="mx-auto -mt-px max-w-[1200px] px-6 md:px-10">
          <div data-clip className="mt-10 aspect-[16/9] overflow-hidden rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] md:mt-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={storageUrl(item.cover_url)} alt="" className="size-full object-cover" />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
        <div data-reveal className="landing-prose" dangerouslySetInnerHTML={{ __html: item.content }} />
        <div data-reveal className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--landing-ink)]/15 pt-8">
          <p className="text-sm text-[var(--landing-ink-muted)]">
            Kontak media: <a href={`mailto:${org.email}`} className="font-semibold text-[var(--landing-ink)] underline underline-offset-4">{org.email}</a>
          </p>
          <MagneticLink href="/berita" variant="solid-ink">
            Berita lainnya
          </MagneticLink>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  )
}
