import { aboutFacts, aboutParagraphs } from "@/lib/landing/content"

export function AboutSection() {
  return (
    <section
      id="tentang"
      aria-labelledby="tentang-title"
      className="bg-[var(--landing-paper)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 md:grid-cols-2 md:gap-16">
        <div>
          <h2
            id="tentang-title"
            className="font-[family-name:var(--font-landing-display)] text-3xl font-bold text-[var(--landing-ink)] md:text-4xl"
          >
            Tentang perhimpunan
          </h2>
          {aboutParagraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 24)}
              className="mt-6 font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-deep)]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <dl className="h-fit border-t border-[var(--landing-ink)]/15">
          {aboutFacts.map((fact) => (
            <div
              key={fact.term}
              className="grid grid-cols-[7rem_1fr] gap-4 border-b border-[var(--landing-ink)]/15 py-4"
            >
              <dt className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.14em] text-[var(--landing-ink-soft)] uppercase">
                {fact.term}
              </dt>
              <dd className="font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-ink-deep)]">
                {fact.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
