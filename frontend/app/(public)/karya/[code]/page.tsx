import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { KaryaLike } from "@/components/landing/karya-like"
import { getKaryaByCode } from "@/lib/karya"
import { storageUrl } from "@/lib/storage-url"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const karya = await getKaryaByCode((await params).code)
  if (!karya) return { title: "Karya tidak ditemukan" }
  const description = `${karya.title} oleh ${karya.author_name} (${karya.himpunan}) — showcase karya PERMIKOMNAS Jawa Tengah.`
  return {
    title: karya.title,
    description,
    openGraph: { type: "article", title: karya.title, description },
  }
}

/** Detail karya: markdown sudah dirender server (goldmark, tanpa raw HTML). */
export default async function KaryaDetailPage({ params }: Props) {
  const karya = await getKaryaByCode((await params).code)
  if (!karya) notFound()

  return (
    <article className="bg-[var(--landing-paper)] text-[var(--landing-ink)]">
      <div className="mx-auto max-w-[1400px] px-6 pt-32 md:px-10 md:pt-40">
        <nav aria-label="Breadcrumb" className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--landing-ink-muted)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="no-underline hover:text-[var(--landing-ink)]">Beranda</Link></li>
            <li aria-hidden className="text-[var(--landing-accent-deep)]">/</li>
            <li><Link href="/karya" className="no-underline hover:text-[var(--landing-ink)]">Karya</Link></li>
            <li aria-hidden className="text-[var(--landing-accent-deep)]">/</li>
            <li aria-current="page">{karya.title}</li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-deep)]">
              {karya.himpunan}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-landing-display)] text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              {karya.title}
            </h1>
            <p className="mt-4 font-[family-name:var(--font-landing-body)] text-base text-[var(--landing-ink-muted)]">
              oleh {karya.author_name}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={karya.repo_url}
                target="_blank"
                rel="nofollow noopener ugc"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--landing-ink)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline transition-transform duration-300 hover:-translate-y-0.5"
              >
                Buka repositori
              </a>
              <KaryaLike code={karya.code} initial={karya.like_count} />
            </div>
          </div>
          <div className="md:col-span-5">
            {karya.image_url ? (
              <div className="overflow-hidden rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={storageUrl(karya.image_url)} alt="" className="w-full object-cover" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-[var(--landing-ink)]/15 pt-10 md:grid-cols-12">
          <div className="md:col-span-8">
            {/* HTML dari RenderKaryaMarkdown: goldmark tanpa raw HTML + SanitizeHTML. */}
            <div className="landing-prose" dangerouslySetInnerHTML={{ __html: karya.about_html ?? "" }} />
          </div>
          <aside className="md:col-span-4">
            <dl className="space-y-3 rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/12 bg-[var(--landing-paper-raised)] p-5 font-[family-name:var(--font-landing-body)] text-sm">
              <div>
                <dt className="font-[family-name:var(--font-landing-label)] text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--landing-ink-muted)]">Pengirim</dt>
                <dd className="mt-1 font-semibold text-[var(--landing-ink)]">{karya.author_name}</dd>
              </div>
              <div>
                <dt className="font-[family-name:var(--font-landing-label)] text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--landing-ink-muted)]">Asal himpunan</dt>
                <dd className="mt-1 text-[var(--landing-ink)]">{karya.himpunan}</dd>
              </div>
              <div>
                <dt className="font-[family-name:var(--font-landing-label)] text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--landing-ink-muted)]">Repositori</dt>
                <dd className="mt-1 break-all text-[var(--landing-ink)]">{karya.repo_url.replace("https://github.com/", "github.com/")}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="py-16">
          <Link href="/karya" className="font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline underline-offset-4 hover:underline">
            ← Semua karya
          </Link>
        </div>
      </div>
    </article>
  )
}
