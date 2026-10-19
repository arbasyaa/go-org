import { hero, memberIndex, org } from "@/lib/landing/content"

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="landing-grid bg-[var(--landing-ink)] text-[var(--landing-parchment)]"
    >
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-10 md:pt-28 md:pb-14">
        <div className="animate-fade-in-up">
          <p className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.18em] uppercase opacity-80">
            {hero.eyebrow} · {org.region}
          </p>
          <h1
            id="hero-title"
            className="mt-6 max-w-3xl font-[family-name:var(--font-landing-display)] text-4xl leading-tight font-bold md:text-5xl md:leading-tight"
          >
            {hero.title}
          </h1>
          <p className="mt-6 max-w-xl font-[family-name:var(--font-landing-body)] text-base leading-relaxed opacity-90">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={hero.primaryCta.href}
              className="rounded-[var(--landing-radius-sm)] bg-[var(--landing-parchment)] px-5 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline hover:bg-white"
            >
              {hero.primaryCta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              className="rounded-[var(--landing-radius-sm)] border border-[var(--landing-parchment)]/40 px-5 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-parchment)] no-underline hover:border-[var(--landing-parchment)]"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--landing-parchment)]/25">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4">
          <span className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.18em] uppercase opacity-70">
            Indeks anggota
          </span>
          <p className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-wider opacity-90">
            {memberIndex.join(" / ")}
          </p>
        </div>
      </div>
    </section>
  )
}
