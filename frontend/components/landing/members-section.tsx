import Link from "next/link"
import { cityNodes, type MemberGroup } from "@/lib/landing/content"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"
import { MembersMap } from "@/components/landing/members-map"

/**
 * Jaringan himpunan: peta titik Jawa Tengah (kiri, sticky) + direktori per
 * kota (kanan). Hover/fokus kota di direktori menyalakan titiknya di peta —
 * dua representasi data yang sama saling menunjuk.
 */
export function MembersSection({ directory: memberDirectory }: { directory: MemberGroup[] }) {
  const total = memberDirectory.reduce((sum, g) => sum + g.members.length, 0)
  const points = cityNodes.map((c) => ({
    ...c,
    count: memberDirectory.find((g) => g.city === c.name)?.members.length ?? 0,
  }))

  return (
    <section
      id="himpunan"
      aria-labelledby="himpunan-title"
      className="relative scroll-mt-24 overflow-clip bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]"
    >
      <div aria-hidden className="landing-grid absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <SectionLabel index="04">Jaringan himpunan</SectionLabel>
            <SectionTitle id="himpunan-title" text="Satu perhimpunan, banyak kampus." className="mt-6 max-w-[13ch]" accentLast />
          </div>
          <p data-reveal className="font-[family-name:var(--font-landing-display)] text-[clamp(4rem,10vw,8rem)] font-extrabold leading-none tabular-nums text-[var(--landing-cyan)]">
            <span data-counter={total}>{String(total).padStart(2, "0")}</span>
            <span className="ml-3 align-top font-[family-name:var(--font-landing-label)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--landing-on-ink-dim)]">
              himpunan
              <br />
              anggota
            </span>
          </p>
        </div>

        <MembersMap points={points} directory={memberDirectory} />

        <p data-reveal className="mt-12">
          <Link
            href="/anggota"
            data-cursor="Lihat"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-on-ink)]/25 px-6 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline transition-colors duration-300 hover:bg-[var(--landing-on-ink)] hover:text-[var(--landing-ink)]"
          >
            Lihat semua anggota
            <span aria-hidden>→</span>
          </Link>
        </p>
      </div>
    </section>
  )
}
