import { aboutFacts, aboutParagraphs, org } from "@/lib/landing/content"
import { SectionLabel } from "@/components/landing/kinetic"

/**
 * Tentang: manifesto raksasa yang "menyala" kata demi kata mengikuti scroll
 * (pembaca benar-benar membaca sambil menggulir), lalu paragraf pendukung
 * dan tabel fakta di grid asimetris 7/5. Logo resmi melayang dengan parallax
 * sebagai lapisan kedalaman.
 */
export function AboutSection() {
  const manifesto =
    "Kami percaya kemajuan teknologi tidak berhenti di satu kampus. Kami menghimpun mahasiswa informatika dan komputer se-Jawa Tengah menjadi satu jaringan yang berbagi ilmu, sumber daya, dan panggung."

  return (
    <section
      id="tentang"
      aria-labelledby="tentang-title"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--landing-paper)] text-[var(--landing-ink)]"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="flex items-start justify-between gap-6">
          <SectionLabel index="01" tone="paper">
            Tentang perhimpunan
          </SectionLabel>
          <div
            aria-hidden
            data-parallax="0.35"
            className="pointer-events-none relative -mt-6 hidden size-40 shrink-0 rotate-6 rounded-full bg-white p-4 shadow-[0_30px_80px_-30px_rgb(39_21_110/0.45)] md:block lg:size-52"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-permikomnas.webp" alt="" className="size-full object-contain" />
          </div>
        </div>

        <h2 id="tentang-title" className="sr-only">
          Tentang {org.name}
        </h2>
        <p
          data-scrub-words
          className="mt-8 max-w-[22ch] font-[family-name:var(--font-landing-display)] text-[clamp(2rem,5.2vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em] md:-mt-16"
        >
          {manifesto.split(" ").map((w, i) => (
            <span key={i} data-sw className={/kampus|jaringan|Jawa|Tengah/.test(w) ? "text-[var(--landing-accent-deep)]" : undefined}>
              {w}{" "}
            </span>
          ))}
        </p>

        <div className="mt-20 grid gap-14 md:mt-28 md:grid-cols-12 md:gap-16">
          <div className="space-y-6 md:col-span-6 md:col-start-1" data-stagger>
            {aboutParagraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="max-w-[58ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-muted)] md:text-[1.0625rem]"
              >
                {paragraph}
              </p>
            ))}
            <p className="max-w-[58ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-muted)] md:text-[1.0625rem]">
              {org.description}
            </p>
          </div>

          <dl data-stagger className="h-fit border-t border-[var(--landing-ink)]/15 md:col-span-5 md:col-start-8">
            {aboutFacts.map((fact) => (
              <div
                key={fact.term}
                className="group grid grid-cols-[7rem_1fr] gap-4 border-b border-[var(--landing-ink)]/15 py-5 transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:pl-3"
              >
                <dt className="flex items-center gap-2 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
                  <span aria-hidden className="h-px w-0 bg-[var(--landing-accent)] transition-[width] duration-500 group-hover:w-3" />
                  {fact.term}
                </dt>
                <dd className="font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-ink)]">
                  {fact.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
