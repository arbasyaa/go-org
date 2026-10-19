import { officials } from "@/lib/landing/content"

export function OfficialsSection() {
  return (
    <section
      id="pengurus"
      aria-labelledby="pengurus-title"
      className="bg-[var(--landing-parchment)]/50"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2
          id="pengurus-title"
          className="font-[family-name:var(--font-landing-display)] text-3xl font-bold text-[var(--landing-ink)] md:text-4xl"
        >
          Badan Pengurus Wilayah
        </h2>
        <p className="mt-4 max-w-xl font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-ink-deep)]">
          Pengurus periode aktif, dipilih dari dan oleh himpunan anggota.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {officials.map((official) => (
            <li
              key={official.name}
              className="rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] p-5 text-[var(--landing-parchment)]"
            >
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-[var(--landing-radius-sm)] border border-[var(--landing-parchment)]/30 font-[family-name:var(--font-landing-label)] text-sm font-semibold"
                >
                  {initials(official.name)}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-landing-display)] text-base font-bold">
                    {official.name}
                  </h3>
                  <p className="mt-0.5 font-[family-name:var(--font-landing-body)] text-xs opacity-80">
                    {official.origin}
                  </p>
                </div>
              </div>
              <p className="mt-4 border-t border-[var(--landing-parchment)]/25 pt-3 font-[family-name:var(--font-landing-label)] text-[0.75rem] font-semibold tracking-[0.1em] uppercase opacity-90">
                {official.role}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
