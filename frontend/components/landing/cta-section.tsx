import { recruitmentCta } from "@/lib/landing/content"

export function CtaSection() {
  return (
    <section
      aria-labelledby="cta-title"
      className="landing-grid bg-[var(--landing-ink)] text-[var(--landing-parchment)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <h2
            id="cta-title"
            className="font-[family-name:var(--font-landing-display)] text-3xl font-bold md:text-4xl"
          >
            {recruitmentCta.title}
          </h2>
          <p className="mt-6 font-[family-name:var(--font-landing-body)] text-base leading-relaxed opacity-90">
            {recruitmentCta.body}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={recruitmentCta.primary.href}
              className="rounded-[var(--landing-radius-sm)] bg-[var(--landing-parchment)] px-5 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline hover:bg-white"
            >
              {recruitmentCta.primary.label}
            </a>
            <a
              href={recruitmentCta.secondary.href}
              className="rounded-[var(--landing-radius-sm)] border border-[var(--landing-parchment)]/40 px-5 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-parchment)] no-underline hover:border-[var(--landing-parchment)]"
            >
              {recruitmentCta.secondary.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
