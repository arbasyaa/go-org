import { hero, org, type MemberIndexItem } from "@/lib/landing/content"
import { SplitWords } from "@/components/landing/kinetic"
import { MagneticLink } from "@/components/landing/magnetic-link"
import { NetworkCanvas } from "@/components/landing/network-canvas"

/**
 * Hero: kanvas jaringan kota-kota Jawa Tengah sebagai subjek visual (kanan),
 * judul raksasa yang naik per kata (kiri, asimetris), lalu baris statistik
 * dan marquee himpunan sebagai "kaki" yang mengintip section berikut.
 *
 * Tiga lapisan gerak: kanvas (ambient, paket data mengalir), konten
 * (timeline masuk), dan scroll (konten naik lebih cepat dari kanvas).
 */
export function HeroSection({
  memberIndex,
  stats,
}: {
  memberIndex: MemberIndexItem[]
  stats: { value: number; label: string }[]
}) {
  return (
    <section
      id="hero"
      data-hero
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[var(--landing-ink-deep)] text-[var(--landing-on-ink)]"
    >
      {/* Latar: gradien radial dari warna logo + grid + grain. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(60%_55%_at_75%_35%,color-mix(in_oklab,var(--landing-cyan)_22%,transparent),transparent_70%),radial-gradient(45%_40%_at_10%_95%,color-mix(in_oklab,var(--landing-accent)_20%,transparent),transparent_70%),linear-gradient(180deg,var(--landing-ink-deep),var(--landing-ink))]"
      />
      <div aria-hidden className="landing-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(80%_70%_at_60%_40%,black,transparent)]" />
      <div aria-hidden className="landing-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.12]" />

      <div data-hero-canvas className="absolute inset-0 -z-10">
        <NetworkCanvas className="size-full" />
      </div>

      <div
        data-hero-content
        className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 pb-10 pt-28 md:px-10 md:pt-32"
      >
        <p
          data-hero-eyebrow
          className="flex flex-wrap items-center gap-x-3 gap-y-2 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--landing-on-ink-dim)]"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--landing-accent)] opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--landing-accent)]" />
          </span>
          {org.region}
          <span className="text-[var(--landing-cyan)]">/ periode 2026–2027</span>
        </p>

        <h1
          id="hero-title"
          className="mt-6 max-w-[11ch] font-[family-name:var(--font-landing-display)] text-[clamp(3.4rem,10vw,8.75rem)] font-extrabold leading-[0.86] tracking-[-0.045em]"
        >
          <SplitWords text={hero.title} accentLast />
        </h1>

        <div className="mt-8 grid gap-8 md:mt-10 md:max-w-[46rem]">
          <p
            data-hero-sub
            className="max-w-[48ch] font-[family-name:var(--font-landing-body)] text-[1.0625rem] leading-relaxed text-[var(--landing-on-ink-dim)] md:text-lg"
          >
            {hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span data-hero-cta>
              <MagneticLink href={hero.primaryCta.href} variant="accent" cursor="Jelajah">
                {hero.primaryCta.label}
              </MagneticLink>
            </span>
            <span data-hero-cta>
              <MagneticLink href="/undangan" variant="ghost-ink" cursor="Undang">
                Undang kami ke acaramu
              </MagneticLink>
            </span>
          </div>
        </div>

        <dl className="mt-14 grid max-w-[56rem] grid-cols-2 gap-px overflow-hidden rounded-[var(--landing-radius-md)] border border-[var(--landing-on-ink)]/12 bg-[var(--landing-on-ink)]/12 md:mt-12 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              data-hero-stat
              className="flex flex-col gap-1 bg-[var(--landing-ink-deep)]/80 p-4 backdrop-blur-sm md:p-5"
            >
              <dt className="order-2 font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--landing-on-ink-dim)]">
                {s.label}
              </dt>
              <dd className="order-1 font-[family-name:var(--font-landing-display)] text-3xl font-extrabold tabular-nums md:text-4xl">
                <span data-counter={s.value}>{String(s.value).padStart(2, "0")}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Marquee kampus anggota + indikator gulir. */}
      <div className="relative border-y border-[var(--landing-on-ink)]/15 bg-[var(--landing-ink-deep)]/60 py-4 backdrop-blur-sm">
        <div className="overflow-hidden">
          <div
            data-marquee-track
            data-marquee-duration="150"
            className="flex w-max items-center gap-10 whitespace-nowrap font-[family-name:var(--font-landing-display)] text-lg font-bold uppercase text-[var(--landing-on-ink)]/85 md:text-2xl"
          >
            {[0, 1].map((copy) => (
              <span key={copy} className="flex items-center gap-10" aria-hidden={copy === 1}>
                {memberIndex.map((item) => (
                  <span key={`${copy}-${item.label}`} className="flex items-center gap-4">
                    {item.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.logo} alt="" loading="lazy" className="size-8 rounded-full bg-white object-contain p-0.5 md:size-9" />
                    ) : null}
                    {item.label}
                    <span className="ml-6 text-sm text-[var(--landing-accent)]">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
