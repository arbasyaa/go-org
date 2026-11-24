import Link from "next/link"
import type { Karya } from "@/lib/karya"
import { storageUrl } from "@/lib/storage-url"

/**
 * Kartu karya: gambar, judul, pengirim + himpunan, dan angka like.
 * Dipakai katalog /karya dan strip unggulan di landing.
 */
export function KaryaCard({ karya, priority = false }: { karya: Karya; priority?: boolean }) {
  return (
    <Link
      href={`/karya/${karya.code}`}
      className="group flex flex-col overflow-hidden rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/12 bg-[var(--landing-paper-raised)] no-underline transition-colors duration-500 hover:border-[var(--landing-ink)]/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--landing-ink)]/10">
        {karya.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storageUrl(karya.images[0])}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--landing-accent-deep)]">
          {karya.himpunan || "Tanpa himpunan"}
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-landing-display)] text-lg font-bold leading-tight text-[var(--landing-ink)]">
          {karya.title}
        </h3>
        <p className="font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink-muted)]">
          {karya.author_name}
        </p>
        <p className="mt-auto flex items-center gap-1.5 pt-4 font-[family-name:var(--font-landing-label)] text-xs font-semibold tabular-nums text-[var(--landing-ink-muted)]">
          <span aria-hidden className="text-[var(--landing-accent)]">♥</span>
          {karya.like_count} suka
        </p>
      </div>
    </Link>
  )
}
