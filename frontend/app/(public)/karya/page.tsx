import Link from "next/link"
import { PageHero } from "@/components/landing/page-hero"
import { KaryaCard } from "@/components/landing/karya-card"
import { getKaryaList } from "@/lib/karya"
import { getHimpunan } from "@/lib/landing/fetch"

export const metadata = {
  title: "Karya Anggota",
  description: "Showcase repositori karya himpunan anggota PERMIKOMNAS Wilayah VII Jawa Tengah.",
}

// Karya dikurasi admin: halaman ini dirender per request supaya keputusan
// kurasi langsung terlihat tanpa menunggu revalidate.
export const dynamic = "force-dynamic"

type Props = { searchParams: Promise<{ himpunan?: string; sort?: string }> }

export default async function KaryaIndexPage({ searchParams }: Props) {
  const params = await searchParams
  const himpunanID = Number(params.himpunan) || 0
  const sort = params.sort === "new" ? "new" : "likes"
  const [list, himpunan] = await Promise.all([getKaryaList({ himpunanID, sort }), getHimpunan()])
  const aktif = himpunan.find((h) => h.no === himpunanID)

  return (
    <>
      <PageHero
        crumb="Karya"
        eyebrow="Showcase repositori"
        title="Karya anggota."
        lead="Repositori yang dibangun anggota himpunan se-Jawa Tengah, dikurasi pengurus. Baca penjelasannya, lalu buka kodenya."
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/karya/kirim"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--landing-accent)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink-deep)] no-underline transition-transform duration-300 hover:-translate-y-0.5"
          >
            Kirim karya
          </Link>
          <Link
            href="/karya/status"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-on-ink)]/25 px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline transition-colors duration-300 hover:border-[var(--landing-on-ink)]/60"
          >
            Cek status kiriman
          </Link>
        </div>
      </PageHero>

      <section aria-label="Katalog karya" className="bg-[var(--landing-paper)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--landing-ink)]/15 pb-4">
            <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
              {list.total} karya
              {aktif ? ` · ${himpunanLabel(aktif)}${aktif.institution ? ` — ${aktif.institution}` : ""}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <FilterLink href={`/karya?sort=new${himpunanID ? `&himpunan=${himpunanID}` : ""}`} active={sort === "new"}>
                Terbaru
              </FilterLink>
              <FilterLink href={`/karya${himpunanID ? `?himpunan=${himpunanID}` : ""}`} active={sort === "likes"}>
                Paling disukai
              </FilterLink>
            </div>
          </div>

          <details className="mt-4 md:hidden">
            <summary className="cursor-pointer font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)]">
              Filter himpunan
            </summary>
            <HimpunanFilter himpunan={himpunan} activeID={himpunanID} sort={sort} />
          </details>
          <div className="mt-4 hidden md:block">
            <HimpunanFilter himpunan={himpunan} activeID={himpunanID} sort={sort} />
          </div>

          {list.items.length ? (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((k, i) => (
                <li key={k.id} data-reveal>
                  <KaryaCard karya={k} priority={i < 3} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-16 rounded-[var(--landing-radius-md)] border border-dashed border-[var(--landing-ink)]/25 p-10 text-center">
              <p className="font-[family-name:var(--font-landing-display)] text-xl font-bold text-[var(--landing-ink)]">
                Belum ada karya yang tayang.
              </p>
              <p className="mx-auto mt-2 max-w-[42ch] font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink-muted)]">
                Kiriman yang lolos kurasi akan muncul di sini. Jadi yang pertama mengirimkan repo karyamu.
              </p>
              <Link
                href="/karya/kirim"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--landing-ink)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline"
              >
                Kirim karya
              </Link>
            </div>
          )}

          <p className="mt-14 border-t border-[var(--landing-ink)]/15 pt-6 font-[family-name:var(--font-landing-body)] text-xs text-[var(--landing-ink-muted)]">
            Sebelum mengirim, baca{" "}
            <Link href="/karya/snk" className="font-semibold text-[var(--landing-ink)] underline underline-offset-4">
              Syarat &amp; Ketentuan
            </Link>{" "}
            pengajuan karya. Karya dikurasi pengurus sebelum tayang.
          </p>
        </div>
      </section>
    </>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "rounded-full bg-[var(--landing-ink)] px-4 py-1.5 font-[family-name:var(--font-landing-body)] text-xs font-semibold text-[var(--landing-on-ink)] no-underline"
          : "rounded-full border border-[var(--landing-ink)]/20 px-4 py-1.5 font-[family-name:var(--font-landing-body)] text-xs font-semibold text-[var(--landing-ink)] no-underline transition-colors hover:border-[var(--landing-ink)]/60"
      }
    >
      {children}
    </Link>
  )
}

/**
 * Filter memakai label yang sama dengan marquee di landing (`short_label`, jatuh
 * ke `name` bila kosong), bukan nama resmi, supaya satu himpunan tidak muncul
 * dengan dua ejaan di dua tempat. Kampusnya ditampilkan sebagai tooltip dan teks
 * bantu, karena banyak label hanya singkatan ("HMP", "HMJ-I") yang tidak
 * menjelaskan apa pun tanpa nama kampusnya.
 */
function himpunanLabel(h: { name: string; shortLabel?: string }) {
  return h.shortLabel || h.name
}

function HimpunanFilter({
  himpunan,
  activeID,
  sort,
}: {
  himpunan: { no: number; name: string; shortLabel?: string; institution?: string }[]
  activeID: number
  sort: string
}) {
  const suffix = sort === "new" ? "&sort=new" : ""
  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <Link
          href={`/karya${sort === "new" ? "?sort=new" : ""}`}
          aria-current={activeID === 0 ? "true" : undefined}
          className={
            activeID === 0
              ? "rounded-full border border-[var(--landing-ink)] px-3 py-1 font-[family-name:var(--font-landing-body)] text-xs font-semibold text-[var(--landing-ink)] no-underline"
              : "rounded-full border border-transparent px-3 py-1 font-[family-name:var(--font-landing-body)] text-xs text-[var(--landing-ink-muted)] no-underline hover:text-[var(--landing-ink)]"
          }
        >
          Semua
        </Link>
      </li>
      {himpunan.map((h) => (
        <li key={h.no}>
          <Link
            href={`/karya?himpunan=${h.no}${suffix}`}
            aria-current={activeID === h.no ? "true" : undefined}
            title={h.institution ? `${h.name} — ${h.institution}` : h.name}
            className={
              activeID === h.no
                ? "rounded-full border border-[var(--landing-ink)] px-3 py-1 font-[family-name:var(--font-landing-body)] text-xs font-semibold text-[var(--landing-ink)] no-underline"
                : "rounded-full border border-transparent px-3 py-1 font-[family-name:var(--font-landing-body)] text-xs text-[var(--landing-ink-muted)] no-underline hover:text-[var(--landing-ink)]"
            }
          >
            {himpunanLabel(h)}
          </Link>
        </li>
      ))}
    </ul>
  )
}
