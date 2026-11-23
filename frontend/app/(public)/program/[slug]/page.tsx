import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MagneticLink } from "@/components/landing/magnetic-link"
import { ProgramBadges } from "@/components/landing/program-badges"
import { getWorkProgram } from "@/lib/landing/fetch"
import { formatProgramDate } from "@/lib/landing/program"

// Konten dikelola lewat admin: halaman ini dirender per request supaya
// perubahan (pengurus, program, berita, merch) langsung terlihat, tanpa
// menunggu revalidate dan tanpa perlu redeploy.
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getWorkProgram((await params).slug)
  if (!item) return { title: "Program tidak ditemukan" }
  const description = item.description ? item.description.slice(0, 200) : undefined
  return {
    title: item.name,
    description,
    openGraph: { type: "website", title: item.name, description },
  }
}

/** Detail program kerja / agenda. Teks deskripsi plain (bukan HTML). */
export default async function ProgramDetailPage({ params }: Props) {
  const item = await getWorkProgram((await params).slug)
  if (!item) notFound()

  const date = formatProgramDate(item.start_date, item.end_date)
  const info = [
    { term: "Tanggal pelaksanaan", value: date },
    { term: "Lokasi", value: item.location },
    { term: "Tuan rumah", value: item.host },
    { term: "Divisi penyelenggara", value: item.division_name },
    { term: "Frekuensi", value: item.cadence },
  ].filter((row) => row.value)

  return (
    <article className="bg-[var(--landing-paper)]">
      <header data-hero className="relative isolate overflow-hidden bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]">
        <div aria-hidden className="landing-grid absolute inset-0 -z-10 opacity-30" />
        <div data-hero-content className="mx-auto max-w-[1000px] px-6 pb-14 pt-36 md:px-10 md:pb-20 md:pt-44">
          <p data-hero-eyebrow className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
            <Link href="/program" className="no-underline hover:text-[var(--landing-on-ink)]">← Semua program</Link>
          </p>
          <ProgramBadges category={item.category} status={item.status} className="mt-6" />
          <h1 data-hero-sub className="mt-6 font-[family-name:var(--font-landing-display)] text-[clamp(2.25rem,5.5vw,4.5rem)] font-extrabold leading-[1] tracking-[-0.03em]">
            {item.name}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1000px] px-6 py-16 md:px-10 md:py-24">
        {info.length > 0 ? (
        <dl data-reveal className="grid gap-px overflow-hidden rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/15 bg-[var(--landing-ink)]/15 sm:grid-cols-2">
          {info.map((row, i) => (
            <div
              key={row.term}
              // Jumlah ganjil: item terakhir melebar 2 kolom (tidak ada sel kosong).
              className={`bg-[var(--landing-paper)] p-5 md:p-6 ${info.length % 2 === 1 && i === info.length - 1 ? "sm:col-span-2" : ""}`}
            >
              <dt className="font-[family-name:var(--font-landing-label)] text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
                {row.term}
              </dt>
              <dd className="mt-1.5 text-base font-semibold text-[var(--landing-ink)]">{row.value}</dd>
            </div>
          ))}
        </dl>
        ) : null}

        {item.description ? (
          <div data-reveal className="mt-12 max-w-[68ch] whitespace-pre-line text-base leading-relaxed text-[var(--landing-ink)] md:text-lg">
            {item.description}
          </div>
        ) : null}

        <div data-reveal className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--landing-ink)]/15 pt-8">
          <p className="text-sm text-[var(--landing-ink-muted)]">Program kerja dan agenda PERMIKOMNAS Jawa Tengah.</p>
          <MagneticLink href="/program" variant="solid-ink">
            Program lainnya
          </MagneticLink>
        </div>
      </div>
    </article>
  )
}
