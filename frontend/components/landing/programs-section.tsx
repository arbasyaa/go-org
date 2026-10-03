import { programs } from "@/lib/landing/content"

export function ProgramsSection() {
  return (
    <section
      id="program"
      aria-labelledby="program-title"
      className="bg-[var(--landing-parchment)]/50"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2
          id="program-title"
          className="font-[family-name:var(--font-landing-display)] text-3xl font-bold text-[var(--landing-ink)] md:text-4xl"
        >
          Program kerja
        </h2>
        <p className="mt-4 max-w-xl font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-deep)]">
          agenda rutin yang menautkan seluruh himpunan anggota dalam satu
          kalender kegiatan wilayah.
        </p>

        <ul className="mt-10 border-t border-[var(--landing-ink)]/15">
          {programs.map((program) => (
            <li
              key={program.name}
              className="grid gap-2 border-b border-[var(--landing-ink)]/15 py-6 md:grid-cols-[1fr_auto] md:items-baseline md:gap-8"
            >
              <div className="md:max-w-xl">
                <h3 className="font-[family-name:var(--font-landing-display)] text-lg font-bold text-[var(--landing-ink)]">
                  {program.name}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-ink-deep)]">
                  {program.description}
                </p>
              </div>
              <span className="font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.14em] text-[var(--landing-ink-soft)] uppercase md:justify-self-end">
                {program.cadence}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
