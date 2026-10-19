import { memberDirectory } from "@/lib/landing/content"

export function MembersSection() {
  return (
    <section
      id="himpunan"
      aria-labelledby="himpunan-title"
      className="bg-[var(--landing-paper)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2
          id="himpunan-title"
          className="font-[family-name:var(--font-landing-display)] text-3xl font-bold text-[var(--landing-ink)] md:text-4xl"
        >
          Himpunan anggota
        </h2>
        <p className="mt-4 max-w-xl font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-deep)]">
          Direktori himpunan yang tergabung, dikelompokkan berdasarkan kota.
        </p>

        <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {memberDirectory.map((group) => (
            <section key={group.city} aria-label={`Himpunan di ${group.city}`}>
              <h3 className="border-b border-[var(--landing-ink)]/15 pb-2 font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.14em] text-[var(--landing-ink-soft)] uppercase">
                {group.city}
              </h3>
              <ul>
                {group.members.map((member) => (
                  <li
                    key={member}
                    className="border-b border-[var(--landing-ink)]/10 py-3 font-[family-name:var(--font-landing-body)] text-sm leading-snug text-[var(--landing-ink-deep)]"
                  >
                    {member}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
